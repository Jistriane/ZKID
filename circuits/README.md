# Circuitos ZKID

Este diretório contém os circuitos Circom e os artefatos necessários para geração e verificação de provas Groth16.

## Estrutura
- `*.circom`: circuitos fonte (age_verification, country_verification, income_threshold)
- `artifacts/<circuit>/`: artefatos compilados (wasm, zkey, vkey.json)
- `example_*_input.json`: inputs de exemplo para testes

## Dependências
- circom 2.1.5+
- snarkjs 0.7.4+
- circomlib (para comparadores)

Instalar:
```bash
npm install -g circom snarkjs
git clone https://github.com/iden3/circomlib.git node_modules/circomlib
```

## Passos de Compilação

### 1. Compilar circuito
```bash
circom circuits/age_verification.circom --r1cs --wasm --sym -o circuits/artifacts/age_verification
```

### 2. Setup (Powers of Tau + zkey)
```bash
# Download ptau (se não tiver)
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau -O circuits/ptau10.ptau

# Gerar zkey
snarkjs groth16 setup circuits/artifacts/age_verification/age_verification.r1cs circuits/ptau10.ptau circuits/artifacts/age_verification/age_verification.zkey
```

### 3. Exportar verification key
```bash
snarkjs zkey export verificationkey circuits/artifacts/age_verification/age_verification.zkey circuits/artifacts/age_verification/verification_key.json
```

### 4. Testar prova local
```bash
# Usar script helper
bash infra/scripts/test-proof.sh age_verification

# Ou manualmente
snarkjs groth16 fullprove circuits/example_age_input.json \
  circuits/artifacts/age_verification/age_verification_js/age_verification.wasm \
  circuits/artifacts/age_verification/age_verification.zkey \
  proof.json public.json

snarkjs groth16 verify \
  circuits/artifacts/age_verification/verification_key.json \
  public.json proof.json
```

## Copiar para Frontend
```bash
cp -r circuits/artifacts/* frontend/zkid-app/public/circuits/artifacts/
```

## Circuitos Disponíveis

### age_verification
- **Input privado**: birthYear
- **Inputs públicos**: currentYear, minAge
- **Output**: is_adult (1 se idade >= minAge)

### country_verification
- **Input privado**: countryCode
- **Input público**: targetCode
- **Output**: is_target (1 se match)

### income_threshold
- **Input privado**: income
- **Input público**: threshold
- **Output**: ok (1 se income >= threshold)

## Troubleshooting

### Erro: "include not found: circomlib"
Instalar circomlib ou ajustar path:
```bash
npm install circomlib
# ou
export NODE_PATH=$NODE_PATH:./node_modules
```

### Erro no pareamento/verificação
Verificar que o ptau usado no setup é compatível com o tamanho do circuito.
