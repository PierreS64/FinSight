import './App.css'
import { apiBaseUrl } from './config/api'

function App() {
  return (
    <main className="home">
      <p className="eyebrow">Personal Finance Intelligence Platform</p>
      <h1>FinSight</h1>
      <p>Build a clearer picture of your finances.</p>
      <small>API: {apiBaseUrl}</small>
    </main>
  )
}

export default App
