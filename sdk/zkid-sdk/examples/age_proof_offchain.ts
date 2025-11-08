import { groth16 } from 'snarkjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoRoot = path.resolve(__dirname, '../../..');
  const artDir = path.join(repoRoot, 'circuits', 'artifacts', 'age_verification');
  const wasm = path.join(artDir, 'age_verification.wasm');
  const zkey = path.join(artDir, 'age_verification.zkey');
  const vkeyPath = path.join(artDir, 'verification_key.json');

  // Exemplo de entrada: pessoa nascida em 2000, ano atual 2025, minAge 18 -> is_adult=1
  const input = {
    birthYear: 2000,
    currentYear: 2025,
    minAge: 18
  };

  console.log('➡️  Gerando prova off-chain com snarkjs...');
  const { proof, publicSignals } = await groth16.fullProve(input, wasm, zkey);
  console.log('✅ Prova gerada');
  console.log('publicSignals =', publicSignals);

  const vkey = JSON.parse(await fs.readFile(vkeyPath, 'utf-8'));
  const ok = await groth16.verify(vkey, publicSignals, proof);
  console.log('🔎 Verificação off-chain:', ok ? 'VALIDA' : 'INVÁLIDA');

  // Dump opcional dos artefatos da prova para uso no contrato
  const outDir = path.join(repoRoot, 'circuits', 'artifacts', 'age_verification');
  await fs.writeFile(path.join(outDir, 'proof_example.json'), JSON.stringify(proof, null, 2));
  await fs.writeFile(path.join(outDir, 'public_signals_example.json'), JSON.stringify(publicSignals, null, 2));
  console.log('📝 Artefatos salvos em:', outDir);
}

main().catch((err) => {
  console.error('Erro ao gerar/verificar prova off-chain:', err);
  process.exit(1);
});
