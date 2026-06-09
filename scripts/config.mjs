import { readFileSync, writeFileSync } from 'fs'

const deployConfig = JSON.parse(readFileSync('deploy_config.json', 'utf-8'))
const active = deployConfig.active
const server = deployConfig.servers[active]

if (!server) {
  console.error(`Unknown server: "${active}". Available: ${Object.keys(deployConfig.servers).join(', ')}`)
  process.exit(1)
}

writeFileSync('public/config.json', JSON.stringify(server, null, 2) + '\n')
console.log(`config.json written for server: ${active}`)
