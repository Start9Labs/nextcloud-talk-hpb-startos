import { utils } from '@start9labs/start-sdk'

export const signalingHostId = 'signaling'
export const signalingPort = 8081

export const turnHostId = 'turn'
export const turnInterfaceId = 'turn'
export const turnPort = 3478
// Clear of standalone Coturn's 3478 and Jitsi's 3479.
export const turnExternalPort = 3480
export const turnsPort = 443

export const janusPort = 8188
export const natsPort = 4222

export const nextcloudId = 'nextcloud'
export const nextcloudHostId = 'main'

export const maxStreamBitrate = 1048576
export const maxScreenBitrate = 2097152

export const signalingConfPath = '/config/server.conf'
export const natsConfPath = '/etc/nats.conf'
export const turnserverConfPath = '/etc/turnserver.conf'
export const rootCaPath = '/etc/ssl/certs/startos-root-ca.pem'

export const getSecret = () =>
  utils.getDefaultString({ charset: 'a-f,0-9', len: 64 })

// Janus is reachable only through this relay: every peer but the container's
// own address is denied.
export function renderTurnserverConf(cfg: {
  realm: string
  containerIp: string
  secret: string
}): string {
  return (
    [
      `listening-port=${turnPort}`,
      'no-tls',
      'no-tcp-relay',
      `relay-ip=${cfg.containerIp}`,
      `realm=${cfg.realm}`,
      `server-name=${cfg.realm}`,
      'fingerprint',
      'use-auth-secret',
      `static-auth-secret=${cfg.secret}`,
      'no-multicast-peers',
      `allowed-peer-ip=${cfg.containerIp}`,
      'denied-peer-ip=0.0.0.0-255.255.255.255',
      'denied-peer-ip=::-ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      'pidfile=/tmp/turnserver.pid',
      'log-file=stdout',
    ].join('\n') + '\n'
  )
}

export function renderSignalingConf(cfg: {
  backendUrls: string[]
  signalingSecret: string
  internalSecret: string
}): string {
  return (
    [
      '[http]',
      `listen = :${signalingPort}`,
      '[app]',
      'debug = false',
      '[sessions]',
      `hashkey = ${utils.getDefaultString({ charset: 'a-f,0-9', len: 32 })}`,
      `blockkey = ${utils.getDefaultString({ charset: 'a-f,0-9', len: 32 })}`,
      '[clients]',
      `internalsecret = ${cfg.internalSecret}`,
      '[backend]',
      'backends = nextcloud',
      'allowall = false',
      'timeout = 10',
      'connectionsperhost = 32',
      '[nextcloud]',
      `urls = ${cfg.backendUrls.join(', ')}`,
      `secret = ${cfg.signalingSecret}`,
      `maxstreambitrate = ${maxStreamBitrate}`,
      `maxscreenbitrate = ${maxScreenBitrate}`,
      '[nats]',
      `url = nats://127.0.0.1:${natsPort}`,
      '[mcu]',
      'type = janus',
      `url = ws://127.0.0.1:${janusPort}`,
      `maxstreambitrate = ${maxStreamBitrate}`,
      `maxscreenbitrate = ${maxScreenBitrate}`,
    ].join('\n') + '\n'
  )
}

export const natsConf =
  [
    `listen: 127.0.0.1:${natsPort}`,
    'write_deadline: "10s"',
    'max_payload: 8MB',
  ].join('\n') + '\n'
