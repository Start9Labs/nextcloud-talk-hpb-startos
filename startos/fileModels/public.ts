import { FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Nextcloud mounts the `public` volume read-only to configure Talk with these.
export const turnSecretFile = FileHelper.string({
  base: sdk.volumes.public,
  subpath: './turn-secret',
})

export const signalingSecretFile = FileHelper.string({
  base: sdk.volumes.public,
  subpath: './signaling-secret',
})
