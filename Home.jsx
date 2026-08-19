import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import QuiltBlock from '../lib/quilt.jsx'
import ClubCard from '../components/ClubCard.jsx'
import { CATEGORIES, CATEGORY_KEYS, categoryColors } from '../lib/categories.js'

export default function Home() {
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState([])
  const [nearby, setNearby] = useState(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('jocc_club_directory')
      .select('*')
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setClubs(data ?? [])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function toggleCategory(key) {
    setActive((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  function findNearby() {
    if (!navigator.geolocation) {
      setError('This browser will not share a location. Search by town instead.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { data, error } = await supabase.rpc('jocc_clubs_near', {
          p_lat: coords.latitude,
          p_lng: coords.longitude,
          p_radius_km: 120,
        })
        setLocating(false)
        if (error) setError(error.message)
        else setNearby(data ?? [])
      },
      () => {
        setLocating(false)
        setError('Location was declined. Search by town or county instead.')
      }
    )
  }

  const source = nearby ?? clubs

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return source.filter((c) => {
      if (active.length && !active.includes(c.category)) return false
      if (!q) return true
      return [c.name, c.blurb, c.city, c.county, c.category]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [source, query, active])

  const wall = clubs.slice(0, 8)

  return (
    <>
      <section className="hero shell">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">A directory of small clubs, by county</p>
            <h1 className="hero-title">
              The knitting circle is already meeting. <em>You just haven't found it.</em>
            </h1>
            <p className="hero-lede">
              JOCC lists the mending nights, fly-tying benches, seed swaps and garage
              sessions running near you — with a room to talk in before you show up.
            </p>
            <div className="hero-actions">
              <a className="btn is-filled" href="#directory">
                Browse the directory
              </a>
              <button className="btn" onClick={findNearby} disabled={locating}>
                {locating ? 'Locating…' : 'Find clubs near me'}
              </button>
            </div>
          </div>
          <div className="quiltwall" aria-hidden={wall.length === 0}>
            {wall.map((club, i) => (
              <Link
                key={club.id}
                to={`/clubs/${club.slug}`}
                className="quiltwall-patch"
                data-name={club.name}
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <QuiltBlock seed={club.slug} colors={categoryColors(club.category)} size={140} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <hr className="stitchline" />

      <section className="filterbar shell" id="directory">
        <div className="filterbar-row">
          <input
            className="searchfield"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, town, or county"
            aria-label="Search clubs"
          />
          {nearby && (
            <button className="btn is-quiet" onClick={() => setNearby(null)}>
              Clear distance filter
            </button>
          )}
        </div>
        <div className="chiprow">
          {CATEGORY_KEYS.map((key) => (
            <button
              key={key}
              className={`chip${active.includes(key) ? ' is-on' : ''}`}
              onClick={() => toggleCategory(key)}
              aria-pressed={active.includes(key)}
            >
              <span
                className="chip-swatch"
                style={{ background: CATEGORIES[key].colors[1] }}
                aria-hidden="true"
              />
              {CATEGORIES[key].label}
            </button>
          ))}
        </div>
      </section>

      <div className="shell">
        <p className="results-count">
          {loading
            ? 'Loading clubs…'
            : `${filtered.length} club${filtered.length === 1 ? '' : 's'}${
                nearby ? ' within 120 km' : ''
              }`}
        </p>
        {error && <p className="notice">{error}</p>}
        <div className="clubgrid">
          {filtered.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
          {!loading && filtered.length === 0 && (
            <div className="empty">
              <p className="empty-title">Nothing here yet</p>
              <p>
                No club matches that. <Link to="/clubs/new">Start one</Link> and it will
                be the first patch on the wall.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
