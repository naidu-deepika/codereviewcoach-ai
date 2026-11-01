import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getProgress } from '../services/api.js'
import { Card, Empty, ErrorBox, Loading, PageHeader, Stat, buttonClass } from '../components/ui.jsx'

export default function Progress() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getProgress().then(setData).catch((e) => setError(e.message))
  }, [])

  const chart = data?.score_trend.map((p, i) => ({ n: i + 1, score: p.score }))
  const change = data ? (data.change > 0 ? `+${data.change}` : String(data.change)) : ''

  return (
    <div>
      <PageHeader title="Your progress" subtitle="How your score changes from review to review." />
      {error && <ErrorBox message={error} />}
      {!data && !error && <Loading />}
      {data && data.score_trend.length === 0 && (
        <Empty title="Nothing to show yet" text="Complete a review and your score history will appear here.">
          <Link to="/review/new" className={`${buttonClass} mt-4`}>Start a review</Link>
        </Empty>
      )}
      {data && data.score_trend.length > 0 && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="First score" value={data.first_score} />
            <Stat label="Latest score" value={data.latest_score} />
            <Stat label="Best score" value={data.best_score} />
            <Stat label="Change" value={change} />
          </div>
          <Card>
            <h2 className="font-medium text-ink">Score over your reviews</h2>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE1" />
                  <XAxis dataKey="n" tick={{ fontSize: 11 }} label={{ value: 'Review number', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" name="Score" stroke="#2F4C7A" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
