import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const root = new URL('../', import.meta.url)
test('package exposes one standard DSH bundle', async () => {
  const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'))
  assert.equal(pkg.name, 'dsh-token-monitor'); assert.equal(pkg.version, '1.1.0'); assert.equal(pkg.main, './src/index.mjs')
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml'); assert.equal(pkg.dsh.client.platform, 'web'); assert.equal(pkg.license, 'MIT')
  for (const key of ['preinstall', 'install', 'postinstall', 'prepare']) assert.equal(pkg.scripts[key], undefined)
})
test('bundle adds only its own entry and client registers the Token tab', async () => {
  const patch = await readFile(new URL('cordis.patch.yml', root), 'utf8'); const client = await readFile(new URL('src/client.js', root), 'utf8'); const host = await readFile(new URL('src/index.mjs', root), 'utf8')
  assert.match(patch, /id: dsh-token-monitor/); assert.doesNotMatch(patch, /remove:|disable:|replace:/); assert.match(client, /window\.__ModuleLoader__\.load/); assert.match(client, /settings\.plugins\.tab/); assert.match(client, /projectionValues\?\.tokenUsage/); assert.doesNotMatch(host, /\breadFile\s*\(|\bwriteFile\s*\(|\bexec\s*\(|\bspawn\s*\(|\bfetch\s*\(/)
})
