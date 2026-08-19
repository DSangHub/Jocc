import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth, shortName } from '../lib/auth.jsx'
import QuiltBlock from '../lib/quilt.jsx'
import { categoryColors, categoryLabel } from '../lib/categories.js'

export default function ClubPage() {
  const { slug } = useParams()
  const { user, ready } = useAuth()

  const [club, setClub] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ok | missing
  const [isMember, setIsMember] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const [busy, setBusy] = useState(false)

  const [messages, setMessages] = useState([])
  const [names, setNames] = useState({})
  const [draft, setDraft] = useState('')
  const [chatError, setChatError] = useState('')
  const logRef = useRef(null)

  // --- club + membership ---
  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    supabase
      .from('jocc_club_directory')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        if (!data) return setStatus('missing')
        setClub(data)
        setMemberCount(Number(data.member_count ?? 0))
        setStatus('ok')
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (!club || !user) {
      setIsMember(false)
      return
    }
    let cancelled = false
    supabase
      .from('jocc_club_members')
      .select('user_id')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsMember(Boolean(data))
      })
    return () => {
      cancelled = true
    }
  }, [club, user])

  // --- names for the chat log ---
  const resolveNames = useCallback(async (ids) => {
    const missing = ids.filter((id) => id && !(id in names))
    if (!missing.length) return
    const { data } = await supabase
      .from('jocc_profiles')
      .select('id, display_name')
      .in('id', missing)
    const next = {}
    missing.forEach((id) => {
      next[id] = data?.find((p) => p.id === id)?.display_name || 'A member'
    })
    setNames((prev) => ({ ...prev, ...next }))
  }, [names])

  // --- messages + realtime ---
  useEffect(() => {
    if (!club || !isMember) {
      setMessages([])
      return
    }
    let cancelled = false

    supabase
      .from('jocc_messages')
      .select('*')
      .eq('club_id', club.id)
      .order('created_at', { ascending: true })
      .limit(200)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) return setChatError(error.message)
        setMessages(data ?? [])
        resolveNames([...new Set((data ?? []).map((m) => m.user_id))])
      })

    const channel = supabase
      .channel(`jocc:club:${club.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jocc_messages',
          filter: `club_id=eq.${club.id}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]
          )
          resolveNames([payload.new.user_id])
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
    // resolveNames is intentionally omitted: it changes with the name cache and
    // would tear down the subscription on every new speaker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club, isMember])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [messages])

  async function join() {
    if (!user || !club) return
    setBusy(true)
    const { error } = await supabase
      .from('jocc_club_members')
      .insert({ club_id: club.id, user_id: user.id })
    if (!error) {
      setIsMember(true)
      setMemberCount((n) => n + 1)
      await supabase.rpc('jocc_award_badge', { p_badge_type: 'joined_a_club' })
      await supabase
        .from('jocc_profiles')
        .upsert({ id: user.id, display_name: shortName(user) })
    }
    setBusy(false)
  }

  async function leave() {
    if (!user || !club) return
    setBusy(true)
    const { error } = await supabase
      .from('jocc_club_members')
      .delete()
      .eq('club_id', club.id)
      .eq('user_id', user.id)
    if (!error) {
      setIsMember(false)
      setMemberCount((n) => Math.max(0, n - 1))
    }
    setBusy(false)
  }

  async function send(e) {
    e.preventDefault()
    const body = draft.trim()
    if (!body || !user || !club) return
    setDraft('')
    const { error } = await supabase
      .from('jocc_messages')
      .insert({ club_id: club.id, user_id: user.id, body })
    if (error) {
      setChatError(error.message)
      setDraft(body)
    }
  }

  if (status === 'loading') {
    return (
      <div className="shell page">
        <p className="eyebrow">Loading…</p>
      </div>
    )
  }

  if (status === 'missing') {
    return (
      <div className="shell page">
        <Link className="backlink" to="/">
          ← All clubs
        </Link>
        <h1 className="page-title">No club at that address</h1>
        <p>It may have been renamed or closed. The directory has the current list.</p>
      </div>
    )
  }

  const place = [club.city, club.county && `${club.county} County`, club.state]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="shell">
      <div className="clubhead">
        <QuiltBlock seed={club.slug} colors={categoryColors(club.category)} size={132} />
        <div>
          <Link className="backlink" to="/">
            ← All clubs
          </Link>
          <h1 className="clubhead-title">{club.name}</h1>
          <p className="clubcard-blurb" style={{ fontSize: '1.0625rem' }}>
            {club.blurb}
          </p>
          <div className="clubhead-meta">
            <span>{categoryLabel(club.category)}</span>
            {place && <span>{place}</span>}
            {club.meeting_note && <span>{club.meeting_note}</span>}
            <span>
              {memberCount} member{memberCount === 1 ? '' : 's'}
            </span>
            {club.is_verified && (
              <span className="verified">
                <span className="verified-dot" aria-hidden="true" />
                Verified
              </span>
            )}
          </div>
          {ready && !user && (
            <Link className="btn is-filled" to="/signin">
              Sign in to join
            </Link>
          )}
          {ready && user && !isMember && (
            <button className="btn is-filled" onClick={join} disabled={busy}>
              {busy ? 'Joining…' : 'Join this club'}
            </button>
          )}
          {ready && user && isMember && (
            <button className="btn" onClick={leave} disabled={busy}>
              {busy ? 'Leaving…' : 'Leave club'}
            </button>
          )}
        </div>
      </div>

      <hr className="stitchline" />

      <div className="clubbody">
        <div className="prose">
          <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>
            About
          </p>
          {(club.description || club.blurb)
            .split('\n')
            .filter(Boolean)
            .map((para, i) => (
              <p key={i}>{para}</p>
            ))}
        </div>

        <div className="panel">
          <h2 className="panel-title">Club room</h2>
          {!isMember ? (
            <p className="chat-locked">
              The room opens once you join. Members talk here between meetings — swaps,
              cancellations, and who is bringing what.
            </p>
          ) : (
            <>
              <div className="chat-log" ref={logRef}>
                {messages.length === 0 && (
                  <p className="chat-locked">
                    Nothing said yet. Say hello and mention what you're working on.
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`chat-msg${m.user_id === user?.id ? ' is-mine' : ''}`}
                  >
                    <span className="chat-who">
                      {m.user_id === user?.id ? 'You' : names[m.user_id] || 'A member'} ·{' '}
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    <p className="chat-body">{m.body}</p>
                  </div>
                ))}
              </div>
              {chatError && <p className="notice">{chatError}</p>}
              <form className="chat-form" onSubmit={send}>
                <input
                  className="chat-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write to the club"
                  maxLength={1000}
                  aria-label="Message the club"
                />
                <button className="btn is-filled" type="submit" disabled={!draft.trim()}>
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
