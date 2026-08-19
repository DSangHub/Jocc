import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="shell page">
      <p className="eyebrow">404</p>
      <h1 className="page-title">Nothing at this address</h1>
      <p style={{ maxWidth: '40ch' }}>
        The link may be old or mistyped. The directory has every club currently listed.
      </p>
      <Link className="btn is-filled" to="/" style={{ marginTop: '1rem' }}>
        Go to the directory
      </Link>
    </div>
  )
}
