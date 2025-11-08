import { useState } from 'react'
import { useWallet } from '../context/WalletContext'
import { Link } from 'react-router-dom'

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

  // Format public key for display (show first 4 and last 4 characters)
  const displayAddress = publicKey 
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : ''

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>⚙️ Settings</h1>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Manage your wallet, network and privacy preferences
        </p>
        
        {/* Diagnostic Button */}
        <Link to="/diagnostic">
          <button style={{
            padding: '0.75rem 1.5rem',
            background: '#ffd700',
            color: '#333',
            border: '2px solid #ff8c00',
            borderRadius: 6,
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '1rem'
          }}>
            🔍 Wallet issues? Run the Diagnostic
          </button>
        </Link>
      </div>

      {/* Wallet Connection */}
      <div style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        padding: '2rem',
        marginBottom: '1rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>👛 Wallet</h2>
        
        {!isConnected ? (
          <div>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              Connect your Stellar wallet to interact with the blockchain
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleConnectFreighter}
                disabled={isLoading}
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: '1rem',
                  background: isLoading ? '#ccc' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isLoading ? '⏳ Connecting...' : '🦀 Connect Freighter'}
              </button>
              <button
                type="button"
                onClick={handleConnectAlbedo}
                disabled={isLoading}
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: '1rem',
                  background: isLoading ? '#ccc' : '#764ba2',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isLoading ? '⏳ Connecting...' : '🔵 Connect Albedo'}
              </button>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '1rem' }}>
              💡 Don't have a wallet? Install <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>Freighter</a> extension
            </p>
          </div>
        ) : (
          <div>
            <div style={{
              padding: '1.5rem',
              background: '#d1fae5',
              borderRadius: 8,
              marginBottom: '1rem',
              border: '2px solid #10b981'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>
                      {walletType === 'freighter' ? '🦀' : '🔵'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#047857' }}>
                        ✅ Wallet Connected
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#059669' }}>
                        {walletType === 'freighter' ? 'Freighter Extension' : 'Albedo Wallet'}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    background: 'white',
                    padding: '0.75rem',
                    borderRadius: 6,
                    marginTop: '0.75rem'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                      Public Key
                    </div>
                    <code style={{ 
                      fontSize: '0.875rem', 
                      wordBreak: 'break-all',
                      display: 'block',
                      color: '#667eea',
                      fontWeight: 600
                    }}>
                      {displayAddress}
                    </code>
                    <details style={{ marginTop: '0.5rem' }}>
                      <summary style={{ 
                        fontSize: '0.75rem', 
                        color: '#667eea', 
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}>
                        Show full address
                      </summary>
                      <code style={{ 
                        fontSize: '0.75rem', 
                        wordBreak: 'break-all',
                        display: 'block',
                        marginTop: '0.5rem',
                        color: '#666'
                      }}>
                        {publicKey}
                      </code>
                    </details>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '2px solid #dc2626',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#dc2626'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fee2e2'
                    e.currentTarget.style.color = '#dc2626'
                  }}
                >
                  🔌 Disconnect Wallet
                </button>
              </div>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: 8
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  XLM Balance
                </div>
                <div style={{ 
                  padding: '0.25rem 0.75rem',
                  background: '#f0f9ff',
                  color: '#0369a1',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {network.toUpperCase()}
                </div>
              </div>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 700,
                color: '#667eea',
                marginBottom: '0.25rem'
              }}>
                {balance} XLM
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>
                Updated from Horizon API
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Network Settings */}
      <div style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        padding: '2rem',
        marginBottom: '1rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>🌐 Network</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Stellar Network
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setNetwork('testnet')}
              style={{
                flex: 1,
                padding: '1rem',
                background: network === 'testnet' ? '#667eea' : 'white',
                color: network === 'testnet' ? 'white' : '#333',
                border: `1px solid ${network === 'testnet' ? '#667eea' : '#e0e0e0'}`,
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🧪 Testnet
            </button>
            <button
              onClick={() => setNetwork('mainnet')}
              style={{
                flex: 1,
                padding: '1rem',
                background: network === 'mainnet' ? '#667eea' : 'white',
                color: network === 'mainnet' ? 'white' : '#333',
                border: `1px solid ${network === 'mainnet' ? '#667eea' : '#e0e0e0'}`,
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🚀 Mainnet
            </button>
          </div>
        </div>

        <div style={{
          padding: '1rem',
          background: '#fff7ed',
          borderRadius: 6,
          fontSize: '0.875rem'
        }}>
          ⚠️ Testnet recommended for development. Mainnet requires real XLM.
        </div>
      </div>

      {/* Privacy Settings */}
      <div style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        padding: '2rem',
        marginBottom: '1rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>🔒 Privacy</h2>

        <div style={{
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: 6,
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
              Verification Notifications
            </div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              Receive alerts when a credential is verified
            </div>
          </div>
          <input
            type="checkbox"
            checked={notifications}
            onChange={e => setNotifications(e.target.checked)}
            style={{ width: 24, height: 24, cursor: 'pointer' }}
          />
        </div>

        <div style={{
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: 6,
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                Automatic Revocation
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>
                Revoke credentials after period of inactivity
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoRevoke}
              onChange={e => setAutoRevoke(e.target.checked)}
              style={{ width: 24, height: 24, cursor: 'pointer' }}
            />
          </div>

          {autoRevoke && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Days of inactivity
              </label>
              <input
                type="number"
                value={revokeDays}
                onChange={e => setRevokeDays(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: 6
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        style={{
          width: '100%',
          padding: '1rem',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          fontSize: '1rem',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        💾 Save Settings
      </button>

      {/* Danger Zone */}
      <div style={{
        marginTop: '2rem',
        background: '#fee2e2',
        border: '1px solid #fca5a5',
        borderRadius: 8,
        padding: '2rem'
      }}>
        <h3 style={{ color: '#dc2626', marginBottom: '1rem' }}>⚠️ Danger Zone</h3>
        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Irreversible actions. Be sure before proceeding.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            style={{
              flex: 1,
              minWidth: 200,
              padding: '0.75rem',
              background: 'white',
              color: '#dc2626',
              border: '1px solid #dc2626',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🗑️ Revoke All Credentials
          </button>
          <button
            style={{
              flex: 1,
              minWidth: 200,
              padding: '0.75rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ❌ Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
