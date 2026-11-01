import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Loader2, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getProfile, updateProfile } from '../services/api.js'
import { Card, ErrorBox, Loading, PageHeader, formatDate } from '../components/ui.jsx'

const LANGUAGES = [
  'Python', 'Java', 'C', 'C++', 'JavaScript', 'TypeScript', 'C#',
  'Go', 'Rust', 'PHP', 'Kotlin', 'Swift', 'Ruby', 'SQL',
]
const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export default function Profile() {
  const { signOut, updateUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [name, setName] = useState('')
  const [level, setLevel] = useState('beginner')
  const [languages, setLanguages] = useState([])
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  function fill(p) {
    setProfile(p)
    setName(p.name)
    setLevel(p.experience_level)
    setLanguages(p.languages)
  }

  useEffect(() => {
    getProfile().then(fill).catch((e) => setLoadError(e.message))
  }, [])

  function toggle(lang) {
    setSaved(false)
    setLanguages((cur) => (cur.includes(lang) ? cur.filter((l) => l !== lang) : [...cur, lang]))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (saving) return
    setSaveError('')
    setSaved(false)
    if (!name.trim()) {
      setSaveError('Name must not be empty.')
      return
    }
    setSaving(true)
    try {
      const updated = await updateProfile({ name, experience_level: level, languages })
      fill(updated)
      updateUser({ name: updated.name })
      setSaved(true)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleSignOut() {
    signOut()
    navigate('/', { replace: true })
  }

  const field = 'mt-2 w-full rounded-lg border border-paper-dim bg-white px-3 py-3 text-ink outline-none focus:border-denim'

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account and review preferences." />
      {loadError && <ErrorBox message={loadError} />}
      {!profile && !loadError && <Loading />}
      {profile && (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <form onSubmit={handleSave} className="rounded-xl2 bg-paper-card p-6 shadow-soft">
            <label htmlFor="name" className="block text-sm font-medium text-ink">Name</label>
            <input id="name" className={field} value={name} maxLength={100} onChange={(e) => { setName(e.target.value); setSaved(false) }} />

            <label htmlFor="email" className="mt-5 block text-sm font-medium text-ink">Email</label>
            <input id="email" className={`${field} bg-paper-dim text-ink-faint`} value={profile.email} disabled readOnly />

            <label htmlFor="level" className="mt-5 block text-sm font-medium text-ink">Experience level</label>
            <select id="level" className={field} value={level} onChange={(e) => { setLevel(e.target.value); setSaved(false) }}>
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>

            <p className="mt-5 text-sm font-medium text-ink">Languages you review</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const on = languages.includes(lang)
                return (
                  <button
                    key={lang}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(lang)}
                    className={`rounded-full border px-4 py-2 text-sm ${
                      on ? 'border-denim bg-denim text-white' : 'border-paper-dim bg-white text-ink hover:bg-paper'
                    }`}
                  >
                    {lang}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-ink-faint">
              This is a preference only. Reviews are available for Python for now.
            </p>

            {saveError && <div className="mt-4"><ErrorBox message={saveError} /></div>}
            <div className="mt-5 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl2 bg-denim px-5 py-3 font-medium text-white hover:bg-denim-deep disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Save changes
              </button>
              {saved && (
                <span role="status" className="inline-flex items-center gap-1 text-sm text-moss">
                  <Check size={16} /> Saved
                </span>
              )}
            </div>
          </form>

          <div className="space-y-4">
            <Card>
              <h2 className="font-medium text-ink">Account</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Total reviews</dt>
                  <dd className="text-ink">{profile.total_reviews}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-faint">Member since</dt>
                  <dd className="text-ink">{formatDate(profile.member_since, true)}</dd>
                </div>
              </dl>
            </Card>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl2 border border-paper-dim bg-paper-card py-3 text-sm text-ink hover:bg-paper"
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
