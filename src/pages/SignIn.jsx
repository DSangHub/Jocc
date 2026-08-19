import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'

export default function SignIn() {
  const { user, ready } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (ready && user) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="shell page">
      <p className="eyebrow">Members</p>
      <h1 className="page-title">Sign in</h1>
      <p style={{ maxWidth: '42ch' }}>
        We send a one-time link. No password to keep track of, and nothing shared with
        the clubs beyond the name you choose.
      </p>

      {sent ? (
        <p className="notice is-good" style={{ maxWidth: '34rem', marginTop: '1.5rem' }}>
          Link sent to {email}. Open it on this device to finish signing in.
        </p>
      ) : (
        <form className="formgrid" onSubmit={submit} style={{ marginTop: '1.5rem' }}>
          <div className="field">
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="field-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="notice">{error}</p>}
          <div>
            <button className="btn is-filled" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send my link'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
