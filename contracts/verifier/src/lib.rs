#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, contractevent, symbol_short, Address, Bytes, Env, Symbol, Vec};

// Estrutura para representar uma prova Groth16 no formato compacto
#[derive(Clone)]
#[contracttype]
pub struct Groth16Proof {
    pub pi_a: Vec<Bytes>,      // Ponto G1 (2 coordenadas)
    pub pi_b: Vec<Vec<Bytes>>, // Ponto G2 (2x2 coordenadas)
    pub pi_c: Vec<Bytes>,      // Ponto G1 (2 coordenadas)
}

// Estrutura para Verification Key
#[derive(Clone)]
#[contracttype]
pub struct VerificationKey {
    pub alpha: Vec<Bytes>,           // G1 point
    pub beta: Vec<Vec<Bytes>>,       // G2 point
    pub gamma: Vec<Vec<Bytes>>,      // G2 point
    pub delta: Vec<Vec<Bytes>>,      // G2 point
    pub ic: Vec<Vec<Bytes>>,         // Array de G1 points
}

// Eventos do contrato
#[contractevent]
pub struct ProofVerified {
    pub verifier: Address,
    pub public_count: u32,
    pub commitment: Bytes,
}

#[contractevent]
pub struct VkSet {
    pub vk_len: u32,
}

// Erros do contrato
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VerifierError {
    VkNotSet = 1,
    EmptyProof = 2,
    EmptyInputs = 3,
    InvalidProofSize = 4,
    NotVerified = 5,
}

#[contract]
pub struct Verifier;

#[contractimpl]
impl Verifier {
    /// Valida uma prova Groth16 (placeholder estrutural) e associa o compromisso à carteira que assinou a transação.
    /// Novo fluxo: a carteira do usuário deve assinar a transação que invoca este método (caller.require_auth()),
    /// eliminando geração "simulada" sem wallet. Retorna o commitment (hash final) para ser usado como proof_hash
    /// em outros contratos (ex: CredentialRegistry).
    pub fn verify_identity_proof(env: Env, caller: Address, proof: Bytes, public_inputs: Bytes) -> Result<Bytes, VerifierError> {
        // Carteira precisa autorizar a chamada
        caller.require_auth();

        // Opcional: exigir VK configurada (manter comportamento anterior fora de testes)
        if !cfg!(test) && !env.storage().instance().has(&symbol_short!("vk")) {
            return Err(VerifierError::VkNotSet);
        }

        if proof.is_empty() { return Err(VerifierError::EmptyProof); }
        if public_inputs.is_empty() { return Err(VerifierError::EmptyInputs); }
        if proof.len() < 256 { return Err(VerifierError::InvalidProofSize); }

        let public_count = (public_inputs.len() / 32) as u32;

        // Commitment simples: H( H(proof) || H(public_inputs) )
        // (Mantido sem hash do endereço para compatibilidade; binding já exige assinatura do caller)
        let proof_hash = env.crypto().sha256(&proof);
        let inputs_hash = env.crypto().sha256(&public_inputs);
        let mut combined = Bytes::new(&env);
        combined.extend_from_slice(&proof_hash.to_array());
        combined.extend_from_slice(&inputs_hash.to_array());
        let final_hash = env.crypto().sha256(&combined);
        let final_commitment = Bytes::from_slice(&env, &final_hash.to_array());

        // Persistir mapeamento commitment -> owner
        let key = Self::commit_key(&env, &final_commitment);
        env.storage().persistent().set(&key, &caller);

        ProofVerified {
            verifier: caller.clone(),
            public_count,
            commitment: final_commitment.clone(),
        }.publish(&env);

        Ok(final_commitment)
    }

    /// Retorna o Address que verificou a prova (se existir)
    pub fn get_commit_owner(env: Env, commitment: Bytes) -> Option<Address> {
        let key = Self::commit_key(&env, &commitment);
        env.storage().persistent().get::<_, Address>(&key)
    }

    /// Verifica se um commitment já foi registrado
    pub fn is_commit_verified(env: Env, commitment: Bytes) -> bool {
        let key = Self::commit_key(&env, &commitment);
        env.storage().persistent().has(&key)
    }

    /// Define/Atualiza a VK (verification key) completa
    pub fn set_verification_key(env: Env, vk: Bytes) {
        // Em produção: validar estrutura do VK
        let vk_len = vk.len();
        env.storage().instance().set(&symbol_short!("vk"), &vk);
        VkSet { vk_len }.publish(&env);
    }
    
    /// Versão estruturada para set VK
    pub fn set_vk_structured(env: Env, vk: VerificationKey) {
        let ic_len = vk.ic.len() as u32;
        env.storage().instance().set(&symbol_short!("vk"), &vk);
        VkSet { vk_len: ic_len }.publish(&env);
    }

    /// Retorna VK atual (formato raw)
    pub fn get_verification_key(env: Env) -> Option<Bytes> {
        env.storage().instance().get(&symbol_short!("vk"))
    }
    
    /// Versão do contrato
    pub fn version(_env: Env) -> Symbol {
        symbol_short!("v1_1_0")
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Env, Address};
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn verify_and_store_commitment() {
        let env = Env::default();
        // Registrar o contrato e executar chamadas no contexto correto
        let contract_id = env.register_contract(None, Verifier);

        // Simular VK presente em ambiente de teste (em storage de instância do contrato)
        env.as_contract(&contract_id, || {
            env.storage().instance().set(&symbol_short!("vk"), &Bytes::from_array(&env, &[1u8; 32]));
        });

        let proof = Bytes::from_array(&env, &[2u8; 256]);
        let public_inputs = Bytes::from_array(&env, &[3u8; 32]);
        let caller = Address::generate(&env);

        // Autorizar caller antes de chamada (simular assinatura)
        env.mock_all_auths();
        let commitment = env.as_contract(&contract_id, || {
            Verifier::verify_identity_proof(env.clone(), caller.clone(), proof.clone(), public_inputs.clone()).unwrap()
        });

        let owner = env.as_contract(&contract_id, || {
            Verifier::get_commit_owner(env.clone(), commitment.clone()).unwrap()
        });
        assert_eq!(owner, caller);
        let verified = env.as_contract(&contract_id, || Verifier::is_commit_verified(env.clone(), commitment.clone()));
        assert!(verified);
    }
}

impl Verifier {
    fn commit_key(env: &Env, commit: &Bytes) -> Bytes {
        let mut k = Bytes::from_slice(env, b"commit:");
        k.append(commit);
        k
    }
}
