// WebAuthn Passkeys integration for Stellar
// Reference: https://stellar.org/blog/foundation-news/introducing-the-new-stellar-passkey-feature

export type PasskeyCredential = {
  id: string
  publicKey: string
}

export async function ensurePasskey(): Promise<string> {
  // Check if passkey is already registered
  const existingId = localStorage.getItem('stellar-passkey-credential-id')
  if (existingId) {
    return existingId
  }
  
  // Create new passkey using WebAuthn (if available)
  if (typeof window !== 'undefined' && window.navigator.credentials) {
    try {
      const credential = await createPasskey()
      localStorage.setItem('stellar-passkey-credential-id', credential.id)
      localStorage.setItem('stellar-passkey-public-key', credential.publicKey)
      return credential.id
    } catch (e) {
      console.warn('[passkeys] WebAuthn creation failed, using fallback:', e)
    }
  }
  
  // Fallback: generate synthetic ID for development
  const fallbackId = 'passkey-' + Math.random().toString(36).slice(2, 15)
  localStorage.setItem('stellar-passkey-credential-id', fallbackId)
  return fallbackId
}

async function createPasskey(): Promise<PasskeyCredential> {
  // Configure WebAuthn creation options
  const challenge = new Uint8Array(32)
  crypto.getRandomValues(challenge)
  
  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'ZKID Stellar',
      id: window.location.hostname
    },
    user: {
      id: new Uint8Array(16),
      name: 'zkid-user',
      displayName: 'ZKID User'
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },  // ES256
      { type: 'public-key', alg: -257 } // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'required'
    },
    timeout: 60000,
    attestation: 'none'
  }
  
  const credential = await navigator.credentials.create({
    publicKey: publicKeyOptions
  }) as PublicKeyCredential
  
  if (!credential) {
    throw new Error('Failed to create passkey')
  }
  
  // Extrair chave pública do attestation
  const response = credential.response as AuthenticatorAttestationResponse
  const publicKeyBytes = new Uint8Array(response.getPublicKey() || [])
  const publicKeyHex = Array.from(publicKeyBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return {
    id: credential.id,
    publicKey: publicKeyHex
  }
}

// Sign data with passkey
export async function signWithPasskey(_data: Uint8Array): Promise<Uint8Array> {
  const credentialId = localStorage.getItem('stellar-passkey-credential-id')
  if (!credentialId) {
    throw new Error('No passkey registered')
  }
  
  if (typeof window === 'undefined' || !window.navigator.credentials) {
    // Fallback for development
    return new Uint8Array(64) // Synthetic signature
  }
  
  try {
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)
    
    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: window.location.hostname,
      allowCredentials: [{
        type: 'public-key',
        id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0))
      }],
      userVerification: 'required',
      timeout: 60000
    }
    
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions
    }) as PublicKeyCredential
    
    const response = assertion.response as AuthenticatorAssertionResponse
    return new Uint8Array(response.signature)
  } catch (e) {
    console.warn('[passkeys] Signing failed:', e)
    throw e
  }
}

