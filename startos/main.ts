import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  janusPort,
  natsConf,
  natsConfPath,
  natsPort,
  nextcloudHostId,
  nextcloudId,
  renderSignalingConf,
  renderTurnserverConf,
  rootCaPath,
  signalingConfPath,
  signalingPort,
  turnHostId,
  turnInterfaceId,
  turnPort,
  turnserverConfPath,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Nextcloud Talk HPB!'))

  const store = await storeJson.read().const(effects)
  if (!store?.turnSecret || !store.signalingSecret || !store.internalSecret) {
    throw new Error('store.json is missing its secrets')
  }

  const turnEndpoint = await sdk.host
    .getOwn(effects, turnHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === turnInterfaceId)
      const domains =
        iface?.addressInfo
          .filter({ visibility: 'public', kind: 'domain' })
          .hostnames.filter((h) => h.port != null) ?? []
      const domain = domains[0]?.hostname
      if (!domain) return null
      const forDomain = domains.filter((h) => h.hostname === domain)
      return {
        domain,
        turnPort: forDomain.find((h) => !h.ssl)?.port ?? null,
        turnsPort: forDomain.find((h) => h.ssl)?.port ?? null,
      }
    })
    .const()

  // Every HTTPS address of Nextcloud's web UI except Tor: the signaling server
  // authenticates each browser by calling back the address it loaded Talk from.
  const nextcloud = await sdk.host
    .get(
      effects,
      { packageId: nextcloudId, hostId: nextcloudHostId },
      (host) => {
        const iface =
          host &&
          Object.values(host.bindings)
            .flatMap((b) => Object.values(b.interfaces))
            .find((i) => i.id === 'ui')
        if (!iface) return { urls: [], mdns: [] }
        const https = iface.addressInfo.nonLocal.filter({
          exclude: { kind: 'plugin' },
          predicate: (h) => h.ssl,
        })
        return {
          urls: [
            ...new Set(https.format().map((u) => u.replace(/\/+$/, ''))),
          ].sort(),
          mdns: [
            ...new Set(
              https.filter({ kind: 'mdns' }).hostnames.map((h) => h.hostname),
            ),
          ].sort(),
        }
      },
    )
    .const()

  const containerIp = await sdk.getContainerIp(effects).const()

  const coturnSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'coturn' },
    null,
    'coturn',
  )
  await coturnSub.writeFile(
    turnserverConfPath,
    renderTurnserverConf({
      realm: turnEndpoint?.domain ?? 'nextcloud-talk-hpb',
      containerIp,
      secret: store.turnSecret,
    }),
  )

  const natsSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'nats' },
    null,
    'nats',
  )
  await natsSub.writeFile(natsConfPath, natsConf)

  const janusSub = sdk.SubContainer.of(
    effects,
    { imageId: 'janus' },
    null,
    'janus',
  )

  const signalingSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'signaling' },
    null,
    'signaling',
  )
  await signalingSub.writeFile(
    signalingConfPath,
    renderSignalingConf({
      backendUrls: nextcloud.urls,
      signalingSecret: store.signalingSecret,
      internalSecret: store.internalSecret,
    }),
  )
  // StartOS's mDNS names resolve only on the LAN; inside the container they
  // reach Nextcloud through the bridge, under this server's root CA.
  const osIp = await sdk.getOsIp(effects)
  await signalingSub.writeFile(
    '/etc/hosts',
    [
      '127.0.0.1 localhost',
      '::1 localhost',
      ...nextcloud.mdns.map((h) => `${osIp} ${h}`),
    ].join('\n') + '\n',
  )
  await signalingSub.writeFile(rootCaPath, await sdk.getRootCa(effects))

  return sdk.Daemons.of(effects)
    .addDaemon('nats', {
      subcontainer: natsSub,
      exec: { command: ['nats-server', '-c', natsConfPath] },
      ready: {
        display: null,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, natsPort, {
            successMessage: i18n('The message bus is ready'),
            errorMessage: i18n('The message bus is not ready'),
          }),
      },
      requires: [],
    })
    .addDaemon('janus', {
      subcontainer: janusSub,
      exec: { command: ['janus', '-F', '/etc/janus'] },
      ready: {
        display: i18n('Media Server'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, janusPort, {
            successMessage: i18n('The media server is ready'),
            errorMessage: i18n('The media server is not ready'),
          }),
      },
      requires: [],
    })
    .addDaemon('signaling', () =>
      nextcloud.urls.length
        ? {
            subcontainer: signalingSub,
            exec: {
              command: [
                '/usr/bin/nextcloud-spreed-signaling',
                '-config',
                signalingConfPath,
              ],
            },
            ready: {
              display: i18n('Signaling Server'),
              fn: () =>
                sdk.healthCheck.checkWebUrl(
                  effects,
                  `http://127.0.0.1:${signalingPort}/api/v1/welcome`,
                  {
                    successMessage: i18n('The signaling server is ready'),
                    errorMessage: i18n('The signaling server is not ready'),
                  },
                ),
            },
            requires: ['nats', 'janus'],
          }
        : null,
    )
    .addHealthCheck('nextcloud', () =>
      nextcloud.urls.length
        ? null
        : {
            ready: {
              display: i18n('Signaling Server'),
              trigger: sdk.trigger.statusTrigger(30_000, { failure: 30_000 }),
              fn: () => ({
                result: 'failure' as const,
                message: i18n(
                  'Waiting for Nextcloud. Install it, then add an HTTPS address to its Web UI interface.',
                ),
              }),
            },
            requires: [],
          },
    )
    .addDaemon('coturn', {
      subcontainer: coturnSub,
      exec: {
        command: ['turnserver', '-c', turnserverConfPath],
        user: 'nobody',
      },
      ready: {
        display: i18n('TURN Relay'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, turnPort, {
            successMessage: i18n('The TURN relay is ready'),
            errorMessage: i18n('The TURN relay is not ready'),
          }),
      },
      requires: [],
    })
    .addHealthCheck('turn-address', {
      ready: {
        display: i18n('TURN Relay Address'),
        trigger: sdk.trigger.statusTrigger(30_000, {
          starting: 5_000,
          failure: 5_000,
        }),
        fn: () =>
          turnEndpoint?.turnPort && turnEndpoint.turnsPort
            ? {
                result: 'success' as const,
                message: i18n(
                  'TURN and TURN over TLS are published on a public domain.',
                ),
              }
            : {
                result: 'disabled' as const,
                message: i18n(
                  'No public domain. Calls work only on your local network until you add one to the "TURN Relay" interface.',
                ),
              },
      },
      requires: [],
    })
})
