/** Ticker rules: at most 10 characters, from A-Z, 0-9, `$` and space. */
export const MAX_TICKER_LENGTH = 10
export const TICKER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$ '

/** Uppercases the input, drops every character that is not allowed, and keeps the first 10. */
export function sanitizeTicker(raw: string): string {
  let out = ''
  for (const ch of raw.toUpperCase()) {
    if (!TICKER_CHARS.includes(ch)) continue
    out += ch
    if (out.length >= MAX_TICKER_LENGTH) break
  }
  return out
}
