import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: './store.json' },
  z.looseObject({
    turnSecret: z.string().catch(''),
    signalingSecret: z.string().catch(''),
    internalSecret: z.string().catch(''),
  }),
)
