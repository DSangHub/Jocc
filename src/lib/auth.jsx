import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({ session: null, user: null, ready: false })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, ready }),
    [session, ready]
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

// A readable stand-in when someone hasn't set a display name yet.
export function shortName(user) {
  if (!user) return 'Someone'
  const meta = user.user_metadata?.display_name
  if (meta) return meta
  if (user.email) return user.email.split('@')[0]
  return 'Member'
}
