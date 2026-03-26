const COLORS = [
  { bg: '#e8f5e9', color: '#2e7d32' }, // green
  { bg: '#e3f2fd', color: '#1565c0' }, // blue
  { bg: '#fff3e0', color: '#e65100' }, // orange
  { bg: '#f3e5f5', color: '#6a1b9a' }, // purple
  { bg: '#fce4ec', color: '#880e4f' }, // pink
  { bg: '#e0f7fa', color: '#006064' }, // cyan
  { bg: '#fff8e1', color: '#f57f17' }, // amber
  { bg: '#e8eaf6', color: '#283593' }, // indigo
  { bg: '#f1f8e9', color: '#33691e' }, // light green
  { bg: '#fbe9e7', color: '#bf360c' }, // deep orange
  { bg: '#e0f2f1', color: '#004d40' }, // teal
  { bg: '#ede7f6', color: '#4527a0' }, // deep purple
  { bg: '#e1f5fe', color: '#01579b' }, // light blue
  { bg: '#f9fbe7', color: '#827717' }, // lime
  { bg: '#fdf3e7', color: '#795548' }, // brown
  { bg: '#eceff1', color: '#37474f' }, // blue grey
]

export function tagColor(tag) {
  let hash = 0
  for (const c of tag.toLowerCase()) {
    hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}
