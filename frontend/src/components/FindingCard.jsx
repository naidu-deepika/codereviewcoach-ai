import { Bot, ShieldCheck } from 'lucide-react'

const SEVERITY = {
  high: 'bg-crimson-tint text-crimson',
  medium: 'bg-amber-tint text-ink',
  low: 'bg-denim-tint text-denim',
}

function lineLabel(f) {
  if (!f.line_start) return null
  if (f.line_end && f.line_end !== f.line_start) return `Lines ${f.line_start}-${f.line_end}`
  return `Line ${f.line_start}`
}

export default function FindingCard({ finding }) {
  const verified = finding.source === 'static_analysis'
  const line = lineLabel(finding)
  return (
    <li className="rounded-lg border border-paper-dim p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            verified ? 'bg-moss-tint text-moss' : 'bg-paper-dim text-ink-soft'
          }`}
        >
          {verified ? <ShieldCheck size={12} /> : <Bot size={12} />}
          {verified ? 'Verified check' : 'AI suggestion'}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY[finding.severity]}`}>
          {finding.severity}
        </span>
        <span className="text-xs text-ink-faint">{finding.category}</span>
        {line && <span className="text-xs text-ink-faint">{line}</span>}
      </div>
      <h3 className="mt-2 font-medium text-ink">{finding.message}</h3>
      <p className="mt-1 text-sm text-ink-soft">{finding.explanation}</p>
      {finding.suggested_fix && (
        <p className="mt-2 text-sm text-ink">
          <span className="font-medium">Fix: </span>
          {finding.suggested_fix}
        </p>
      )}
    </li>
  )
}
