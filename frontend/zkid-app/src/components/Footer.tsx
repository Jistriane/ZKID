export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/30">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4 py-6 text-slate-300">
        <p className="m-0 text-sm">&copy; {new Date().getFullYear()} ZKID Stellar — Privacy with zero-knowledge proofs.</p>
        <nav className="flex items-center gap-6">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">GitHub</a>
          <a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="hover:text-white">Stellar</a>
          <a href="/docs" className="hover:text-white">Docs</a>
        </nav>
      </div>
    </footer>
  )
}
