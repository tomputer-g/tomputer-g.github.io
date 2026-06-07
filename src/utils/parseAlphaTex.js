export function parseAlphaTexMeta(content) {
  const meta = {}

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (line === '.') break

    // Custom fields in comments: // key: value
    const comment = line.match(/^\/\/\s*(\w+)\s*:\s*(.+)$/)
    if (comment) {
      meta[comment[1].toLowerCase()] = comment[2].trim()
      continue
    }

    // Quoted directive: \key "value"
    const quoted = line.match(/^\\(\w+)\s+"([^"]*)"/)
    if (quoted) {
      meta[quoted[1].toLowerCase()] = quoted[2]
      continue
    }

    // Unquoted directive: \key value
    const unquoted = line.match(/^\\(\w+)\s+(\S+)/)
    if (unquoted) {
      meta[unquoted[1].toLowerCase()] = unquoted[2]
    }
  }

  return meta
}
