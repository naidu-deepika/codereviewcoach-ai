import { AlertTriangle, Loader2 } from 'lucide-react'

export function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="font-serif text-3xl text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-ink-faint">{subtitle}</p>}
    </div>
  )
}

export function Loading({ text = 'Loading...' }) {
  return (
    <p className="flex items-center gap-2 text-ink-faint">
      <Loader2 size={16} className="animate-spin" /> {text}
    </p>
  )
}

export function ErrorBox({ message }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-crimson-tint p-3 text-sm text-crimson">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      {message}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return <div className={`rounded-xl2 bg-paper-card p-6 shadow-soft ${className}`}>{children}</div>
}

export function Stat({ label, value }) {
  return (
    <Card>
      <p className="text-sm text-ink-faint">{label}</p>
      <p className="mt-1 font-serif text-4xl text-ink">{value}</p>
    </Card>
  )
}

export function Empty({ title, text, children }) {
  return (
    <Card className="text-center">
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-faint">{text}</p>
      {children}
    </Card>
  )
}

export const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl2 bg-denim px-5 py-2.5 font-medium text-white hover:bg-denim-deep disabled:opacity-60'

export function formatDate(iso, dateOnly = false) {
  const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`)
  if (dateOnly) {
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
