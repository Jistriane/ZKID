import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { setConfig } from 'zkid-sdk'
import { WalletProvider } from './context/WalletContext'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { DashboardPage } from './pages/DashboardPage'
import { ProofsPage } from './pages/ProofsPage'
import { AgeProofPage } from './pages/AgeProofPage'
import { CountryProofPage } from './pages/CountryProofPage'
import { IncomeProofPage } from './pages/IncomeProofPage'
import { LatamPage } from './pages/LatamPage'
import { CompliancePage } from './pages/CompliancePage'
import { SettingsPage } from './pages/SettingsPage'
import { ElizaDemoPage } from './pages/ElizaDemoPage'

export function App() {
  useEffect(() => {
  // Configure SDK with environment variables
  // Normalize env network: internal uses 'testnet' | 'mainnet'; external Horizon still calls mainnet 'public'
  const rawNetwork = (import.meta.env.VITE_NETWORK || 'testnet').toLowerCase()
  const internalNetwork = (rawNetwork === 'public' ? 'mainnet' : rawNetwork) as 'testnet' | 'mainnet'
    const rpcUrl = import.meta.env.VITE_SOROBAN_RPC
    const verifierId = import.meta.env.VITE_VERIFIER_CONTRACT_ID
    const registryId = import.meta.env.VITE_REGISTRY_CONTRACT_ID
    const complianceId = import.meta.env.VITE_COMPLIANCE_CONTRACT_ID
    
  // SDK expects 'testnet' | 'public'
  const sdkNetwork = internalNetwork === 'mainnet' ? 'public' : internalNetwork
    // Callback opcional de assinatura (Freighter)
    const signTransaction = async (xdr: string, opts: { networkPassphrase: string }) => {
      try {
        if (typeof window !== 'undefined' && window.freighter?.signTransaction) {
          const networkLabel = sdkNetwork === 'public' ? 'PUBLIC' : 'TESTNET'
          return await window.freighter.signTransaction(xdr, { network: networkLabel, networkPassphrase: opts.networkPassphrase })
        }
      } catch (err) {
        console.warn('[App] signTransaction callback falhou, retornando XDR original', err)
      }
      return xdr // fallback sem assinatura (irá falhar em require_auth, mas útil p/ desenvolvimento)
    }
    setConfig({ network: sdkNetwork, rpcUrl, verifierId, registryId, complianceId, signTransaction })
  }, [])

  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'dashboard', element: <DashboardPage /> },
        { path: 'proofs', element: <ProofsPage /> },
        { path: 'proofs/age', element: <AgeProofPage /> },
        { path: 'proofs/country', element: <CountryProofPage /> },
        { path: 'proofs/income', element: <IncomeProofPage /> },
        { path: 'latam', element: <LatamPage /> },
        { path: 'compliance', element: <CompliancePage /> },
        { path: 'settings', element: <SettingsPage /> },
        { path: 'eliza-demo', element: <ElizaDemoPage /> },
      ],
    },
  ])

  return (
    <WalletProvider>
      <RouterProvider router={router} />
    </WalletProvider>
  )
}
