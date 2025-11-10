# 🤖 ElizaOS Setup & Integração

Este guia explica como configurar e integrar o agente **ElizaOS** (`eliza_bot/`) ao monorepo ZKID Stellar para cenários de Compliance AI, automação e assistentes inteligentes.

---

## 📁 Estrutura do Projeto Eliza

```
eliza_bot/
  package.json        # Dependências ElizaOS (@elizaos/*)
  build.ts            # Script de build (Bun/Vite)
  src/                # Código fonte do agente (config, personas, adapters)
  .env.example        # Template de variáveis de ambiente
  .eliza/             # Configurações adicionais (personas, prompts, plugins)
```

O pacote foi adicionado como workspace no `package.json` raiz e scripts auxiliares foram criados:

```json
"scripts": {
  "eliza:dev": "cd eliza_bot && bun run dev",
  "eliza:start": "cd eliza_bot && bun run start",
  "eliza:build": "cd eliza_bot && bun run build"
}
```

---

## ✅ Pré-requisitos

| Ferramenta      | Versão recomendada | Instalação                         |
| --------------- | ------------------ | ---------------------------------- | ----- |
| Bun             | >= 1.3.x           | `curl -fsSL https://bun.sh/install | bash` |
| Eliza CLI       | >= 1.6.x           | `bun install -g @elizaos/cli`      |
| Node (fallback) | >= 18              | `nvm install 18`                   |

Verifique:

```bash
bun --version
elizaos --version
```

---

## 🔐 Variáveis de Ambiente

Copie o template:

```bash
cp eliza_bot/.env.example eliza_bot/.env
```

Edite os valores principais:

```bash
OPENAI_API_KEY=sk-...               # Ou use OLLAMA / LM_STUDIO
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1               # Ajuste para modelo local
```

Opções de provedores suportados:

- OpenAI (`OPENAI_API_KEY`)
- Ollama local (`OLLAMA_BASE_URL` + `OLLAMA_MODEL`)
- LM Studio (`LMSTUDIO_BASE_URL` + modelo HuggingFace)

Para execução 100% local (sem chave OpenAI):

```bash
# No .env
USE_OPENAI=false
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

Instale e suba o Ollama (se necessário):

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama run llama3.1
```

---

## 🚀 Rodando o Agente

Desenvolvimento (hot reload):

```bash
npm run eliza:dev
```

Produção:

```bash
npm run eliza:build
npm run eliza:start
```

A API padrão sobe em `http://localhost:3000` com endpoints como:

- `GET /api/health`
- `POST /api/message` (corpo: `{ "text": "Pergunta" }`)

Teste rápido:

```bash
curl -X POST http://localhost:3000/api/message \
  -H 'Content-Type: application/json' \
  -d '{"text":"Olá agente, qual o status de compliance?"}'
```

---

## 🔌 Integração com Frontend

1. Adicionar serviço no frontend (`frontend/zkid-app/src/services/eliza.ts`):

```ts
export async function askComplianceAgent(prompt: string) {
  const res = await fetch('http://localhost:3000/api/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: prompt }),
  })
  if (!res.ok) throw new Error('Falha na resposta do agente')
  return res.json()
}
```

2. Criar componente `ComplianceAssistant.tsx` exibindo diálogo.
3. Usar agente para: resumo de transações, explicação de revogações, interpretação de proofs.

---

## 🧠 Personas & Plugins

Edite `.eliza/*` para personalizar:

- `persona.json`: Tom, objetivos e estilo de resposta.
- Plugins (ex.: `@elizaos/plugin-sql`, `@elizaos/plugin-ollama`) já instalados.
- Adicionar plugin custom para leitura de eventos Soroban (futuro).

Exemplo de objetivo persona compliance:

```json
{
  "name": "ComplianceAI",
  "goals": [
    "Explicar motivos de revogação de credenciais",
    "Gerar relatórios de risco simplificados",
    "Responder em linguagem natural sobre status regulatório"
  ]
}
```

---

## 🔄 Fluxo de Valor

1. Usuário solicita análise (frontend) →
2. Serviço chama `eliza_bot` →
3. Agente consulta proofs / eventos (futuro plugin) →
4. Resposta explicável retorna ao dApp.

---

## 🛡️ Segurança

- Nunca enviar dados brutos de identidade ao agente (usar apenas hashes, IDs ou proofs resumidas).
- Sanitizar prompts do usuário (remover PII).
- Usar logs estruturados para auditoria (`COMPLIANCE_LOG_LEVEL=info`).

---

## 📈 Próximos Passos

| Item                           | Status |
| ------------------------------ | ------ |
| Documentar persona inicial     | ✅     |
| Integração frontend (painel)   | ⏳     |
| Plugin Soroban (event fetch)   | 🚧     |
| Testes de carga (10 req/s)     | 🚧     |
| Cache de respostas explicáveis | 🚧     |

---

## ❗ Troubleshooting

| Erro                          | Causa               | Solução                            |
| ----------------------------- | ------------------- | ---------------------------------- |
| `OPENAI_API_KEY missing`      | .env incompleto     | Usar Ollama ou adicionar chave     |
| `ECONNREFUSED localhost:3000` | Agente não iniciou  | Verificar `npm run eliza:dev` logs |
| Latência alta                 | Modelo remoto lento | Usar modelo local (Ollama)         |
| Resposta superficial          | Persona genérica    | Ajustar `.eliza/persona.json`      |

---

## 📜 Referências

- ElizaOS: https://github.com/elizaOS/eliza
- Ollama: https://ollama.com
- Soroban Docs: https://soroban.stellar.org

---

## ✅ Conclusão

ElizaOS agora está integrado como um subsistema de IA para compliance e explicabilidade. Próximo passo é conectar o agente ao frontend e enriquecer com plugins que leem eventos on-chain.
