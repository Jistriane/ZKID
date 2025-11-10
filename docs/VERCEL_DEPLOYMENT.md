# 🚀 Vercel Deployment Guide - ZKID Stellar

Deploy completo do frontend ZKID na Vercel com configuração de testnet.

## 📋 Informações do Deploy Atual

**Data do Deploy:** 10 de Novembro de 2025  
**Status:** ● Ready (Production)  
**URL de Produção:** <https://zkid-stellar.vercel.app>  
**Painel Vercel:** <https://vercel.com/jistrianedroid-3423s-projects/zkid-stellar>

> **Nota:** A Vercel automaticamente atribuiu a URL limpa `zkid-stellar.vercel.app` após o primeiro deploy bem-sucedido. Esta URL é permanente e pode ser usada para compartilhar a aplicação.

## 🏗️ Configuração

### Estrutura do Monorepo

O projeto é um monorepo NPM com workspaces:

- Root: Configuração principal e scripts
- `sdk/zkid-sdk/`: SDK TypeScript (deve ser compilado antes do frontend)
- `frontend/zkid-app/`: Aplicação React + Vite
- `packages/`: Clientes TypeScript gerados dos contratos Soroban

### Arquivo vercel.json (Root)

```json
{
  "buildCommand": "npm run build --workspace=zkid-sdk && npm run build --workspace=zkid-app",
  "outputDirectory": "frontend/zkid-app/dist",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_STELLAR_NETWORK": "testnet",
    "VITE_HORIZON_URL": "https://horizon-testnet.stellar.org",
    "VITE_RPC_URL": "https://soroban-testnet.stellar.org",
    "VITE_VERIFIER_CONTRACT_ID": "CBRT2F27KEXANOP6ILGF2TPFZJKYZCFCWSPCUCX3DQQOH4OBIAHTSJ5F",
    "VITE_CREDENTIAL_REGISTRY_CONTRACT_ID": "CCMAZDIUOLR66I2CABKI34JPXYPSZPTJREVRSDAKBSUIZ2QG73QFGUK4",
    "VITE_COMPLIANCE_ORACLE_CONTRACT_ID": "CDOTN2UWCG26J2LKKNVUVFYBBHRPSSD7D5Z7N6K5C5F4M3TK35WR67AC",
    "VITE_ENABLE_DEBUG": "false",
    "VITE_MOCK_PROOFS": "false"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 🔐 Variáveis de Ambiente

### Testnet (Produção Atual)

```bash
VITE_STELLAR_NETWORK=testnet
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_RPC_URL=https://soroban-testnet.stellar.org
VITE_VERIFIER_CONTRACT_ID=CBRT2F27KEXANOP6ILGF2TPFZJKYZCFCWSPCUCX3DQQOH4OBIAHTSJ5F
VITE_CREDENTIAL_REGISTRY_CONTRACT_ID=CCMAZDIUOLR66I2CABKI34JPXYPSZPTJREVRSDAKBSUIZ2QG73QFGUK4
VITE_COMPLIANCE_ORACLE_CONTRACT_ID=CDOTN2UWCG26J2LKKNVUVFYBBHRPSSD7D5Z7N6K5C5F4M3TK35WR67AC
VITE_ENABLE_DEBUG=false
VITE_MOCK_PROOFS=false
```

### Mainnet (Futuro)

Quando migrar para mainnet, atualizar:

```bash
VITE_STELLAR_NETWORK=mainnet
VITE_HORIZON_URL=https://horizon.stellar.org
VITE_RPC_URL=https://soroban-rpc.stellar.org
# Atualizar IDs dos contratos após deploy na mainnet
VITE_VERIFIER_CONTRACT_ID=<MAINNET_VERIFIER_ID>
VITE_CREDENTIAL_REGISTRY_CONTRACT_ID=<MAINNET_REGISTRY_ID>
VITE_COMPLIANCE_ORACLE_CONTRACT_ID=<MAINNET_ORACLE_ID>
```

## 🛠️ Processo de Build

### Ordem de Compilação

1. **Instalar dependências** (root e workspaces)
   ```bash
   npm install
   ```

2. **Compilar SDK** (primeiro, porque frontend depende dele)
   ```bash
   npm run build --workspace=zkid-sdk
   ```

3. **Compilar Frontend**
   ```bash
   npm run build --workspace=zkid-app
   ```

### Problemas Resolvidos

#### 1. Dependência Local do SDK

**Problema:** `zkid-sdk` é um pacote local (`file:../../sdk/zkid-sdk`) que precisa ser compilado antes do frontend.

**Solução:** Build command sequencial compila SDK primeiro:
```json
"buildCommand": "npm run build --workspace=zkid-sdk && npm run build --workspace=zkid-app"
```

#### 2. Caminhos Relativos no Monorepo

**Problema:** Vercel executa build dentro do contexto do diretório especificado, não do root.

**Solução:** Configurar `vercel.json` no root com `outputDirectory` apontando para `frontend/zkid-app/dist`.

#### 3. Nome do Projeto

**Problema:** Nome do diretório continha espaço ("ZKID Stellar"), causando erro de validação.

**Solução:** Deploy com flag `--name zkid-stellar` (snake-case válido).

## 🚀 Comandos de Deploy

### Deploy Manual

```bash
cd /home/jistriane/Documentos/Projetos/ZKID\ Stellar
vercel --prod --yes --name zkid-stellar
```

### Deploy Automático (GitHub Integration)

Configurado para deploy automático em push para `main`:

1. Push para GitHub
2. Vercel detecta mudanças
3. Build automático
4. Deploy em produção

## 📊 Logs e Monitoramento

### Verificar Status

```bash
vercel ls
```

### Inspecionar Deploy Específico

Acessar URL do inspect mostrada no output do deploy, ex:
```
https://vercel.com/jistrianedroid-3423s-projects/zkid-stellar/2rPdpGDBibu8mPQL5GwXKtmtqoqR
```

### Logs em Tempo Real

```bash
vercel logs <deployment-url>
```

## 🔒 Segurança

### Headers Configurados

- `X-Content-Type-Options: nosniff` - Previne MIME sniffing
- `X-Frame-Options: DENY` - Previne clickjacking
- `X-XSS-Protection: 1; mode=block` - Proteção XSS básica

### Rewrites para SPA

Todas as rotas redirecionam para `/index.html` para suportar React Router:

```json
{
  "source": "/(.*)",
  "destination": "/index.html"
}
```

## 📝 Checklist de Atualização

Ao atualizar contratos ou fazer novo deploy:

- [ ] Atualizar IDs dos contratos em `vercel.json`
- [ ] Atualizar `.env.production` no frontend
- [ ] Regenerar clientes TypeScript (`npm run build:clients`)
- [ ] Rebuild do SDK (`npm run build -w sdk/zkid-sdk`)
- [ ] Testar localmente antes do deploy
- [ ] Deploy para Vercel
- [ ] Verificar deploy bem-sucedido
- [ ] Atualizar documentação (README.md, etc)

## 🔗 Links Úteis

- [Documentação Vercel](https://vercel.com/docs)
- [Configuração Vite](https://vitejs.dev/config/)
- [Monorepo com Vercel](https://vercel.com/docs/monorepos)
- [Environment Variables](https://vercel.com/docs/environment-variables)

## 📞 Troubleshooting

### Build Falha com "Module not found"

**Causa:** SDK não compilado antes do frontend.

**Solução:** Garantir ordem correta no `buildCommand`.

### Tela Branca em Produção

**Causa:** Variáveis de ambiente não definidas ou rotas SPA não configuradas.

**Solução:** Verificar `env` no `vercel.json` e `rewrites`.

### Erro de Autenticação com Contratos

**Causa:** IDs de contrato incorretos ou rede errada.

**Solução:** Verificar IDs em `vercel.json` correspondem aos deployments atuais.

---

**Última Atualização:** 10 de Novembro de 2025
