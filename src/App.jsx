import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import ClubPage from './pages/ClubPage.jsx'
import NewClub from './pages/NewClub.jsx'
import SignIn from './pages/SignIn.jsx'
import NotFound from './pages/NotFound.jsx'
import { useAuth } from './lib/auth.jsx'
import { supabase } from './lib/supabase.js'

function Masthead() {
  const { user, ready } = useAuth()
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header className="masthead">
      <div className="shell masthead-inner">
        <Link className="wordmark" to="/">
          <svg viewBox="0 0 8 8" width="30" height="30" aria-hidden="true" shapeRendering="crispEdges">
            <rect width="8" height="8" fill="#16261C" />
            <polygon points="0,0 4,0 0,4" fill="#C08A2E" />
            <polygon points="8,8 4,8 8,4" fill="#7B2D3B" />
            <rect x="3" y="3" width="2" height="2" fill="#DDE2D6" />
          </svg>
          <span>
            <span className="wordmark-letters">JOCC</span>
            <span className="wordmark-expand">Join Online Country Clubs</span>
          </span>
        </Link>
        <nav className="masthead-nav">
          <Link className="btn is-quiet" to="/clubs/new">
            Start a club
          </Link>
          {ready && user ? (
            <button className="btn" onClick={signOut}>
              Sign out
            </button>
          ) : (
            <Link className="btn is-filled" to="/signin">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <>
      <Masthead />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clubs/new" element={<NewClub />} />
          <Route path="/clubs/:slug" element={<ClubPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="footer shell">
        <span>JOCC — Join Online Country Clubs</span>
        <span>Clubs are run by the people in them, not by us.</span>
      </footer>
    </>
  )
}
