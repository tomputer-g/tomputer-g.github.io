import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import SandboxPage from './pages/Sandbox.jsx'
import Recipes from './pages/Recipes.jsx'
import RecipePage from './pages/RecipePage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/sandbox" element={<SandboxPage />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/recipes/:slug" element={<RecipePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
