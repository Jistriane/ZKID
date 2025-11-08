<p align="center">
  <img src="frontend/zkid-app/public/brand/zkid-logo.png" alt="ZKID logo" width="220" />
</p>

# 🔐 ZKID Stellar — Documentação Completa (Português)

Identidade e Compliance com Provas de Conhecimento Zero (Zero‑Knowledge) e Passkeys  
Stellar Soroban + Circom + React + ElizaOS

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

<p align="center">
  <img src="docs/assets/landing.png" alt="Prévia da interface — ZKID Stellar" width="1024" />
</p>

## Índice
- O que é ZKID Stellar
- Funcionalidades
- Stack Tecnológica
- Estrutura do Repositório
- Pré-requisitos
- Início Rápido (Quickstart)
- Guias Detalhados
  - Compilar Circuitos
  - Build & Test de Contratos
  - Frontend
  - Assistente de IA (ElizaOS)
- Deploy (Soroban)
- Configuração & Variáveis de Ambiente
- Integridade & Verificação
- Troubleshooting
- Segurança & Privacidade
- Roadmap
- Contribuição & Licença
- Alvos Makefile
- Códigos de Erro dos Contratos
- Tamanhos dos Artefatos WASM

---

## O que é ZKID Stellar
ZKID Stellar é uma plataforma de identidade e compliance voltada à privacidade. Usuários geram provas Groth16 localmente para atestar atributos (ex.: idade ≥ limite) sem revelar dados brutos. On-chain, o contrato Verifier valida proofs; o Registry emite credenciais soulbound (revogáveis e expiráveis); o Compliance Oracle mantém lista de sanções e metadados explicativos. Um assistente de IA (ElizaOS) oferece explicações locais sobre compliance.

## Funcionalidades
- Geração de provas ZK no cliente (snarkjs)  
- Verificação on-chain (Soroban, pareamento BN254)  
- Suporte a Passkeys (WebAuthn)  
- Credenciais Soulbound revogáveis / expiráveis  
- Oracle de compliance com hash de explicação + URI opcional  
- Assistente de IA local (Bun + Ollama + ElizaOS)  
- Contratos WASM pequenos (≈ 6–13 KB)

## Stack Tecnológica
- Circuitos: Circom 2.x + snarkjs 0.7.x  
- Contratos: Rust (Soroban)  
- SDK: TypeScript  
- Frontend: React + Vite  
- IA: ElizaOS + Bun + modelos locais (Ollama)

## Estrutura do Repositório
- `contracts/` — Verifier, Credential Registry, Compliance Oracle  
- `circuits/` — Circuitos e artefatos (wasm, zkey, vk)  
- `sdk/zkid-sdk/` — SDK TypeScript  
- `frontend/zkid-app/` — dApp React  
- `eliza_bot/` — Assistente de IA  
- `docs/` — Documentação (índice em `docs/README.md`)

## Pré-requisitos
- Node 18+, npm  
- Rust + cargo + `soroban-cli`  
- Circom 2.1.5+, snarkjs 0.7.x  
- Git

## Início Rápido (Quickstart)
```bash
make install
make build
make test
make app-dev
# opcional
npm run eliza:dev
```
Acesse http://localhost:5173 para a dApp e http://localhost:3000 para ElizaOS.

## Guias Detalhados
Ver `docs/` para guias completos. Resumo abaixo.

## Deploy Atual na Testnet

- Verifier: `CBMUOMXPCWVYYA75GR6AIJTMUR3W6VOBUQCXJ5GDPRURKDETODUKJWSC`  
  Explorer: https://stellar.expert/explorer/testnet/contract/CBMUOMXPCWVYYA75GR6AIJTMUR3W6VOBUQCXJ5GDPRURKDETODUKJWSC
- Credential Registry: `CB4F5NMRYZ5GYTRPUOYDIU27J23NDNQCAWXZMAOWQ75OWQM7KOMAV7J5`  
  Explorer: https://stellar.expert/explorer/testnet/contract/CB4F5NMRYZ5GYTRPUOYDIU27J23NDNQCAWXZMAOWQ75OWQM7KOMAV7J5
- Compliance Oracle: `CDVZI3V7S3RIV3INQQRAPMR4FKIQJPR7NRJMDWET6LOSGBMFFCLLERVM`  
  Explorer: https://stellar.expert/explorer/testnet/contract/CDVZI3V7S3RIV3INQQRAPMR4FKIQJPR7NRJMDWET6LOSGBMFFCLLERVM

Notas:
- O Compliance Oracle foi inicializado com admin = endereço do deployer.
- Para build de deploy, prefira Stellar CLI (wasm32v1-none).

### Compilar Circuitos
```bash
bash scripts/compile-circuits.sh
```
Fluxo manual: compilar → baixar ptau → setup → contribuir → exportar VK → copiar wasm.  
Artefatos em `circuits/artifacts/<circuit>/`.

### Build & Test dos Contratos
Build recomendado (Stellar CLI):
```bash
stellar contract build --package verifier
stellar contract build --package compliance_oracle
stellar contract build --package credential_registry
```
Testes:
```bash
cd contracts && cargo test
```
Saída WASM: `target/wasm32v1-none/release/*.wasm` (CLI) ou `target/wasm32-unknown-unknown/release/*.wasm` (legado)

### Frontend
```bash
cd frontend/zkid-app
npm run dev
```

### Assistente de IA (ElizaOS)
```bash
npm run eliza:dev
```
Executa local (Bun + modelos Ollama). 100% privado.

## Deploy (Soroban)
Ver `docs/DEPLOY_SOROBAN.md` para configuração de rede, funding, deploy e inicialização.  
Armazene IDs dos contratos em `.env`/config para uso no SDK e frontend.

## Configuração & Variáveis de Ambiente
Exemplo (deploy atual na testnet):
```
SOROBAN_RPC=https://soroban-testnet.stellar.org:443
SOROBAN_NETWORK="Test SDF Network ; September 2015"
VERIFIER_ID=CBMUOMXPCWVYYA75GR6AIJTMUR3W6VOBUQCXJ5GDPRURKDETODUKJWSC
CREDENTIAL_REGISTRY_ID=CB4F5NMRYZ5GYTRPUOYDIU27J23NDNQCAWXZMAOWQ75OWQM7KOMAV7J5
COMPLIANCE_ORACLE_ID=CDVZI3V7S3RIV3INQQRAPMR4FKIQJPR7NRJMDWET6LOSGBMFFCLLERVM
```

## Integridade & Verificação
- Fixar versões de circuitos e manter checksums (wasm, zkey, vk).  
- Publicar tamanhos de WASM e hash de commit.  
- Considerar SRI (Subresource Integrity) para assets wasm no frontend.  
- Scripts de build reproduzíveis (determinismo).  

## Troubleshooting
| Problema | Causa | Solução |
|----------|-------|---------|
| Prova inválida | VK diferente | Re-exportar VK e atualizar no Verifier |
| Deploy falha | Conta sem fundos | Usar friendbot testnet |
| Erro de argumentos CLI | Encoding incorreto | Usar SDK ou helpers base64/xdr |

## Segurança & Privacidade
- Nenhum dado sensível bruto on-chain ou em servidor.  
- Provas geradas no cliente; só compromissos (hashes) armazenados.  
- Contratos usam enums de erro (sem `panic!`).  
- Checagens de ownership para revogação.

## Roadmap
Ver `docs/ROADMAP.md` para fases, metas e riscos.  
Migração do sistema de eventos planejada após upgrade do Soroban SDK.

## Contribuição & Licença
Contribuições bem-vindas (PRs abertos).  
Licença: MIT.

---

## Alvos Makefile
| Target | Descrição |
|--------|-----------|
| `make install` | Instala todas dependências (root + SDK + frontend) |
| `make build` | Build do SDK e contratos (release) |
| `make test` | Executa testes (SDK + contratos) |
| `make circuits-build` | Recompila circuitos Circom |
| `make app-dev` | Sobe servidor de desenvolvimento do frontend |
| `make deploy-testnet` | Executa script de deploy na testnet |
| `make clean` | Limpa artefatos de build |

## Códigos de Erro dos Contratos
| Contrato | Enum | Exemplos |
|----------|------|----------|
| Verifier | `VerifierError` | `VkNotSet`, `EmptyProof`, `EmptyInputs`, `InvalidProofSize` |
| Credential Registry | `CredentialError` | `NotFound`, `AlreadyRevoked`, `Expired`, `Unauthorized` |
| Compliance Oracle | `ComplianceError` | `AdminNotSet`, `Unauthorized`, `AdminAlreadySet` |

Todas funções falíveis retornam `Result<_, ErrorEnum>` evitando `panic!`.

## Tamanhos dos Artefatos WASM (Aprox)
| Contrato | Tamanho |
|----------|---------|
| verifier.wasm | ~6.4 KB |
| credential_registry.wasm | ~13 KB |
| compliance_oracle.wasm | ~6.9 KB |

Perfil de release usa `opt-level="z"`, LTO e stripping.

---

## Integração Scaffold Stellar

Este repositório utiliza configuração estilo Scaffold para gerar automaticamente clientes TypeScript tipados dos contratos Soroban.

- Config central: `stellar.toml` declara ambientes, comandos de build e IDs deployados.
- Clientes gerados: `packages/<contrato>` contendo classe `Client` com métodos tipados que retornam `AssembledTransaction<T>`.
- SDK: `sdk/zkid-sdk/src/client/contracts.ts` re-exporta como `VerifierClient`, `CredentialRegistryClient`, `ComplianceOracleClient`.
- Frontend: serviços encapsulam `signAndSend` com um signer (Freighter ou fallback passkey) oferecendo funções de alto nível.

Uso rápido:

```ts
import { VerifierClient } from 'zkid-sdk/client/contracts';
import { Networks } from '@stellar/stellar-sdk';

const verifier = new VerifierClient({
  contractId: 'CBMUOMXPCW...JWSC',
  networkPassphrase: Networks.TESTNET,
  rpcUrl: 'https://soroban-testnet.stellar.org'
});

const versao = await (await verifier.version()).simulate();

const signer = await getWalletSigner();
const tx = await verifier.verify_identity_proof(Buffer.from(prova), Buffer.from(inputs));
const resultado = await tx.signAndSend(signer);
```

Regenerar clientes após alterar contratos:

```bash
make build
npm run build:clients
npm run build -w sdk/zkid-sdk
```

Benefícios: tipagem forte, regeneração simples, integração frontend direta, redução de erros de encoding.

## Próximos Passos de Endurecimento (Security Hardening)
- Ancorar hash da verification key + versão.  
- Adicionar separador de domínio nos public inputs.  
- Migrar para `#[contractevent]` quando SDK suportar sem problemas.  
- Multisig para admin do compliance oracle.  
- Adicionar SHA256 dos artefatos dos circuitos ao README.

## Manifesto de Integridade (Sugestão)
Gerar arquivo `INTEGRITY.json` contendo hashes:
```json
{
  "age_verification.wasm": "sha256-...",
  "age_verification.zkey": "sha256-...",
  "verifier.wasm": "sha256-..."
}
```

## Suporte
- Issues: GitHub Issues  
- Discussões: GitHub Discussions  
- Email: (adicionar em breve)

---
Versão PT-BR completa. Para versão em inglês expandida consulte `README.en.md`.
