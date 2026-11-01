import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Dumbbell, FilePlus2, GraduationCap, History, LayoutDashboard, LogOut, TrendingUp, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/review/new', label: 'New Review', icon: FilePlus2 },
  { to: '/history', label: 'Review History', icon: History },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/practice', label: 'Practice', icon: Dumbbell },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  function handleSignOut() {
    signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="flex flex-col border-b border-paper-dim bg-paper-dim/40 p-4 md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-2 pb-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-denim text-white">
            <GraduationCap size={18} />
          </span>
          <span className="font-serif text-base text-ink">CodeReviewCoach-AI</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-denim text-white' : 'text-ink-soft hover:bg-paper-dim'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="mt-4 border-t border-paper-dim pt-4 md:mt-auto">
            <p className="truncate px-2 text-sm font-medium text-ink">{user.name}</p>
            <p className="truncate px-2 text-xs text-ink-faint">{user.email}</p>
            <button
              onClick={handleSignOut}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-paper-dim"
            >
              <LogOut size={18} /> Sign out
            </button>
          </div>
        )}
      </aside>
      <main className="min-w-0 flex-1 p-6 md:p-10">
        <Outlet />
      </main>
    </div>
  )
}
