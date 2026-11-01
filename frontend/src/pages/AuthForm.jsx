import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { GraduationCap, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { ErrorBox } from '../components/ui.jsx'

export default function AuthForm({ mode }) {
  const isSignUp = mode === 'signup'
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    setError('')
    if (isSignUp && password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setBusy(true)
    try {
      if (isSignUp) await signUp(name, email, password)
      else await signIn(email, password)
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const input =
    'mt-1 w-full rounded-lg border border-paper-dim bg-white px-3 py-2 text-ink outline-none focus:border-denim'

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-serif text-lg text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-denim text-white">
            <GraduationCap size={18} />
          </span>
          CodeReviewCoach-AI
        </Link>
        <form onSubmit={handleSubmit} className="rounded-xl2 bg-paper-card p-6 shadow-soft">
          <h1 className="font-serif text-2xl text-ink">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
          <div className="mt-4 space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="text-sm text-ink-soft">Name</label>
                <input id="name" className={input} value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoComplete="name" />
              </div>
            )}
            <div>
              <label htmlFor="email" className="text-sm text-ink-soft">Email</label>
              <input id="email" type="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label htmlFor="password" className="text-sm text-ink-soft">Password</label>
              <input id="password" type="password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={isSignUp ? 'new-password' : 'current-password'} />
              {isSignUp && <p className="mt-1 text-xs text-ink-faint">At least 8 characters.</p>}
            </div>
          </div>
          {error && <div className="mt-4"><ErrorBox message={error} /></div>}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl2 bg-denim py-2.5 font-medium text-white hover:bg-denim-deep disabled:opacity-60"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {isSignUp ? 'Sign up' : 'Sign in'}
          </button>
          <p className="mt-4 text-center text-sm text-ink-faint">
            {isSignUp ? 'Already have an account? ' : 'New here? '}
            <Link to={isSignUp ? '/signin' : '/signup'} className="font-medium text-denim">
              {isSignUp ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
