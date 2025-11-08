<p align="center">
	<img src="public/brand/zkid-logo.png" alt="ZKID logo" width="220" />
</p>

# ZKID Stellar Frontend

Interface moderna e futurista para o sistema de identidade zero-knowledge na blockchain Stellar.

## 🎨 Design System

### Tema Visual
- **Fundo**: Gradiente escuro (`#0b1020` → `#0f172a`) com grade sutil para efeito cyberpunk
- **Glassmorphism**: Cards transparentes com backdrop-blur e bordas suaves
- **Cores Neon**: Primary (`#6d6cff`), Cyan (`#00E5FF`), Pink (`#FF4FD8`), Lime (`#D7FF3C`)
- **Animações**: Glow effects, float, shine para interações visuais impressionantes

### Tipografia
- **Display**: Space Grotesk (para headings e logo)
- **Body**: Inter (para textos e UI)

### Componentes UI
- `Button`: Variantes primary, secondary, danger, ghost com efeitos glow
- `Card`: Glass cards com gradiente sutil e hover effects
- `Form`: Inputs com fundo translúcido e focus rings animados
- `Badge`, `Alert`: Estados visuais com cores semânticas

## 🚀 Como Rodar

### Desenvolvimento
```bash
npm run dev
```
Acesse em: http://localhost:5173

### Build de Produção
```bash
npm run build
```
Arquivos otimizados em `dist/`

### Preview do Build
```bash
npm run preview
```

## 📦 Dependências Principais
- **React 18** + **React Router v6**: Framework e roteamento
- **Vite**: Build tool ultra-rápido
- **Tailwind CSS v3**: Utility-first styling
- **@stellar/stellar-sdk**: Integração blockchain
- **zkid-sdk**: SDK local para provas ZK

## 🌐 Estrutura de Rotas
- `/` - Landing page com hero e features
- `/dashboard` - Gerenciamento de credenciais
- `/proofs` - Catálogo de tipos de prova
- `/proofs/age`, `/proofs/country`, `/proofs/income` - Geradores de prova
- `/latam` - Casos de uso LATAM (Pix, remessas, microcrédito)
- `/compliance` - Auditoria e explicações AI
- `/settings` - Conexão de carteira e preferências
- `/diagnostic` - Debug de integração Freighter/Albedo

## 🎯 Próximos Passos
- [ ] Adicionar animações de transição entre páginas
- [ ] Implementar dark mode toggle (opcional, já é escuro por padrão)
- [ ] Melhorar acessibilidade (ARIA labels, keyboard nav)
- [ ] Adicionar skeleton loaders para estados de carregamento
- [ ] Otimizar bundle size com code splitting

## 🛠️ Troubleshooting

**Problema: Carteira não conecta**
→ Rode `/diagnostic` para verificar extensões instaladas

**Problema: CSS não carrega**
→ Verifique se PostCSS e Tailwind estão instalados corretamente

**Problema: Build falha**
→ Limpe node_modules e reinstale: `rm -rf node_modules package-lock.json && npm install`

---

Desenvolvido com ❤️ para o ecossistema Stellar
