import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'nextcloud-talk-hpb',
  title: 'Nextcloud Talk HPB',
  license: 'AGPL-3.0',
  packageRepo: 'https://github.com/Start9Labs/nextcloud-talk-hpb-startos',
  upstreamRepo: 'https://github.com/strukturag/nextcloud-spreed-signaling',
  marketingUrl:
    'https://nextcloud-talk.readthedocs.io/en/latest/quick-install/',
  donationUrl: null,
  description: { short, long },
  volumes: ['main', 'public'],
  images: {
    signaling: {
      source: { dockerTag: 'strukturag/nextcloud-spreed-signaling:2.2.0' },
      arch: ['x86_64', 'aarch64'],
    },
    janus: {
      source: { dockerBuild: { dockerfile: './janus.Dockerfile' } },
      arch: ['x86_64', 'aarch64'],
    },
    nats: {
      source: { dockerTag: 'nats:2.15.3-alpine' },
      arch: ['x86_64', 'aarch64'],
    },
    coturn: {
      source: { dockerTag: 'coturn/coturn:4.19.1' },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
