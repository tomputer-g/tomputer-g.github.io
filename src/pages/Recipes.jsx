import { Link } from 'react-router-dom'
import { parseRecipe } from '../utils/parseRecipe'
import { tagColor } from '../utils/tagColor'

const rawModules = import.meta.glob('../data/recipes/*.md', { query: '?raw', import: 'default', eager: true })

const recipes = Object.entries(rawModules).map(([path, raw]) => {
  const slug = path.match(/\/([^/]+)\.md$/)[1]
  const { title, tags } = parseRecipe(raw)
  return { slug, title, tags }
})

export default function Recipes() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Recipes</h1>
      <p>Welcome to my recipe collection. More recipes coming soon!</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {recipes.map((recipe) => (
          <li key={recipe.slug} style={{ marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to={`/recipes/${recipe.slug}`}>{recipe.title}</Link>
            {recipe.tags.map((tag) => {
              const { bg, color } = tagColor(tag)
              return (
                <span key={tag} style={{
                  background: bg,
                  color,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}>
                  {tag}
                </span>
              )
            })}
          </li>
        ))}
      </ul>
    </div>
  )
}
