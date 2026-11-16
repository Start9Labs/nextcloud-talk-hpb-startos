import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  signalingHostId,
  signalingPort,
  turnExternalPort,
  turnHostId,
  turnInterfaceId,
  turnPort,
  turnsPort,
} from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // Bridge-only: Nextcloud proxies browsers to it on its own origin.
  await sdk.MultiHost.of(effects, signalingHostId).bindPort(signalingPort, {
    protocol: null,
    preferredExternalPort: signalingPort,
    addSsl: null,
    secure: { ssl: false },
  })

  const turnOrigin = await sdk.MultiHost.of(effects, turnHostId).bindPort(
    turnPort,
    {
      protocol: null,
      preferredExternalPort: turnExternalPort,
      secure: { ssl: false },
      addSsl: {
        preferredExternalPort: turnsPort,
        alpn: null,
      },
    },
  )
  const turnReceipt = await turnOrigin.export([
    sdk.createInterface(effects, {
      name: i18n('TURN Relay'),
      id: turnInterfaceId,
      description: i18n(
        "Carries every Talk call participant's audio and video to the media server",
      ),
      type: 'api',
      masked: false,
      schemeOverride: { ssl: 'turns', noSsl: 'turn' },
      username: null,
      path: '',
      query: {},
    }),
  ])

  return [turnReceipt]
})
