import { groth16 } from 'snarkjs'
import { sha256 } from 'js-sha256'

export type FullProveArgs = {
  wasmPath: string
  zkeyPath: string
  input: Record<string, unknown>
}

export async function fullProve({ wasmPath, zkeyPath, input }: FullProveArgs) {
  const res = await groth16.fullProve(input, wasmPath, zkeyPath)
  return res as { proof: unknown; publicSignals: unknown }
}

export function hashCanonical(obj: unknown): string {
  const json = JSON.stringify(sortObject(obj))
  return sha256(json)
}

function sortObject(value: any): any {
  if (Array.isArray(value)) return value.map(sortObject)
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc: any, k) => {
        acc[k] = sortObject(value[k])
        return acc
      }, {})
  }
  return value
}
