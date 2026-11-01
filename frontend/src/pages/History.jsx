import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Trash2 } from 'lucide-react'
import { SCORE_FILTERS, scoreStatus } from '../utils/score.js'
import { deleteReview, getReview, listReviews } from '../services/api.js'
import FindingCard from '../components/FindingCard.jsx'
import { Card, Empty, ErrorBox, Loading, PageHeader, buttonClass, formatDate } from '../components/ui.jsx'

function isoDate(iso) {
  return formatDate(iso, true)
}

export function HistoryList() {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState(null)
  const [error, setError] = useState('')
  const [language, setLanguage] = useState('all')
  const [scoreFilter, setScoreFilter] = useState('any')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    listReviews().then(setReviews).catch((e) => setError(e.message))
  }, [])

  const languages = reviews ? [...new Set(reviews.map((r) => r.language))] : []

  const shown = useMemo(() => {
    if (!reviews) return []
    const test = SCORE_FILTERS.find((f) => f.value === scoreFilter).test
    const list = reviews.filter(
      (r) => (language === 'all' || r.language === language) && (scoreFilter === 'any' || (r.score !== null && test(r.score)))
    )
    const byDate = (a, b) => new Date(a.created_at) - new Date(b.created_at) || a.id - b.id
    const sorters = {
      newest: (a, b) => byDate(b, a),
      oldest: byDate,
      high: (a, b) => (b.score ?? -1) - (a.score ?? -1),
      low: (a, b) => (a.score ?? 101) - (b.score ?? 101),
    }
    return [...list].sort(sorters[sort])
  }, [reviews, language, scoreFilter, sort])

  const select = 'rounded-lg border border-paper-dim bg-white px-3 py-1.5 text-sm text-ink'

  return (
    <div>
      <PageHeader title="Review history" subtitle="Every submission you've reviewed, in one place." />
      {error && <ErrorBox message={error} />}
      {!reviews && !error && <Loading />}
      {reviews && reviews.length === 0 && (
        <Empty title="No saved reviews yet" text="Reviews you run while signed in are saved here.">
          <Link to="/review/new" className={`${buttonClass} mt-4`}>Start a review</Link>
        </Empty>
      )}
      {reviews && reviews.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-faint">
            <label className="flex items-center gap-2">
              Language
              <select className={select} value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="all">All languages</option>
                {languages.map((l) => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              Score
              <select className={select} value={scoreFilter} onChange={(e) => setScoreFilter(e.target.value)}>
                {SCORE_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              Sort
              <select className={select} value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="high">Highest score</option>
                <option value="low">Lowest score</option>
              </select>
            </label>
          </div>

          {shown.length === 0 ? (
            <Empty title="No reviews match these filters" text="Change a filter to see more." />
          ) : (
            <div className="overflow-x-auto rounded-xl2 border border-paper-dim bg-paper-card shadow-soft">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="text-ink-faint">
                  <tr className="border-b border-paper-dim">
                    <th className="px-5 py-3 font-normal">Date</th>
                    <th className="px-5 py-3 font-normal">Language</th>
                    <th className="px-5 py-3 font-normal">Score</th>
                    <th className="px-5 py-3 font-normal">Issues</th>
                    <th className="px-5 py-3 font-normal">Status</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => {
                    const status = scoreStatus(r.score)
                    return (
                      <tr
                        key={r.id}
                        tabIndex={0}
                        onClick={() => navigate(`/history/${r.id}`)}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/history/${r.id}`)}
                        className="cursor-pointer border-b border-paper-dim last:border-0 hover:bg-paper"
                      >
                        <td className="px-5 py-4 text-ink">{isoDate(r.created_at)}</td>
                        <td className="px-5 py-4 capitalize text-ink">{r.language}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.tone}`}>
                            {r.score === null ? '-' : `${r.score}/100`}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-ink">{r.issue_count}</td>
                        <td className="px-5 py-4 text-ink">{status.label}</td>
                        <td className="pr-4 text-ink-faint"><ChevronRight size={16} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function HistoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [review, setReview] = useState(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!window.confirm('Delete this review? This cannot be undone.')) return
    setDeleting(true)
    try {
      await deleteReview(id)
      navigate('/history', { replace: true })
    } catch (e) {
      setError(e.message)
      setDeleting(false)
    }
  }

  useEffect(() => {
    setReview(null)
    setError('')
    getReview(id).then(setReview).catch((e) => setError(e.status === 404 ? 'Review not found.' : e.message))
  }, [id])

  return (
    <div>
      <Link to="/history" className="mb-4 inline-flex items-center gap-1 text-sm text-denim">
        <ArrowLeft size={14} /> Back to history
      </Link>
      {error && <ErrorBox message={error} />}
      {!review && !error && <Loading />}
      {review && (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <PageHeader title="Review" subtitle={formatDate(review.created_at)} />
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1 rounded-lg border border-paper-dim px-3 py-1.5 text-sm text-crimson hover:bg-crimson-tint disabled:opacity-60"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
          <Card>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-4xl text-ink">{review.score ?? '-'}</span>
              <span className="text-ink-faint">/ 100 quality score</span>
            </div>
            <p className="mt-2 text-sm text-ink-soft">{review.summary}</p>
            {review.score_details.length > 0 && (
              <details className="mt-2 text-sm text-ink-soft">
                <summary className="cursor-pointer text-denim">How is this calculated?</summary>
                <ul className="mt-2 list-disc pl-5">
                  {review.score_details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </details>
            )}
          </Card>

          <Card>
            <h2 className="font-medium text-ink">Issues found ({review.findings.length})</h2>
            {review.findings.length === 0 ? (
              <p className="mt-2 text-sm text-ink">No issues were found. This does not prove the code is correct.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {review.findings.map((f, i) => (
                  <FindingCard key={i} finding={f} />
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="font-medium text-ink">Your code</h2>
            <pre className="code-scroll mt-2 overflow-x-auto rounded-lg bg-ink p-4 font-mono text-sm text-paper">{review.code}</pre>
            {review.corrected_code && (
              <>
                <h2 className="mt-5 font-medium text-ink">Suggested corrected code</h2>
                <pre className="code-scroll mt-2 overflow-x-auto rounded-lg bg-ink p-4 font-mono text-sm text-paper">{review.corrected_code}</pre>
                <p className="mt-1 text-xs text-ink-faint">AI-generated corrections may need testing.</p>
                {review.verification?.performed && (
                  <ul className="mt-3 list-disc rounded-lg bg-paper p-3 pl-8 text-sm text-ink-soft">
                    {review.verification.checks.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
