import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import './App.css'
import { apiBaseUrl } from './config/api'
import { supabase } from './config/supabase'
import { registrationOutcome, signInErrorMessage, validateRegistration } from './registration'

type AuthenticatedUser = { id: string; email: string | null }

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [apiStatus, setApiStatus] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signUp, setSignUp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!supabase) return
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session)
    }).catch(() => {
      if (active) setNotice('Could not restore the previous session.')
    }).finally(() => {
      if (active) setAuthReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession)
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.access_token) {
      setUser(null)
      setApiStatus('')
      return
    }
    const controller = new AbortController()
    setApiStatus('Checking API access…')
    void fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) throw new Error('API rejected the session')
      const identity = await response.json() as AuthenticatedUser
      if (controller.signal.aborted) return
      setUser(identity)
      setApiStatus('API access confirmed')
    }).catch(() => {
      if (!controller.signal.aborted) {
        setUser(null)
        setApiStatus('API access unavailable')
      }
    })
    return () => controller.abort()
  }, [session?.access_token])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || busy) return
    setBusy(true)
    setNotice('')
    try {
      if (signUp) {
        const validated = validateRegistration(fullName, email, password)
        if (!validated.ok) {
          setNotice(validated.message)
          return
        }
        const { data, error } = await supabase.auth.signUp({
          email: validated.email,
          password,
          options: { data: { full_name: validated.fullName } },
        })
        const outcome = registrationOutcome(data, error)
        setNotice(outcome.message)
        if (outcome.kind !== 'error') setPassword('')
      } else {
        if (!email.trim() || !password) {
          setNotice('Enter your email and password.')
          return
        }
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) setNotice(signInErrorMessage(error))
        else setPassword('')
      }
    } catch {
      setNotice(signUp ? 'Registration is unavailable. Please try again.' : 'Authentication is temporarily unavailable. Please try again later.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="home">
      <p className="eyebrow">Personal Finance Intelligence Platform</p>
      <h1>FinSight</h1>
      <p>Build a clearer picture of your finances.</p>
      {!supabase ? (
        <p className="notice">Set the public Supabase URL and publishable key in the web environment to enable sign-in.</p>
      ) : !authReady ? (
        <p className="status" role="status">Restoring session…</p>
      ) : session ? (
        <section className="auth-card">
          <h2>Your session</h2>
          <p>{user?.email ?? session.user.email ?? 'Signed in'}</p>
          <p className="status" role="status">{apiStatus}</p>
          {notice && <p role="status" className="notice">{notice}</p>}
          <button type="button" onClick={() => void supabase?.auth.signOut()}>Sign out</button>
        </section>
      ) : (
        <section className="auth-card">
          <h2>{signUp ? 'Create account' : 'Sign in'}</h2>
          <form noValidate onSubmit={(event) => void submit(event)}>
            {signUp && <label>Full name<input type="text" autoComplete="name" maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} required /></label>}
            <label>Email<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>Password<input type="password" autoComplete={signUp ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            {signUp && <p className="status">Use at least 8 characters. Supabase may require a stronger password.</p>}
            <button type="submit" disabled={busy}>{busy ? 'Please wait…' : signUp ? 'Create account' : 'Sign in'}</button>
          </form>
          <button className="switch" type="button" onClick={() => { setSignUp(!signUp); setNotice('') }}>
            {signUp ? 'Already have an account? Sign in' : 'New to FinSight? Create an account'}
          </button>
          {notice && <p role="status" className="notice">{notice}</p>}
        </section>
      )}
    </main>
  )
}

export default App
