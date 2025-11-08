#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, symbol_short, Address, Bytes, Env, Symbol};

// Erros do contrato
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ComplianceError {
    AdminNotSet = 1,
    Unauthorized = 2,
    AdminAlreadySet = 3,
}

#[derive(Clone)]
#[contracttype]
pub struct Explanation {
    pub hash: Bytes,           // Hash do conteúdo explicável (off-chain)
    pub uri: Option<Bytes>,    // URI opcional para detalhes (IPFS/HTTPS)
}

#[contract]
pub struct ComplianceOracle;

#[contractimpl]
impl ComplianceOracle {
    /// Inicializa admin (pode ser chamado uma vez para definir o admin)
    pub fn init(env: Env, admin: Address) -> Result<(), ComplianceError> {
        admin.require_auth();
        
        if env.storage().instance().has(&symbol_short!("admin")) {
            return Err(ComplianceError::AdminAlreadySet);
        }
        
        env.storage().instance().set(&symbol_short!("admin"), &admin);
        env.events().publish(
            (symbol_short!("admininit"),),
            admin.clone()
        );
        
        Ok(())
    }
    
    /// Retorna o endereço do admin
    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&symbol_short!("admin"))
    }

    /// Checa lista de sanções baseado no hash da prova/credencial (placeholder)
    pub fn check_sanctions_list(env: Env, proof_hash: Bytes) -> bool {
        let key = Self::sanction_key(&env, &proof_hash);
        env.storage().persistent().get::<_, bool>(&key).unwrap_or(false)
    }

    /// Atualiza status de sanção (somente admin)
    pub fn set_sanction_status(
        env: Env, 
        caller: Address, 
        proof_hash: Bytes, 
        is_sanctioned: bool
    ) -> Result<(), ComplianceError> {
        caller.require_auth();
        
        let admin: Address = env.storage()
            .instance()
            .get(&symbol_short!("admin"))
            .ok_or(ComplianceError::AdminNotSet)?;
            
        if caller != admin { 
            return Err(ComplianceError::Unauthorized);
        }
        
        let key = Self::sanction_key(&env, &proof_hash);
        env.storage().persistent().set(&key, &is_sanctioned);
        
        env.events().publish(
            (symbol_short!("san_set"), proof_hash.clone()),
            is_sanctioned
        );
        
        Ok(())
    }

    /// Define explicação auditável para decisão de compliance (somente admin)
    pub fn set_explanation(
        env: Env, 
        caller: Address, 
        proof_hash: Bytes, 
        explanation_hash: Bytes, 
        uri: Option<Bytes>
    ) -> Result<(), ComplianceError> {
        caller.require_auth();
        
        let admin: Address = env.storage()
            .instance()
            .get(&symbol_short!("admin"))
            .ok_or(ComplianceError::AdminNotSet)?;
            
        if caller != admin { 
            return Err(ComplianceError::Unauthorized);
        }
        
        let key = Self::exp_key(&env, &proof_hash);
        let exp = Explanation { 
            hash: explanation_hash.clone(), 
            uri 
        };
        env.storage().persistent().set(&key, &exp);
        
        env.events().publish(
            (symbol_short!("exp_set"), proof_hash.clone()),
            explanation_hash.clone()
        );
        
        Ok(())
    }

    /// Recupera explicação para um determinado proof_hash
    pub fn get_explanation(env: Env, proof_hash: Bytes) -> Option<Explanation> {
        let key = Self::exp_key(&env, &proof_hash);
        env.storage().persistent().get::<_, Explanation>(&key)
    }

    /// Versão do contrato
    pub fn version(_env: Env) -> Symbol { 
        symbol_short!("v0_3_0") 
    }
}

impl ComplianceOracle {
    fn sanction_key(env: &Env, proof_hash: &Bytes) -> Bytes {
        let mut k = soroban_sdk::Bytes::from_slice(env, b"san:");
        k.append(proof_hash);
        k
    }
    fn exp_key(env: &Env, proof_hash: &Bytes) -> Bytes {
        let mut k = soroban_sdk::Bytes::from_slice(env, b"exp:");
        k.append(proof_hash);
        k
    }
}
