import { readFileSync, writeFileSync } from 'fs'

const deployConfig = JSON.parse(readFileSync('deploy_config.json', 'utf-8'))

// Profile resolution precedence:
//   1. CRYSTORD_PROFILE env var — explicit override (used by ./serve and ad-hoc runs).
//   2. In CI (e.g. GitHub Actions sets CI=true) — `deployProfile`, the production
//      target. CI NEVER falls back to `active`, so a dev's local `active` value
//      cannot leak into a production deploy.
//   3. Otherwise (local dev) — `active`, the handy local/network testing knob.
const isCI = process.env.CI === 'true' || process.env.CI === '1'
const selected =
  process.env.CRYSTORD_PROFILE ?? (isCI ? deployConfig.deployProfile : deployConfig.active)

if (!selected) {
  console.error(
    isCI
      ? 'deploy_config.json: "deployProfile" is not set; refusing to build a production deploy without an explicit production profile.'
      : 'deploy_config.json: "active" is not set.',
  )
  process.exit(1)
}

const profile = deployConfig.profiles[selected]

if (!profile) {
  console.error(`Unknown profile: "${selected}". Available: ${Object.keys(deployConfig.profiles).join(', ')}`)
  process.exit(1)
}

// Defense in depth: never ship a localhost endpoint from a CI build.
if (isCI && typeof profile.graphqlEndpoint === 'string' && /localhost|127\.0\.0\.1/.test(profile.graphqlEndpoint)) {
  console.error(
    `Refusing to deploy: profile "${selected}" points at a local endpoint (${profile.graphqlEndpoint}).`,
  )
  process.exit(1)
}

const { oauthClient, ...rest } = profile

// Resolve the oauthClient reference into a concrete googleClientId.
// A null/absent reference means "no Google sign-in" and resolves to an empty string.
let googleClientId = ''
if (oauthClient != null) {
  googleClientId = deployConfig.oauthClients[oauthClient]
  if (googleClientId == null) {
    console.error(`Profile "${selected}" references unknown oauthClient: "${oauthClient}". ` +
      `Available: ${Object.keys(deployConfig.oauthClients).join(', ')}`)
    process.exit(1)
  }
}

const runtimeConfig = { ...rest, googleClientId }

writeFileSync('public/config.json', JSON.stringify(runtimeConfig, null, 2) + '\n')
console.log(`config.json written for profile: ${selected}${isCI ? ' (CI/deploy)' : ''} (oauthClient: ${oauthClient ?? 'none'})`)
