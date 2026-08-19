import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth, shortName } from '../lib/auth.jsx'
import QuiltBlock from '../lib/quilt.jsx'
import { CATEGORIES, CATEGORY_KEYS, categoryColors } from '../lib/categories.js'

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)

export default function NewClub() {
  const { user, ready } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    blurb: '',
    description: '',
    category: 'sewing',
    meeting_note: '',
    city: '',
    county: '',
    state: '',
    zip_code: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const slug = useMemo(() => slugify(form.name), [form.name])
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    setError('')

    const { error } = await supabase.from('jocc_clubs').insert({
      ...form,
      slug,
      created_by: user.id,
      latitude: null,
      longitude: null,
    })

    if (error) {
      setBusy(false)
      setError(
        error.code === '23505'
          ? 'A club already uses that name. Try a more specific one.'
          : error.message
      )
      return
    }

    const { data: created } = await supabase
      .from('jocc_clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (created) {
      await supabase
        .from('jocc_club_members')
        .insert({ club_id: created.id, user_id: user.id, role: 'steward' })
      await supabase
        .from('jocc_profiles')
        .upsert({ id: user.id, display_name: shortName(user) })
      await supabase.rpc('jocc_award_badge', { p_badge_type: 'started_a_club' })
    }

    navigate(`/clubs/${slug}`)
  }

  if (ready && !user) {
    return (
      <div className="shell page">
        <p className="eyebrow">Start a club</p>
        <h1 className="page-title">Sign in first</h1>
        <p style={{ maxWidth: '42ch' }}>
          Clubs are tied to the person who starts them, so we need to know who you are.
        </p>
        <Link className="btn is-filled" to="/signin" style={{ marginTop: '1rem' }}>
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="shell page">
      <Link className="backlink" to="/">
        ← All clubs
      </Link>
      <h1 className="page-title">Start a club</h1>
      <p style={{ maxWidth: '46ch' }}>
        Describe it the way you'd describe it to a neighbour. People decide from the
        first two lines whether they'd feel out of place.
      </p>

      <div
        style={{
          display: 'flex',
          gap: '1.25rem',
          alignItems: 'center',
          margin: '1.75rem 0',
        }}
      >
        <QuiltBlock
          seed={slug || 'your-club'}
          colors={categoryColors(form.category)}
          size={88}
        />
        <p className="field-hint" style={{ margin: 0, maxWidth: '28ch' }}>
          Your club's patch. It's generated from the name and category, so it changes as
          you type and stays the same once you publish.
        </p>
      </div>

      <form className="formgrid" onSubmit={submit}>
        <div className="field">
          <label className="field-label" htmlFor="name">
            Club name
          </label>
          <input
            id="name"
            className="field-input"
            required
            minLength={2}
            maxLength={60}
            value={form.name}
            onChange={set('name')}
            placeholder="Sutter Buttes Mending Club"
          />
          {slug && <span className="field-hint">jocc address: /clubs/{slug}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="blurb">
            One line
          </label>
          <input
            id="blurb"
            className="field-input"
            required
            maxLength={160}
            value={form.blurb}
            onChange={set('blurb')}
            placeholder="Visible mending, alterations, and keeping clothes out of the landfill."
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            className="field-select"
            value={form.category}
            onChange={set('category')}
          >
            {CATEGORY_KEYS.map((key) => (
              <option key={key} value={key}>
                {CATEGORIES[key].label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="description">
            What happens at a meeting
          </label>
          <textarea
            id="description"
            className="field-textarea"
            value={form.description}
            onChange={set('description')}
            placeholder="What you do, what to bring, and whether a beginner would be fine turning up."
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="meeting">
            When you meet
          </label>
          <input
            id="meeting"
            className="field-input"
            value={form.meeting_note}
            onChange={set('meeting_note')}
            placeholder="1st & 3rd Monday, 6pm"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="city">
            Town
          </label>
          <input id="city" className="field-input" value={form.city} onChange={set('city')} />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="county">
            County
          </label>
          <input
            id="county"
            className="field-input"
            value={form.county}
            onChange={set('county')}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="state">
            State
          </label>
          <input
            id="state"
            className="field-input"
            maxLength={2}
            value={form.state}
            onChange={set('state')}
            placeholder="CA"
          />
        </div>

        {error && <p className="notice">{error}</p>}

        <div>
          <button className="btn is-filled" type="submit" disabled={busy || !slug}>
            {busy ? 'Publishing…' : 'Publish club'}
          </button>
        </div>
      </form>
    </div>
  )
}
