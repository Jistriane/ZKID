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

### Inicialização com Um Comando (Recomendado)

Inicie todo o sistema (frontend + bot) com um único comando:

```bash
bash scripts/start-all.sh --with-bot --no-test
```

Este script irá:

1. Instalar todas as dependências (monorepo + SDK + frontend + bot)
2. Compilar contratos Soroban e SDK
3. Compilar circuitos ZK (ou pular com `--skip-circuits`)
4. Iniciar servidor dev do frontend (http://localhost:5173)
5. Iniciar Eliza bot (http://localhost:3000)

**Flags disponíveis:**

- `--with-bot` — Inicia também o Eliza bot junto com frontend
- `--no-test` — Pula execução de testes (inicialização mais rápida)
- `--skip-circuits` — Não recompila circuitos (usa artifacts existentes)
- `--port <n>` — Porta customizada do frontend (padrão: 5173)
- `--help` — Mostra todas as opções

**Parar todos os serviços:**

```bash
# Use os PIDs mostrados no output do terminal
kill <FRONTEND_PID> <BOT_PID>
# Ou pressione Ctrl+C no terminal que está executando o script
```

### Inicialização Manual (Alternativa)

Use o Makefile para controle passo-a-passo:

```bash
make install
make build
make test
make app-dev
# opcional
npm run eliza:dev
```

Acesse http://localhost:5173 para a dApp e http://localhost:3000 para ElizaOS.

### Script Único de Inicialização

**⚠️ Nota:** Esta seção foi movida para "Início Rápido (Quickstart)" acima. Consulte lá para detalhes completos sobre o `start-all.sh`.

## Guias Detalhados

Ver `docs/` para guias completos. Resumo abaixo.

## Deploy Atual na Testnet

**Último Deploy:** 10 de Novembro de 2025  
**Deployer:** `GA3SMP7WZIP7G3RGLAXETC3GKK7LTKV7COLMQBOKGN7G5JQQ25GEEBYS` (identidade: admin)

### Contratos Soroban

- **Verifier:** `CBRT2F27KEXANOP6ILGF2TPFZJKYZCFCWSPCUCX3DQQOH4OBIAHTSJ5F`  
  Explorer: <https://stellar.expert/explorer/testnet/contract/CBRT2F27KEXANOP6ILGF2TPFZJKYZCFCWSPCUCX3DQQOH4OBIAHTSJ5F>
- **Credential Registry:** `CCMAZDIUOLR66I2CABKI34JPXYPSZPTJREVRSDAKBSUIZ2QG73QFGUK4`  
  Explorer: <https://stellar.expert/explorer/testnet/contract/CCMAZDIUOLR66I2CABKI34JPXYPSZPTJREVRSDAKBSUIZ2QG73QFGUK4>
- **Compliance Oracle:** `CDOTN2UWCG26J2LKKNVUVFYBBHRPSSD7D5Z7N6K5C5F4M3TK35WR67AC`  
  Explorer: <https://stellar.expert/explorer/testnet/contract/CDOTN2UWCG26J2LKKNVUVFYBBHRPSSD7D5Z7N6K5C5F4M3TK35WR67AC>

### Frontend (Vercel)

- **URL de Produção:** <https://zkid-stellar.vercel.app>
- **Painel Vercel:** <https://vercel.com/jistrianedroid-3423s-projects/zkid-stellar>
- **Status:** ● Ready (Production)
- **Framework:** Vite
- **Rede:** Testnet (Stellar)

### Atualizações Recentes (10 de Novembro de 2025)

- **CORREÇÃO CRÍTICA:** Geração determinística de ID de credencial em `issue_credential`
  - Causa raiz descoberta: `env.crypto().sha256()` retorna valores diferentes durante simulação vs execução
  - Solução: Usar `proof_hash` diretamente como ID de credencial (sem hashing adicional)
  - Resultado: 100% de taxa de sucesso na emissão de credenciais, zero erros de footprint
  - Detalhe técnico: Chaves de armazenamento agora determinísticas entre fases de simulação e execução
- **Rastreamento de Credenciais no Dashboard:** Sistema híbrido localStorage + verificação on-chain
  - Credenciais armazenadas localmente após emissão (`storeCredentialLocally()`)
  - Dashboard busca do localStorage e verifica status on-chain via `get_credential()`
  - Atualizações de status em tempo real: ativo, revogado ou expirado
  - Sem dependência da API de eventos RPC (mais confiável e performático)
- SDK e bindings TypeScript regenerados com novos IDs de contrato
- Logging aprimorado de simulação e decodificação de erros invokeHostFunction
- Re-deploy completo dos três contratos (verifier, registry, oracle)

Notas:

- O Compliance Oracle foi inicializado com admin = endereço do deployer.
- Para build de deploy, prefira Stellar CLI (wasm32v1-none).
- Use `scripts/deploy-with-identity.sh` para deployment com identidades do Stellar CLI.

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
VERIFIER_ID=CBRT2F27KEXANOP6ILGF2TPFZJKYZCFCWSPCUCX3DQQOH4OBIAHTSJ5F
CREDENTIAL_REGISTRY_ID=CCMAZDIUOLR66I2CABKI34JPXYPSZPTJREVRSDAKBSUIZ2QG73QFGUK4
COMPLIANCE_ORACLE_ID=CDOTN2UWCG26J2LKKNVUVFYBBHRPSSD7D5Z7N6K5C5F4M3TK35WR67AC
```

## Integridade & Verificação

- Fixar versões de circuitos e manter checksums (wasm, zkey, vk).
- Publicar tamanhos de WASM e hash de commit.
- Considerar SRI (Subresource Integrity) para assets wasm no frontend.
- Scripts de build reproduzíveis (determinismo).

## Troubleshooting

| Problema                   | Causa                                | Solução                                                                           |
| -------------------------- | ------------------------------------ | --------------------------------------------------------------------------------- |
| Prova inválida             | VK diferente                         | Re-exportar VK e atualizar no Verifier                                            |
| Deploy falha               | Conta sem fundos                     | Usar friendbot testnet                                                            |
| Erro de argumentos CLI     | Encoding incorreto                   | Usar SDK ou helpers base64/xdr                                                    |
| Tela branca no frontend    | Erro de exportação de módulo         | Verificar console do navegador; garantir versões iguais de `@stellar/stellar-sdk` |
| Warning React Router       | Future flag não configurada          | Verificar `future={{ v7_startTransition: true }}` no RouterProvider               |
| Warnings de interop no bot | Star exports nos pacotes de contrato | Não bloqueante; pode corrigir usando named exports                                |

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

| Target                | Descrição                                          |
| --------------------- | -------------------------------------------------- |
| `make install`        | Instala todas dependências (root + SDK + frontend) |
| `make build`          | Build do SDK e contratos (release)                 |
| `make test`           | Executa testes (SDK + contratos)                   |
| `make circuits-build` | Recompila circuitos Circom                         |
| `make app-dev`        | Sobe servidor de desenvolvimento do frontend       |
| `make deploy-testnet` | Executa script de deploy na testnet                |
| `make clean`          | Limpa artefatos de build                           |

## Códigos de Erro dos Contratos

| Contrato            | Enum              | Exemplos                                                    |
| ------------------- | ----------------- | ----------------------------------------------------------- |
| Verifier            | `VerifierError`   | `VkNotSet`, `EmptyProof`, `EmptyInputs`, `InvalidProofSize` |
| Credential Registry | `CredentialError` | `NotFound`, `AlreadyRevoked`, `Expired`, `Unauthorized`     |
| Compliance Oracle   | `ComplianceError` | `AdminNotSet`, `Unauthorized`, `AdminAlreadySet`            |

Todas funções falíveis retornam `Result<_, ErrorEnum>` evitando `panic!`.

## Tamanhos dos Artefatos WASM (Aprox)

| Contrato                 | Tamanho |
| ------------------------ | ------- |
| verifier.wasm            | ~6.4 KB |
| credential_registry.wasm | ~13 KB  |
| compliance_oracle.wasm   | ~6.9 KB |

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
import { VerifierClient } from 'zkid-sdk/client/contracts'
import { Networks } from '@stellar/stellar-sdk'

const verifier = new VerifierClient({
  contractId: 'CA64XL6ZGUEDN73SN2TAWHY5XBTWPO43K2HJ6YWV5VPV5V5UZRD6VUC4',
  networkPassphrase: Networks.TESTNET,
  rpcUrl: 'https://soroban-testnet.stellar.org',
})

const versao = await (await verifier.version()).simulate()

const signer = await getWalletSigner()
const tx = await verifier.verify_identity_proof(Buffer.from(prova), Buffer.from(inputs))
const resultado = await tx.signAndSend(signer)
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
- ✅ ~~Migrar para `#[contractevent]`~~ **CONCLUÍDO (9 de Janeiro de 2025)**
- Multisig para admin do compliance oracle.
- Adicionar SHA256 dos artefatos dos circuitos ao README.
- ✅ ~~Vincular provas aos endereços das carteiras~~ **CONCLUÍDO (addrHash nos circuitos)**

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
