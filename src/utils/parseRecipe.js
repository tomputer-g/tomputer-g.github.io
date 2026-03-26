import yaml from 'js-yaml'

export function parseRecipe(rawMarkdown) {
  const match = rawMarkdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error('Recipe is missing YAML frontmatter')
  const data = yaml.load(match[1])
  const content = match[2]

  // Split body into per-node sections by ## headings
  const sections = {}
  const matches = [...content.matchAll(/^## (.+)$/gm)]
  for (let i = 0; i < matches.length; i++) {
    const id = matches[i][1].trim()
    const start = matches[i].index + matches[i][0].length
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length
    sections[id] = content.slice(start, end).trim()
  }

  // Transform frontmatter nodes: lift `label` and `icon` into ReactFlow's data object
  const nodes = (data.nodes ?? []).map(({ label, icon, ...rest }) => ({
    ...rest,
    data: { label, icon },
  }))

  return { title: data.title, nodes, edges: data.edges ?? [], sections, scale: data.scale ?? null, tags: data.tags ?? [] }
}
