import { Link } from 'react-router-dom'
import { GraduationCap, ListChecks, ShieldCheck, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { buttonClass } from '../components/ui.jsx'

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified checks and AI tips, kept apart',
    text: 'Python is analysed by real rules with exact line numbers. Gemini adds suggestions, clearly labelled.',
  },
  {
    icon: ListChecks,
    title: 'A score you can check',
    text: 'Every score shows how it was calculated. It is an estimate, never proof that code is correct.',
  },
  {
    icon: TrendingUp,
    title: 'See yourself improve',
    text: 'Your reviews are saved, so your dashboard and progress come from your real work.',
  },
]

export default function Home() {
  const { user, loading, signOut } = useAuth()
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between p-6">
        <span className="flex items-center gap-2 font-serif text-lg text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-denim text-white">
            <GraduationCap size={18} />
          </span>
          CodeReviewCoach-AI
        </span>
        <nav className="flex items-center gap-3 text-sm">
          {loading ? null : user ? (
            <>
              <span className="hidden text-ink-faint sm:inline">Signed in as {user.email}</span>
              <Link to="/dashboard" className="font-medium text-denim">Open dashboard</Link>
              <button onClick={signOut} className="rounded-lg border border-paper-dim px-3 py-1.5 font-medium text-ink-soft hover:bg-paper-dim">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/signin" className="font-medium text-denim">Sign in</Link>
              <Link to="/signup" className="rounded-lg bg-denim px-4 py-2 font-medium text-white hover:bg-denim-deep">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-10">
        <h1 className="max-w-2xl font-serif text-4xl text-ink md:text-5xl">
          Learn from every line of code you write.
        </h1>
        <p className="mt-4 max-w-xl text-ink-soft">
          Paste your Python code and get beginner-friendly feedback, a corrected version, and a score
          you can understand.
        </p>
        <div className="mt-6">
          <Link to={user ? '/review/new' : '/signup'} className={buttonClass}>
            {user ? 'Start a review' : 'Get started'}
          </Link>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl2 border border-paper-dim bg-paper-card p-6 shadow-soft">
              <Icon className="text-denim" />
              <h2 className="mt-3 font-medium text-ink">{title}</h2>
              <p className="mt-1 text-sm text-ink-soft">{text}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-ink-faint">
          Python only for now. Your code is sent to Google Gemini for the AI part of each review.
        </p>
      </main>
    </div>
  )
}
