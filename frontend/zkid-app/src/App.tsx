import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
  setConfig({ network: sdkNetwork, rpcUrl, verifierId, registryId, complianceId })
  }, [])

  return (
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="proofs" element={<ProofsPage />} />
            <Route path="proofs/age" element={<AgeProofPage />} />
            <Route path="proofs/country" element={<CountryProofPage />} />
            <Route path="proofs/income" element={<IncomeProofPage />} />
            <Route path="latam" element={<LatamPage />} />
            <Route path="compliance" element={<CompliancePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="eliza-demo" element={<ElizaDemoPage />} />
            {/** diagnostic page removed */}
            {/* Debug page removed */}
          </Route>
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  )
}
