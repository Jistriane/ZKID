import { useState } from 'react'
import { useWallet } from '../context/WalletContext'
 
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function SettingsPage() {
  const { 
    publicKey, 
    balance, 
    isConnected, 
    isLoading,
    network, 
    setNetwork,
    walletType,
    connectFreighter, 
    connectAlbedo, 
    disconnect 
  } = useWallet()
  
  const [notifications, setNotifications] = useState(true)
  const [autoRevoke, setAutoRevoke] = useState(false)
  const [revokeDays, setRevokeDays] = useState('90')

  async function handleConnectFreighter(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    await connectFreighter()
  }

  async function handleConnectAlbedo(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    await connectAlbedo()
  }

  function handleDisconnect(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    disconnect()
  }

  function handleSave() {
    alert('Settings saved successfully!')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h1 className="mb-2">⚙️ Settings</h1>
        <p className="text-slate-300">Manage your wallet, network and privacy preferences</p>
      </div>

      {/* Wallet Connection */}
      <Card>
        <CardHeader>
          <CardTitle>👛 Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="space-y-4">
              <p className="text-slate-300">
                Connect your Stellar wallet to interact with the blockchain
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleConnectFreighter}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? '⏳ Connecting...' : '🦀 Freighter'}
                </Button>
                <div className="flex-1 flex gap-2">
                  <Button
                    onClick={handleConnectAlbedo}
                    disabled={isLoading}
                    className="flex-1"
                    variant="secondary"
                  >
                    {isLoading ? '⏳ Connecting...' : '🔵 Albedo'}
                  </Button>
                  <a
                    href="https://albedo.link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 rounded-lg bg-white/10 text-slate-200 hover:bg-white/20 text-sm"
                    title="Open Albedo in a new tab"
                  >
                    Open Albedo
                  </a>
                </div>
              </div>
              <div className="text-sm text-slate-400 space-y-1">
                <p>
                  💡 Don't have a wallet? Install the
                  {' '}<a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Freighter</a>
                  {' '}extension.
                </p>
                <p>
                  🌐 Prefer a web wallet? Use
                  {' '}<a href="https://albedo.link" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Albedo</a>.
                  {' '}Create/select your account there first, then click the Albedo button here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="alert-success flex items-center gap-2">
                <span className="text-2xl">{walletType === 'freighter' ? '🦀' : '🔵'}</span>
                <div>
                  <div className="font-bold">✅ Wallet Connected</div>
                  <div className="text-sm">{walletType === 'freighter' ? 'Freighter Extension' : 'Albedo Wallet'}</div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-slate-400 mb-1">Public Key</div>
                <code className="text-sm text-primary break-all">{publicKey}</code>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-slate-400 mb-1">XLM Balance ({network})</div>
                {balance && balance !== '0' ? (
                  <div className="text-xl font-bold text-green-400">{balance} XLM</div>
                ) : (
                  <div className="text-sm text-slate-400">
                    {balance === '0' ? (
                      <span>⚠️ Account not funded on {network}</span>
                    ) : (
                      <span>⏳ Loading balance...</span>
                    )}
                  </div>
                )}
              </div>

              <Button variant="danger" onClick={handleDisconnect} className="w-full">
                Disconnect Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Selection */}
      <Card>
        <CardHeader>
          <CardTitle>🌐 Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10">
              <input
                type="radio"
                name="network"
                value="testnet"
                checked={network === 'testnet'}
                onChange={() => setNetwork('testnet')}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-semibold">Testnet</div>
                <div className="text-xs text-slate-400">For development and testing (recommended)</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10">
              <input
                type="radio"
                name="network"
                value="public"
                checked={network === 'mainnet'}
                onChange={() => setNetwork('mainnet')}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="font-semibold">Mainnet (Public)</div>
                <div className="text-xs text-slate-400">Production network with real XLM</div>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>🔒 Privacy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div>
                <div className="font-semibold">Verification Notifications</div>
                <div className="text-xs text-slate-400">Receive alerts when credentials are verified</div>
              </div>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="w-5 h-5"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div>
                <div className="font-semibold">Auto-revoke old credentials</div>
                <div className="text-xs text-slate-400">Automatically revoke after period of inactivity</div>
              </div>
              <input
                type="checkbox"
                checked={autoRevoke}
                onChange={(e) => setAutoRevoke(e.target.checked)}
                className="w-5 h-5"
              />
            </label>

            {autoRevoke && (
              <div className="form-group">
                <label className="form-label">Revoke after (days)</label>
                <input
                  type="number"
                  value={revokeDays}
                  onChange={(e) => setRevokeDays(e.target.value)}
                  className="form-input"
                  min="1"
                  max="365"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  )
}
