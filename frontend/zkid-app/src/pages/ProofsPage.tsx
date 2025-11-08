import { Link } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useWallet } from '../context/WalletContext'

export function ProofsPage() {
  const { isConnected, network, setNetwork } = useWallet()
  const proofTypes = [
    {
      id: 'age',
      title: 'Age Verification',
      description: 'Prove you are of legal age without revealing your date of birth',
      icon: '🎂',
      circuit: 'age_verification.circom',
      useCases: ['Exchange registration', 'Access to restricted content', 'Simplified KYC']
    },
    {
      id: 'country',
      icon: '🗺️',
      title: 'Country Verification',
      description: 'Prove your residence without exposing full address',
      circuit: 'country_verification.circom',
      useCases: ['Remote account opening', 'Document validation', 'Compliance checks']
    },
    {
      id: 'income',
      icon: '💰',
      title: 'Income Verification',
      description: 'Prove that you meet income threshold without showing payslips',
      circuit: 'income_threshold.circom',
      useCases: ['Loans', 'Financing', 'Property rental']
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Proof Types</h1>
        <p className="text-slate-300">
          Choose the type of attribute you want to prove. All proofs are generated locally in your browser.
        </p>
        {isConnected && network !== 'testnet' && (
          <div className="mt-3 p-3 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-200 text-sm flex items-center justify-between">
            <span>Proof generation flows are currently enabled on Testnet.</span>
            <Button size="sm" onClick={() => setNetwork('testnet')}>Switch to Testnet</Button>
          </div>
        )}
        {!isConnected && (
          <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-sm">
            Connect a wallet to enable on-chain verification after generating proofs.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {proofTypes.map(proof => (
          <Card key={proof.id}>
            <CardContent>
              <div className="text-5xl mb-3">{proof.icon}</div>
              <h2 className="text-xl mb-2">{proof.title}</h2>
              <p className="text-sm text-slate-300 mb-3">
                {proof.description}
              </p>
              
              <div className="mb-3">
                <strong className="text-sm">Circuit:</strong>
                <code className="block mt-1 text-xs text-primary">
                  {proof.circuit}
                </code>
              </div>

              <div className="mb-4">
                <strong className="text-sm">Use cases:</strong>
                <ul className="mt-1 pl-5 text-sm text-slate-300 space-y-1">
                  {proof.useCases.map((uc, i) => <li key={i}>{uc}</li>)}
                </ul>
              </div>

              <Link to={`/proofs/${proof.id}`}>
                <Button className="w-full">Generate Proof →</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
