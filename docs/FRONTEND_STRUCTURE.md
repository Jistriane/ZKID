# Frontend Structure

React + Vite application providing user interactions for proofs, credentials, compliance checks, and AI assistance.

## 1. Directory Layout

```
frontend/zkid-app/
  src/
    components/
    pages/
    context/
    services/
    styles/
    main.tsx
    App.tsx
  public/
    circuits/ (wasm + zkey + verification key)
```

## 2. Key Folders

| Folder        | Purpose                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| `components/` | Reusable UI units (forms, loaders, proof widgets).                      |
| `pages/`      | Route-level views (Dashboard, Proofs, Credentials, Compliance, Demo).   |
| `context/`    | React context providers (auth/passkeys, contract clients, proof state). |
| `services/`   | API integration (ElizaOS client, SDK wrappers).                         |
| `styles/`     | Global & modular CSS / Tailwind / utility styles if used.               |

## 3. App Initialization

`main.tsx` bootstraps React → `<App />` sets up routing & global providers (e.g., WalletProvider, PasskeyProvider, ZkSdkProvider).

## 4. State Management

Lightweight approach: React context + hooks.
| Context | Responsibility |
|---------|----------------|
| Auth/Wallet | Stellar address, session, connection status. |
| Proof | Current circuit selection, generated proof, public signals. |
| Credential | Issued credentials cache, validity checks. |
| Compliance | Sanction status & explanation data. |
| AI Assistant | Conversation state, loading indicators. |

## 5. Passkeys Integration

Flow:

1. User opts in to create passkey (WebAuthn).
2. Public key credential mapped to user identity record (local or off-chain).
3. Future logins use navigator.credentials.get for passwordless recovery.
4. Soulbound credentials conceptually linked to wallet/passkey pair.

## 6. Proof Generation UI

Steps typically shown:

1. User enters attribute input (e.g., birth year).
2. Select threshold (e.g., ≥ 18).
3. Click “Generate Proof” → invokes wasm + snarkjs.
4. Show loading spinner (progress approx).
5. Display success / failure & enable “Verify On-Chain”.

## 7. Credential Issuance Flow

1. After a successful proof, user clicks “Issue Credential”.
2. SDK sends transaction to registry contract.
3. UI shows pending state (await confirmation).
4. Credential ID stored locally (cache + optional localStorage).
5. Validity badge displayed (green if valid).

## 8. Compliance Check Flow

1. User selects credential or proof hash.
2. Query compliance oracle.
3. Display sanctioned (red) / clear (green).
4. If explanation exists, provide “View Explanation” link that loads URI content (optional) + AI summarize.

## 9. AI Assistant Integration

Widget or page component calls local ElizaOS service:

- Endpoint: e.g., `http://localhost:3000/api/chat`
- Streams or simple post responses.
- Wrap responses in UI card with source metadata (model name).
- STRICT: Do not send raw PII; only hashed or abstracted data.

## 10. Error Handling Pattern

Central toast/snackbar system for:

- Network errors
- Contract rejections
- ZK generation failures
- Missing verification key

Map contract numeric errors → human-readable messages.

## 11. Performance Tips

| Area             | Tip                                              |
| ---------------- | ------------------------------------------------ |
| Proof Generation | Web Worker offloading for heavy wasm operations. |
| Circuit Assets   | Lazy load circuits only when needed.             |
| Credential Cache | Memoize validity checks, refresh on events.      |
| AI Assistant     | Debounce user input; reuse conversation context. |

## 12. Security

- Sanitize all user inputs (even though not sent to server).
- Avoid logging raw witness values.
- Use HTTPS in production.
- Integrity check circuit wasm (optional checksum).

## 13. Testing Strategy

| Layer         | Approach                                     |
| ------------- | -------------------------------------------- |
| Unit          | Component logic & hooks.                     |
| Integration   | Proof → verify → issue flow with mocked SDK. |
| E2E           | Cypress/Playwright: full user journey.       |
| Accessibility | Lighthouse / axe checks.                     |

## 14. Future Enhancements

- Dark mode theme.
- Mobile responsive layout improvements.
- Progressive Web App (PWA) packaging.
- Multi-language i18n (English, Portuguese, Spanish).
- Live event stream (credential issued/revoked).

---

End of frontend structure guide.
