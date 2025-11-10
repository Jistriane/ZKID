import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CCMAZDIUOLR66I2CABKI34JPXYPSZPTJREVRSDAKBSUIZ2QG73QFGUK4",
  }
} as const


export interface Credential {
  expires_at: u64;
  owner: string;
  proof_hash: Buffer;
  revoked: boolean;
}

export const CredentialError = {
  1: {message:"NotFound"},
  2: {message:"AlreadyRevoked"},
  3: {message:"Expired"},
  4: {message:"Unauthorized"}
}



export interface Client {
  /**
   * Construct and simulate a revoke transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Revoga credencial (apenas o owner pode revogar)
   */
  revoke: ({caller, credential_id}: {caller: string, credential_id: Buffer}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a version transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Versão do contrato
   */
  version: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a is_valid transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Consulta validade da credencial
   */
  is_valid: ({credential_id}: {credential_id: Buffer}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_credential transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Retorna informações completas da credencial
   */
  get_credential: ({credential_id}: {credential_id: Buffer}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<Credential>>>

  /**
   * Construct and simulate a issue_credential transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Emite uma credencial vinculada a um owner após validação off-chain/on-chain do Verifier.
   */
  issue_credential: ({owner, proof_hash, ttl_seconds}: {owner: string, proof_hash: Buffer, ttl_seconds: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Buffer>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAACkNyZWRlbnRpYWwAAAAAAAQAAAAAAAAACmV4cGlyZXNfYXQAAAAAAAYAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAKcHJvb2ZfaGFzaAAAAAAADgAAAAAAAAAHcmV2b2tlZAAAAAAB",
        "AAAABAAAAAAAAAAAAAAAD0NyZWRlbnRpYWxFcnJvcgAAAAAEAAAAAAAAAAhOb3RGb3VuZAAAAAEAAAAAAAAADkFscmVhZHlSZXZva2VkAAAAAAACAAAAAAAAAAdFeHBpcmVkAAAAAAMAAAAAAAAADFVuYXV0aG9yaXplZAAAAAQ=",
        "AAAABQAAAAAAAAAAAAAAEENyZWRlbnRpYWxJc3N1ZWQAAAABAAAAEWNyZWRlbnRpYWxfaXNzdWVkAAAAAAAAAwAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAAAAAANY3JlZGVudGlhbF9pZAAAAAAAAA4AAAAAAAAAAAAAAApleHBpcmVzX2F0AAAAAAAGAAAAAAAAAAI=",
        "AAAAAAAAAC9SZXZvZ2EgY3JlZGVuY2lhbCAoYXBlbmFzIG8gb3duZXIgcG9kZSByZXZvZ2FyKQAAAAAGcmV2b2tlAAAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAADWNyZWRlbnRpYWxfaWQAAAAAAAAOAAAAAQAAA+kAAAPtAAAAAAAAB9AAAAAPQ3JlZGVudGlhbEVycm9yAA==",
        "AAAABQAAAAAAAAAAAAAAEUNyZWRlbnRpYWxSZXZva2VkAAAAAAAAAQAAABJjcmVkZW50aWFsX3Jldm9rZWQAAAAAAAIAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAAAAAADWNyZWRlbnRpYWxfaWQAAAAAAAAOAAAAAAAAAAI=",
        "AAAAAAAAABNWZXJzw6NvIGRvIGNvbnRyYXRvAAAAAAd2ZXJzaW9uAAAAAAAAAAABAAAAEQ==",
        "AAAAAAAAAB9Db25zdWx0YSB2YWxpZGFkZSBkYSBjcmVkZW5jaWFsAAAAAAhpc192YWxpZAAAAAEAAAAAAAAADWNyZWRlbnRpYWxfaWQAAAAAAAAOAAAAAQAAAAE=",
        "AAAAAAAAAC1SZXRvcm5hIGluZm9ybWHDp8O1ZXMgY29tcGxldGFzIGRhIGNyZWRlbmNpYWwAAAAAAAAOZ2V0X2NyZWRlbnRpYWwAAAAAAAEAAAAAAAAADWNyZWRlbnRpYWxfaWQAAAAAAAAOAAAAAQAAA+gAAAfQAAAACkNyZWRlbnRpYWwAAA==",
        "AAAAAAAAAFtFbWl0ZSB1bWEgY3JlZGVuY2lhbCB2aW5jdWxhZGEgYSB1bSBvd25lciBhcMOzcyB2YWxpZGHDp8OjbyBvZmYtY2hhaW4vb24tY2hhaW4gZG8gVmVyaWZpZXIuAAAAABBpc3N1ZV9jcmVkZW50aWFsAAAAAwAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAApwcm9vZl9oYXNoAAAAAAAOAAAAAAAAAAt0dGxfc2Vjb25kcwAAAAAEAAAAAQAAAA4=" ]),
      options
    )
  }
  public readonly fromJSON = {
    revoke: this.txFromJSON<Result<void>>,
        version: this.txFromJSON<string>,
        is_valid: this.txFromJSON<boolean>,
        get_credential: this.txFromJSON<Option<Credential>>,
        issue_credential: this.txFromJSON<Buffer>
  }
}