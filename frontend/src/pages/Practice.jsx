import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPractice } from '../services/api.js'
import { Card, ErrorBox, Loading, PageHeader } from '../components/ui.jsx'

function Exercise({ item }) {
  const [hint, setHint] = useState(false)
  const [solution, setSolution] = useState(false)
  const code = 'code-scroll mt-2 overflow-x-auto rounded-lg bg-ink p-4 font-mono text-sm text-paper'
  return (
    <Card>
      <p className="text-xs text-ink-faint">{item.reason}</p>
      <h2 className="mt-1 font-serif text-xl text-ink">{item.title}</h2>
      <pre className={code}>{item.prompt}</pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => setHint((v) => !v)} className="rounded-lg border border-paper-dim px-3 py-1.5 text-sm text-denim hover:bg-denim-tint">
          {hint ? 'Hide hint' : 'Show hint'}
        </button>
        <button onClick={() => setSolution((v) => !v)} className="rounded-lg border border-paper-dim px-3 py-1.5 text-sm text-denim hover:bg-denim-tint">
          {solution ? 'Hide solution' : 'Show solution'}
        </button>
      </div>
      {hint && <p className="mt-3 rounded-lg bg-amber-tint p-3 text-sm text-ink">{item.hint}</p>}
      {solution && <pre className={code}>{item.solution}</pre>}
    </Card>
  )
}

export default function Practice() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getPractice().then(setData).catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <PageHeader
        title="Practice"
        subtitle="Short exercises based on the mistakes found in your own reviews."
      />
      {error && <ErrorBox message={error} />}
      {!data && !error && <Loading />}
      {data && (
        <div className="space-y-6">
          {data.based_on.length === 0 && (
            <p className="text-sm text-ink-soft">
              You have no repeated mistakes saved yet, so here are some warm-ups.{' '}
              <Link to="/review/new" className="font-medium text-denim">Run a review</Link> to get exercises
              matched to you.
            </p>
          )}
          {data.exercises.map((item) => (
            <Exercise key={item.id} item={item} />
          ))}
          <p className="text-xs text-ink-faint">
            Try each one in your own editor first. Exercises are written by hand and are not graded here.
          </p>
        </div>
      )}
    </div>
  )
}
