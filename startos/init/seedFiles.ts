import { signalingSecretFile, turnSecretFile } from '../fileModels/public'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { getSecret } from '../utils'

export const seedFiles = sdk.setupOnInit(async (effects) => {
  const store = await storeJson.read().once()
  const secrets = {
    turnSecret: store?.turnSecret || getSecret(),
    signalingSecret: store?.signalingSecret || getSecret(),
    internalSecret: store?.internalSecret || getSecret(),
  }
  await storeJson.merge(effects, secrets)
  await turnSecretFile.write(effects, secrets.turnSecret)
  await signalingSecretFile.write(effects, secrets.signalingSecret)
})
