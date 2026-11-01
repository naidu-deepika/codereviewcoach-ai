import { useRef, useState } from 'react'
import { Check, Copy, Download, Loader2, Sparkles, AlertTriangle, Upload } from 'lucide-react'
import { createReview } from '../services/api.js'
import { downloadMarkdown } from '../utils/report.js'
import FindingCard from '../components/FindingCard.jsx'

const MAX_CHARS = 20000
const MAX_FILE_BYTES = 200 * 1024

// Only languages with a working analyzer can be chosen. The rest are shown but disabled.
const LANGUAGES = [
  { value: 'python', label: 'Python', ready: true, ext: '.py' },
  { value: 'java', label: 'Java', ready: false },
  { value: 'c', label: 'C', ready: false },
  { value: 'cpp', label: 'C++', ready: false },
  { value: 'javascript', label: 'JavaScript', ready: false },
  { value: 'typescript', label: 'TypeScript', ready: false },
  { value: 'csharp', label: 'C#', ready: false },
  { value: 'go', label: 'Go', ready: false },
  { value: 'rust', label: 'Rust', ready: false },
  { value: 'php', label: 'PHP', ready: false },
  { value: 'kotlin', label: 'Kotlin', ready: false },
  { value: 'swift', label: 'Swift', ready: false },
  { value: 'ruby', label: 'Ruby', ready: false },
  { value: 'sql', label: 'SQL', ready: false },
]

export default function NewReview() {
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [reviewedCode, setReviewedCode] = useState('')
  const fileInput = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    if (file.size > MAX_FILE_BYTES) {
      setError('That file is too large. Please choose a file under 200 KB.')
      return
    }
    try {
      const text = await file.text()
      if (text.includes('\u0000')) {
        setError('That does not look like a text file.')
        return
      }
      if (text.length > MAX_CHARS) {
        setError(`That file has more than ${MAX_CHARS.toLocaleString()} characters. Please upload a shorter file.`)
        return
      }
      setCode(text)
      setResult(null)
    } catch {
      setError('Could not read that file. Please try again.')
    }
  }

  async function handleSubmit() {
    if (loading) return
    if (!code.trim()) {
      setError('Paste some code first.')
      return
    }
    if (code.length > MAX_CHARS) {
      setError(`Your code is longer than ${MAX_CHARS.toLocaleString()} characters. Please shorten it.`)
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await createReview(code, language)
      setResult(data)
      setReviewedCode(code)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function copyCorrected() {
    try {
      await navigator.clipboard.writeText(result.corrected_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Could not copy. Select the code and copy it manually.')
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">New review</h1>
      <p className="mt-1 text-ink-faint">Paste your code, pick a language, and get feedback in seconds.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="rounded-xl2 bg-ink shadow-lifted">
            <div className="flex items-center justify-between gap-3 border-b border-ink-soft p-3">
              <label htmlFor="language" className="sr-only">Language</label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-lg border border-ink-faint bg-ink-soft px-3 py-2 text-sm text-paper"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value} disabled={!l.ready}>
                    {l.ready ? l.label : `${l.label} (coming soon)`}
                  </option>
                ))}
              </select>
              <input
                ref={fileInput}
                type="file"
                accept=".py,.txt,text/plain"
                onChange={handleFile}
                className="hidden"
                aria-label="Upload a code file"
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-paper-dim hover:text-white"
              >
                <Upload size={16} /> Upload file
              </button>
            </div>
            <label htmlFor="code" className="sr-only">Your code</label>
            <textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              placeholder="Paste your Python code here, or use Upload file..."
              className="code-scroll h-96 w-full resize-none bg-transparent p-4 font-mono text-sm text-paper outline-none placeholder:text-ink-faint"
            />
          </div>
          <p className={`mt-1 text-right text-xs ${code.length > MAX_CHARS ? 'text-crimson' : 'text-ink-faint'}`}>
            {code.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
          </p>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl2 bg-denim py-3 font-medium text-white hover:bg-denim-deep disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {loading ? 'Reviewing...' : 'Review my code'}
          </button>
          <p className="mt-2 text-xs text-ink-faint">
            Your code is analysed on our server and sent to Google Gemini for the AI part of the review.
          </p>
        </div>

        <div aria-live="polite" className="min-h-[28rem] rounded-xl2 bg-paper-card p-6 shadow-soft">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-crimson-tint p-3 text-sm text-crimson">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {loading && (
            <p className="mt-6 text-center text-ink-faint">Analysing your code. This can take up to 30 seconds.</p>
          )}

          {!loading && !result && !error && (
            <div className="grid h-full min-h-[24rem] place-items-center text-center">
              <div>
                <Sparkles className="mx-auto text-denim" />
                <p className="mt-2 font-medium text-ink">Ready to review your code</p>
                <p className="text-sm text-ink-faint">Choose a language and paste your code, or upload a file, to get started.</p>
              </div>
            </div>
          )}

          {result && (
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl text-ink">Review results</h2>
                <button
                  onClick={() => downloadMarkdown(result, reviewedCode)}
                  className="flex items-center gap-1 rounded-lg border border-paper-dim px-3 py-1.5 text-sm text-denim hover:bg-denim-tint"
                >
                  <Download size={14} />
                  Markdown
                </button>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{result.summary}</p>
              {typeof result.score === 'number' && (
                <div className="mt-4 rounded-lg bg-paper p-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-4xl text-ink">{result.score}</span>
                    <span className="text-ink-faint">/ 100 quality score</span>
                  </div>
                  <details className="mt-2 text-sm text-ink-soft">
                    <summary className="cursor-pointer text-denim">How is this calculated?</summary>
                    <ul className="mt-2 list-disc pl-5">
                      {result.score_details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-ink-faint">
                      This is an estimate based on the findings below. It does not prove the code is correct.
                    </p>
                  </details>
                </div>
              )}

              {result.findings.length === 0 ? (
                <p className="mt-4 text-sm text-ink">
                  No issues were found in this review. This does not prove the code is correct.
                </p>
              ) : (
                <>
                  <h3 className="mt-5 font-medium text-ink">Issues found ({result.findings.length})</h3>
                  <ul className="mt-2 space-y-3">
                    {result.findings.map((f, i) => (
                      <FindingCard key={i} finding={f} />
                    ))}
                  </ul>
                </>
              )}

              {result.corrected_code && (
                <div className="mt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-ink">Suggested corrected code</h3>
                    <button
                      onClick={copyCorrected}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-denim hover:bg-denim-tint"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="code-scroll mt-2 overflow-x-auto rounded-lg bg-ink p-4 font-mono text-sm text-paper">
                    {result.corrected_code}
                  </pre>
                  <p className="mt-1 text-xs text-ink-faint">
                    AI-generated corrections may need testing. Check the changes before using them.
                  </p>
                  {result.verification?.performed && (
                    <div className="mt-3 rounded-lg bg-paper p-3 text-sm text-ink-soft">
                      <p className="font-medium text-ink">Recheck of the corrected code</p>
                      <ul className="mt-1 list-disc pl-5">
                        {result.verification.checks.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
