import { Link } from 'react-router-dom'
import QuiltBlock from '../lib/quilt.jsx'
import { categoryColors, categoryLabel } from '../lib/categories.js'

export default function ClubCard({ club }) {
  const place = [club.city, club.county && `${club.county} County`]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link className="clubcard" to={`/clubs/${club.slug}`}>
      <div className="clubcard-top">
        <div className="clubcard-block">
          <QuiltBlock seed={club.slug} colors={categoryColors(club.category)} size={64} />
        </div>
        <div>
          <h3 className="clubcard-name">{club.name}</h3>
          <p className="clubcard-place">{place || 'Location not listed'}</p>
        </div>
      </div>
      <p className="clubcard-blurb">{club.blurb}</p>
      <div className="clubcard-foot">
        <span>{categoryLabel(club.category)}</span>
        <span>·</span>
        <span>
          {club.member_count ?? 0} member{Number(club.member_count) === 1 ? '' : 's'}
        </span>
        {club.is_verified && (
          <span className="verified" style={{ marginLeft: 'auto' }}>
            <span className="verified-dot" aria-hidden="true" />
            Verified
          </span>
        )}
        {club.distance_km != null && (
          <span style={{ marginLeft: 'auto' }}>{club.distance_km} km</span>
        )}
      </div>
    </Link>
  )
}
