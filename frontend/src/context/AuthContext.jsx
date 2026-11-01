import { createContext, useContext, useEffect, useState } from 'react'
import * as api from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(api.getToken()))

  useEffect(() => {
    if (!api.getToken()) return
    api
      .fetchMe()
      .then(setUser)
      .catch((err) => {
        // Only forget the token if the server says it is invalid.
        if (err.status === 401) api.setToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function finish(promise) {
    const data = await promise
    api.setToken(data.access_token)
    setUser(data.user)
  }

  const value = {
    user,
    loading,
    signIn: (email, password) => finish(api.login(email, password)),
    signUp: (name, email, password) => finish(api.register(name, email, password)),
    updateUser: (changes) => setUser((current) => (current ? { ...current, ...changes } : current)),
    signOut: () => {
      api.setToken(null)
      setUser(null)
    },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
