import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getDashboard } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Card, Empty, ErrorBox, Loading, PageHeader, Stat, buttonClass } from '../components/ui.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboard().then(setData).catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <PageHeader title={`Hello, ${user.name}`} subtitle="Your progress, based on your saved reviews." />
      {error && <ErrorBox message={error} />}
      {!data && !error && <Loading />}
      {data && data.total_reviews === 0 && (
        <Empty title="No reviews yet" text="Run your first review and your numbers will appear here.">
          <Link to="/review/new" className={`${buttonClass} mt-4`}>Start a review</Link>
        </Empty>
      )}
      {data && data.total_reviews > 0 && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Reviews" value={data.total_reviews} />
            <Stat label="Average score" value={data.average_score} />
            <Stat label="Issues found" value={data.total_issues} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="font-medium text-ink">Most common mistakes</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.common_mistakes.map((m) => (
                  <li key={m.message} className="flex justify-between gap-3">
                    <span className="text-ink-soft">{m.message}</span>
                    <span className="font-medium text-ink">{m.count}</span>
                  </li>
                ))}
                {data.common_mistakes.length === 0 && <li className="text-ink-faint">No issues found so far.</li>}
              </ul>
              <h2 className="mt-6 font-medium text-ink">Languages practised</h2>
              <ul className="mt-2 text-sm text-ink-soft">
                {data.languages.map((l) => (
                  <li key={l.language} className="flex justify-between">
                    <span className="capitalize">{l.language}</span>
                    <span>{l.count}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h2 className="font-medium text-ink">Reviews over time</h2>
              <div className="mt-3 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.reviews_over_time}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE1" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Reviews" fill="#2F4C7A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
