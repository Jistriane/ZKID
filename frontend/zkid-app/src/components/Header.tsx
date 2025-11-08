import { Link } from 'react-router-dom'
import { useState } from 'react'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md">
      <div className="border-b border-white/10 bg-black/20">
        <nav className="container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3 font-display text-xl md:text-2xl">
            <img src="brand/zkid-logo.png" alt="ZKID" className="h-8 w-auto" />
          </Link>

          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          <div className="desktop-only flex items-center gap-6 space-x-6 text-slate-200">
            <Link to="/" className="hover:text-white px-1 inline-flex">Home</Link>
            <Link to="/dashboard" className="hover:text-white px-1 inline-flex">Dashboard</Link>
            <Link to="/proofs" className="hover:text-white px-1 inline-flex">Proofs</Link>
            <Link to="/latam" className="hover:text-white px-1 inline-flex">LATAM</Link>
            <Link to="/compliance" className="hover:text-white px-1 inline-flex">Compliance</Link>
            <Link to="/settings" className="hover:text-white px-1 inline-flex">Settings</Link>
          </div>
        </nav>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-only border-b border-white/10 bg-black/40">
          <div className="container flex flex-col gap-2 py-2">
            <Link to="/" className="py-2" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/dashboard" className="py-2" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            <Link to="/proofs" className="py-2" onClick={() => setMobileMenuOpen(false)}>Proofs</Link>
            <Link to="/latam" className="py-2" onClick={() => setMobileMenuOpen(false)}>LATAM</Link>
            <Link to="/compliance" className="py-2" onClick={() => setMobileMenuOpen(false)}>Compliance</Link>
            <Link to="/settings" className="py-2" onClick={() => setMobileMenuOpen(false)}>Settings</Link>
          </div>
        </div>
      )}
    </header>
  )
}
