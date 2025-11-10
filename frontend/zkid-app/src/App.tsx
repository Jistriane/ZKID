import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { setConfig } from 'zkid-sdk'

// Tipo estendido enquanto o pacote local é atualizado (inclui novos campos strict mode)
type ExtendedZkidConfig = Parameters<typeof setConfig>[0]
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
  (async () => {
      // Configure SDK with environment variables
      // Normalize env network: internal uses 'testnet' | 'mainnet'; external Horizon still calls mainnet 'public'
      const rawNetwork = (import.meta.env.VITE_NETWORK || 'testnet').toLowerCase()
      const internalNetwork = (rawNetwork === 'public' ? 'mainnet' : rawNetwork) as 'testnet' | 'mainnet'
      const rpcUrl = import.meta.env.VITE_SOROBAN_RPC
      const verifierId = import.meta.env.VITE_VERIFIER_CONTRACT_ID
      const registryId = import.meta.env.VITE_REGISTRY_CONTRACT_ID
      const complianceId = import.meta.env.VITE_COMPLIANCE_CONTRACT_ID
  // Parâmetros legados de simulação e mock removidos: fluxo requer carteira real.

      // SDK expects 'testnet' | 'public'
      const sdkNetwork = internalNetwork === 'mainnet' ? 'public' : internalNetwork

      // Tentar obter publicKey do Freighter para simulação e assinatura
      // Obter publicKey somente para assinatura on-demand (não armazenamos simulationSource)

      // Callback obrigatório de assinatura (Freighter)
      const signTransaction = async (xdr: string, opts: { networkPassphrase: string }) => {
        if (typeof window !== 'undefined' && window.freighter?.signTransaction) {
          const networkLabel = sdkNetwork === 'public' ? 'PUBLIC' : 'TESTNET'
          return await window.freighter.signTransaction(xdr, { network: networkLabel, networkPassphrase: opts.networkPassphrase })
        }
        throw new Error('Carteira não disponível para assinatura')
      }

      const cfg: ExtendedZkidConfig = {
        network: sdkNetwork,
        rpcUrl,
        verifierId,
        registryId,
        complianceId,
        signTransaction,
      }
      setConfig(cfg)
    })()
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
