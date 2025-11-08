import { Outlet } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout() {
  const { network, isConnected, setNetwork } = useWallet()
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {isConnected && network !== 'testnet' && (
        <div className="container mt-4">
          <div className="p-3 rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-200 flex items-center justify-between">
            <div>
              Some features only run on Testnet. Switch to Testnet to enable on-chain flows.
            </div>
            <button
              onClick={() => setNetwork('testnet')}
              className="px-3 py-1 rounded-md bg-primary text-white hover:opacity-90"
            >
              Switch to Testnet
            </button>
          </div>
        </div>
      )}
      <main className="container flex-1 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
