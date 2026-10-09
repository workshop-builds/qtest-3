// Checks that the built page loads nothing from other sites: no script, link, img (or similar) tag
// may point to an external URL. Runs after `vite build` (see package.json) and is unit tested.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const TAG = /<(script|link|img|source|iframe|video|audio|embed|object|input|image|use)\b[^>]*>/gi
const ATTR = /\b(src|href|srcset|poster|data|xlink:href|action|formaction)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi
const EXTERNAL = /^\s*(?:[a-z][a-z0-9+.-]*:)?\/\//i

/** @param {string} html @returns {string[]} the external URLs found in resource-loading tags */
export function findExternalUrls(html) {
  const found = []
  for (const tag of html.match(TAG) ?? []) {
    for (const m of tag.matchAll(ATTR)) {
      const value = m[3] ?? m[4] ?? m[5] ?? ''
      // srcset holds several comma-separated URLs.
      const urls = m[1].toLowerCase() === 'srcset' ? value.split(',').map((u) => u.trim().split(/\s+/)[0]) : [value]
      for (const u of urls) if (EXTERNAL.test(u) || /^\s*(?:https?|ftp|ws|wss):/i.test(u)) found.push(u)
    }
  }
  return found
}

/** CSS `url(...)` and `@import` pointing to another site. */
export function findExternalCssUrls(css) {
  const found = []
  for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) if (EXTERNAL.test(m[1])) found.push(m[1])
  for (const m of css.matchAll(/@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/gi)) if (EXTERNAL.test(m[1])) found.push(m[1])
  return [...new Set(found)]
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

/** @returns {string[]} problems found in a built directory (empty when clean) */
export function checkDist(dir) {
  if (!existsSync(join(dir, 'index.html'))) return [`${dir}/index.html is missing`]
  const problems = []
  for (const file of walk(dir)) {
    const text = file.endsWith('.html') || file.endsWith('.css') ? readFileSync(file, 'utf8') : ''
    if (file.endsWith('.html')) for (const u of findExternalUrls(text)) problems.push(`${file}: ${u}`)
    if (file.endsWith('.css')) for (const u of findExternalCssUrls(text)) problems.push(`${file}: ${u}`)
  }
  return problems
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = resolve(process.argv[2] ?? 'dist')
  const problems = checkDist(dir)
  if (problems.length) {
    console.error('External URLs in the build:\n' + problems.join('\n'))
    process.exit(1)
  }
  console.log(`dist check passed: no external URLs in ${dir}`)
}
