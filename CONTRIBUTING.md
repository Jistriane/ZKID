# Contributing to ZKID Stellar

Obrigado pelo interesse em contribuir! 🎉

## Como Contribuir

### 1. Setup Local
Siga as instruções do [README.md](../README.md) para configurar o ambiente de desenvolvimento.

### 2. Criar Branch
```bash
git checkout -b feature/minha-feature
# ou
git checkout -b fix/meu-bugfix
```

### 3. Fazer Mudanças
- Mantenha commits pequenos e focados
- Use mensagens de commit descritivas em inglês:
  - `feat: adicionar verificação de país`
  - `fix: corrigir hash de proof`
  - `docs: atualizar README`
  - `test: adicionar testes para SDK`

### 4. Testes e Lint
```bash
npm test
npm run lint
npm run typecheck
```

### 5. Submit PR
- Descreva claramente as mudanças
- Referencie issues relacionadas
- Aguarde code review

## Estrutura do Código

- `contracts/`: Contratos Soroban (Rust)
- `circuits/`: Circuitos Circom (ZK)
- `sdk/zkid-sdk/`: SDK TypeScript
- `frontend/zkid-app/`: Frontend React
- `docs/`: Documentação
- `infra/`: Scripts de infra

## Padrões de Código

### TypeScript
- Use TypeScript strict mode
- Documente funções públicas
- Evite `any` (prefira `unknown`)
- Use imports absolutos quando possível

### Rust
- Siga convenções do Soroban
- Documente contratos e funções públicas
- Adicione testes unitários

### Circom
- Comente a lógica dos circuitos
- Forneça inputs de exemplo
- Teste provas localmente antes de commitar

## Áreas para Contribuir

- 🔐 Verificação Groth16 on-chain otimizada
- 🌐 Novos circuitos (crédito, educação, saúde)
- 🎨 Melhorias de UI/UX
- 📚 Documentação e tutoriais
- 🧪 Testes e cobertura
- 🐛 Correção de bugs

## Código de Conduta

- Seja respeitoso e construtivo
- Foco em soluções técnicas
- Sem discriminação ou assédio
- Ajude outros contribuidores

## Dúvidas?

Abra uma issue ou discussão no GitHub!
