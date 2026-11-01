const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const TOKEN_KEY = 'crc_token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable: the user stays signed in only until reload */
  }
}

async function request(path, { method = 'GET', body, timeout = 15000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    if (!res.ok) {
      let message = 'Something went wrong. Please try again.'
      let detail = null
      try {
        detail = (await res.json()).detail
      } catch {
        /* no JSON body */
      }
      if (typeof detail === 'string') message = detail
      else if (res.status === 422) message = 'Please check what you entered and try again.'
      const error = new Error(message)
      error.status = res.status
      throw error
    }
    if (res.status === 204) return null
    return await res.json()
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The request took too long. Please try again.')
    if (err instanceof TypeError) throw new Error('Cannot reach the server. Is the backend running?')
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export const createReview = (code, language = 'python') =>
  request('/reviews', { method: 'POST', body: { language, code }, timeout: 60000 })

export const register = (name, email, password) =>
  request('/auth/register', { method: 'POST', body: { name, email, password } })
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: { email, password } })
export const fetchMe = () => request('/auth/me')

export const listReviews = () => request('/reviews')
export const getReview = (id) => request(`/reviews/${id}`)
export const getDashboard = () => request('/dashboard')
export const getProgress = () => request('/progress')

export const getProfile = () => request('/profile')
export const updateProfile = (profile) => request('/profile', { method: 'PUT', body: profile })
export const deleteReview = (id) => request(`/reviews/${id}`, { method: 'DELETE' })
export const getPractice = () => request('/practice')
