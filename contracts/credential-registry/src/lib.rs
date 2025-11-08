#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, symbol_short, Bytes, BytesN, Env, Symbol, Address};

// Erros do contrato
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum CredentialError {
    NotFound = 1,
    AlreadyRevoked = 2,
    Expired = 3,
    Unauthorized = 4,
}

#[contract]
pub struct CredentialRegistry;

#[derive(Clone)]
#[contracttype]
pub struct Credential {
    // Hash da prova validada
    pub proof_hash: Bytes,
    // Dono (passkey vinculado à conta)
    pub owner: Address,
    // Unix timestamp de expiração
    pub expires_at: u64,
    // Flag de revogação
    pub revoked: bool,
}

#[contractimpl]
impl CredentialRegistry {
    /// Emite uma credencial vinculada a um owner após validação off-chain/on-chain do Verifier.
    pub fn issue_credential(env: Env, owner: Address, proof_hash: Bytes, ttl_seconds: u32) -> Bytes {
        // Autenticação: owner deve aprovar a emissão
        owner.require_auth();
        
        // ID determinístico a partir de proof_hash + timestamp
        let now = env.ledger().timestamp();
        let mut preimage = Bytes::new(&env);
        preimage.append(&proof_hash);
        preimage.append(&Bytes::from_array(&env, &now.to_be_bytes()));
        let id: BytesN<32> = env.crypto().sha256(&preimage).into();

        let expires_at = now + ttl_seconds as u64;
        let cred = Credential { 
            proof_hash: proof_hash.clone(), 
            owner: owner.clone(), 
            expires_at, 
            revoked: false 
        };
        
        let id_bytes: Bytes = id.clone().into();
        let key = Self::cred_key(&env, &id_bytes);
        env.storage().persistent().set(&key, &cred);

        // Publicar evento
        env.events().publish(
            (symbol_short!("issued"), owner.clone()),
            (id_bytes.clone(), expires_at)
        );
        
        id_bytes
    }

    /// Consulta validade da credencial
    pub fn is_valid(env: Env, credential_id: Bytes) -> bool {
        let now = env.ledger().timestamp();
        let key = Self::cred_key(&env, &credential_id);
        match env.storage().persistent().get::<_, Credential>(&key) {
            Some(cred) => !cred.revoked && cred.expires_at > now,
            None => false,
        }
    }
    
    /// Retorna informações completas da credencial
    pub fn get_credential(env: Env, credential_id: Bytes) -> Option<Credential> {
        let key = Self::cred_key(&env, &credential_id);
        env.storage().persistent().get::<_, Credential>(&key)
    }

    /// Versão do contrato
    pub fn version(_env: Env) -> Symbol { 
        symbol_short!("v0_2_0") 
    }

    /// Revoga credencial (apenas o owner pode revogar)
    pub fn revoke(env: Env, caller: Address, credential_id: Bytes) -> Result<(), CredentialError> {
        caller.require_auth();
        
        let key = Self::cred_key(&env, &credential_id);
        if let Some(mut cred) = env.storage().persistent().get::<_, Credential>(&key) {
            // Verificar se o caller é o owner
            if cred.owner != caller {
                return Err(CredentialError::Unauthorized);
            }
            
            // Verificar se já foi revogada
            if cred.revoked {
                return Err(CredentialError::AlreadyRevoked);
            }
            
            cred.revoked = true;
            env.storage().persistent().set(&key, &cred);
            
            env.events().publish(
                (symbol_short!("revoked"), cred.owner.clone()),
                credential_id.clone()
            );
            
            Ok(())
        } else {
            Err(CredentialError::NotFound)
        }
    }
}

impl CredentialRegistry {
    fn cred_key(env: &Env, id: &Bytes) -> Bytes {
        let mut k = Bytes::from_slice(env, b"cred:");
        k.append(id);
        k
    }
}
