# ZKID Stellar Documentation

## Overview

ZKID Stellar is a privacy-preserving identity and compliance system built on the Stellar blockchain. It leverages zero-knowledge proofs (ZKP) to enable users to verify attributes (such as age, country, or income) without revealing sensitive personal data. The system is modular, supporting multiple verification circuits and smart contracts for compliance, credential registry, and proof verification.

## Features

- **Zero-Knowledge Proofs**: Circuits for age, country, and income verification using Circom.
- **Smart Contracts**: Compliance Oracle, Credential Registry, and Verifier contracts written in Rust for Stellar Soroban.
- **Frontend**: Web application for user interaction and proof generation.
- **SDK**: TypeScript SDK for integration with external apps.
- **Automation Scripts**: Shell scripts for circuit compilation, deployment, and testing.
- **Bot Integration**: Eliza Bot for automated interactions and testing.

## Architecture

### High-Level Components

1. **Circuits**: Circom-based ZKP circuits for attribute verification.
2. **Smart Contracts**: Soroban contracts for compliance, credential management, and proof verification.
3. **Frontend**: React/Vite-based web app for user onboarding and proof generation.
4. **SDK**: TypeScript SDK for developers to integrate ZKID features.
5. **Automation**: Scripts for building, testing, and deploying circuits and contracts.
6. **Bot**: Eliza Bot for automated testing and user guidance.

### Data Flow

1. User submits attribute (e.g., age) in the frontend.
2. Frontend generates a ZKP using the relevant circuit.
3. Proof is sent to the Verifier contract on Stellar.
4. Verifier contract checks proof validity and interacts with Compliance Oracle and Credential Registry as needed.
5. Result is returned to the frontend for user feedback.

### Directory Structure

- `circuits/`: Circom circuits and artifacts.
- `contracts/`: Soroban smart contracts (Rust).
- `frontend/zkid-app/`: Web application.
- `sdk/zkid-sdk/`: TypeScript SDK.
- `eliza_bot/`: Bot scripts and configuration.
- `infra/`: Docker and deployment scripts.
- `docs/`: Documentation and guides.
- `scripts/`: Shell scripts for automation.

## Roadmap

### v0.1.0

- Age, country, and income verification circuits
- Initial Soroban contracts
- Basic frontend and SDK
- Automation scripts

### v0.2.0

- Multi-attribute proofs
- Advanced compliance logic
- Improved frontend UX
- Integration with external identity providers
- Enhanced bot automation

### v1.0.0

- Production-ready deployment
- Full documentation and API examples
- Community contributions and governance
- Support for additional blockchains

## Requirements

- Node.js, Rust, Circom, Docker
- Stellar Soroban CLI
- Supported browsers for frontend

## API Examples

See `docs/API_EXAMPLES.md` for sample API calls and integration guides.

## Build & Deployment

- Use `scripts/build-circuits.sh` to compile ZKP circuits.
- Use `scripts/compile-circuits.sh` for contract compilation.
- Use `scripts/auto-deploy.sh` for automated deployment.
- Docker setup available in `infra/docker/`.

## Contributing

See `CONTRIBUTING.md` for guidelines.

## License

MIT License. See `LICENSE` for details.

## Contact & Community

- GitHub: [Jistriane/ZKID](https://github.com/Jistriane/ZKID)
- Issues and feature requests via GitHub.

---

For more details, refer to the individual documentation files in the `docs/` folder.
