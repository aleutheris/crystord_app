import { readFileSync, writeFileSync } from 'fs'

const deployConfig = JSON.parse(readFileSync('deploy_config.json', 'utf-8'))
const active = deployConfig.active
const profile = deployConfig.profiles[active]

if (!profile) {
  console.error(`Unknown profile: "${active}". Available: ${Object.keys(deployConfig.profiles).join(', ')}`)
  process.exit(1)
}

const { oauthClient, ...rest } = profile

// Resolve the oauthClient reference into a concrete googleClientId.
// A null/absent reference means "no Google sign-in" and resolves to an empty string.
let googleClientId = ''
if (oauthClient != null) {
  googleClientId = deployConfig.oauthClients[oauthClient]
  if (googleClientId == null) {
    console.error(`Profile "${active}" references unknown oauthClient: "${oauthClient}". ` +
      `Available: ${Object.keys(deployConfig.oauthClients).join(', ')}`)
    process.exit(1)
  }
}

const runtimeConfig = { ...rest, googleClientId }

writeFileSync('public/config.json', JSON.stringify(runtimeConfig, null, 2) + '\n')
console.log(`config.json written for profile: ${active} (oauthClient: ${oauthClient ?? 'none'})`)
