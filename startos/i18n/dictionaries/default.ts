export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Nextcloud Talk HPB!': 0,
  'The message bus is ready': 1,
  'The message bus is not ready': 2,
  'Media Server': 3,
  'The media server is ready': 4,
  'The media server is not ready': 5,
  'Signaling Server': 6,
  'The signaling server is ready': 7,
  'The signaling server is not ready': 8,
  'Waiting for Nextcloud. Install it, then add an HTTPS address to its Web UI interface.': 9,
  'TURN Relay': 10,
  'The TURN relay is ready': 11,
  'The TURN relay is not ready': 12,
  'TURN Relay Address': 13,
  'TURN and TURN over TLS are published on a public domain.': 14,
  'No public domain. Calls work only on your local network until you add one to the "TURN Relay" interface.': 15,

  // interfaces.ts
  "Carries every Talk call participant's audio and video to the media server": 16,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
