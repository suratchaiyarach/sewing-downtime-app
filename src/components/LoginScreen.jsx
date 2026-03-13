import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ACCENT } from '../constants'

export default function LoginScreen() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError(err.message)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      {/* Logo / Title */}
      <div style={{ marginBottom: 36, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-disp)', fontSize: 40, color: ACCENT, letterSpacing: 4, lineHeight: 1 }}>
          DOWNTIME
        </div>
        <div style={{ fontFamily: 'var(--font-disp)', fontSize: 40, color: 'var(--text)', letterSpacing: 3, lineHeight: 1 }}>
          STUDY
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 3, marginTop: 6 }}>
          SEWING LINE — IE SYSTEM
        </div>
      </div>

      {/* Login card */}
      <form
        onSubmit={handleLogin}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '28px 24px',
          width: '100%',
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>
          SIGN IN
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1 }}>EMAIL</label>
          <input
            className="fi"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ fontSize: 15 }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1 }}>PASSWORD</label>
          <input
            className="fi"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ fontSize: 15 }}
          />
        </div>

        {error && (
          <div style={{
            fontSize: 12,
            color: 'var(--danger)',
            background: '#EF444415',
            border: '1px solid #EF444433',
            borderRadius: 8,
            padding: '8px 12px',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-amber"
          disabled={loading}
          style={{ marginTop: 4, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 4 }}>
          Contact your IE manager to get an account.
        </div>
      </form>
    </div>
  )
}
