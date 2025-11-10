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
    contractId: "CBRT2F27KEXANOP6ILGF2TPFZJKYZCFCWSPCUCX3DQQOH4OBIAHTSJ5F",
  }
} as const



export interface Groth16Proof {
  pi_a: Array<Buffer>;
  pi_b: Array<Array<Buffer>>;
  pi_c: Array<Buffer>;
}

export const VerifierError = {
  1: {message:"VkNotSet"},
  2: {message:"EmptyProof"},
  3: {message:"EmptyInputs"},
  4: {message:"InvalidProofSize"},
  5: {message:"NotVerified"}
}



export interface VerificationKey {
  alpha: Array<Buffer>;
  beta: Array<Array<Buffer>>;
  delta: Array<Array<Buffer>>;
  gamma: Array<Array<Buffer>>;
  ic: Array<Array<Buffer>>;
}

export interface Client {
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
   * Construct and simulate a get_commit_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Retorna o Address que verificou a prova (se existir)
   */
  get_commit_owner: ({commitment}: {commitment: Buffer}, options?: {
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
  }) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a set_vk_structured transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Versão estruturada para set VK
   */
  set_vk_structured: ({vk}: {vk: VerificationKey}, options?: {
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
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a is_commit_verified transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verifica se um commitment já foi registrado
   */
  is_commit_verified: ({commitment}: {commitment: Buffer}, options?: {
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
   * Construct and simulate a get_verification_key transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Retorna VK atual (formato raw)
   */
  get_verification_key: (options?: {
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
  }) => Promise<AssembledTransaction<Option<Buffer>>>

  /**
   * Construct and simulate a set_verification_key transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Define/Atualiza a VK (verification key) completa
   */
  set_verification_key: ({vk}: {vk: Buffer}, options?: {
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
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a verify_identity_proof transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Valida uma prova Groth16 (placeholder estrutural) e associa o compromisso à carteira que assinou a transação.
   * Novo fluxo: a carteira do usuário deve assinar a transação que invoca este método (caller.require_auth()),
   * eliminando geração "simulada" sem wallet. Retorna o commitment (hash final) para ser usado como proof_hash
   * em outros contratos (ex: CredentialRegistry).
   */
  verify_identity_proof: ({caller, proof, public_inputs}: {caller: string, proof: Buffer, public_inputs: Buffer}, options?: {
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
  }) => Promise<AssembledTransaction<Result<Buffer>>>

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
      new ContractSpec([ "AAAABQAAAAAAAAAAAAAABVZrU2V0AAAAAAAAAQAAAAZ2a19zZXQAAAAAAAEAAAAAAAAABnZrX2xlbgAAAAAABAAAAAAAAAAC",
        "AAAAAAAAABNWZXJzw6NvIGRvIGNvbnRyYXRvAAAAAAd2ZXJzaW9uAAAAAAAAAAABAAAAEQ==",
        "AAAAAQAAAAAAAAAAAAAADEdyb3RoMTZQcm9vZgAAAAMAAAAAAAAABHBpX2EAAAPqAAAADgAAAAAAAAAEcGlfYgAAA+oAAAPqAAAADgAAAAAAAAAEcGlfYwAAA+oAAAAO",
        "AAAABAAAAAAAAAAAAAAADVZlcmlmaWVyRXJyb3IAAAAAAAAFAAAAAAAAAAhWa05vdFNldAAAAAEAAAAAAAAACkVtcHR5UHJvb2YAAAAAAAIAAAAAAAAAC0VtcHR5SW5wdXRzAAAAAAMAAAAAAAAAEEludmFsaWRQcm9vZlNpemUAAAAEAAAAAAAAAAtOb3RWZXJpZmllZAAAAAAF",
        "AAAABQAAAAAAAAAAAAAADVByb29mVmVyaWZpZWQAAAAAAAABAAAADnByb29mX3ZlcmlmaWVkAAAAAAADAAAAAAAAAAh2ZXJpZmllcgAAABMAAAAAAAAAAAAAAAxwdWJsaWNfY291bnQAAAAEAAAAAAAAAAAAAAAKY29tbWl0bWVudAAAAAAADgAAAAAAAAAC",
        "AAAAAQAAAAAAAAAAAAAAD1ZlcmlmaWNhdGlvbktleQAAAAAFAAAAAAAAAAVhbHBoYQAAAAAAA+oAAAAOAAAAAAAAAARiZXRhAAAD6gAAA+oAAAAOAAAAAAAAAAVkZWx0YQAAAAAAA+oAAAPqAAAADgAAAAAAAAAFZ2FtbWEAAAAAAAPqAAAD6gAAAA4AAAAAAAAAAmljAAAAAAPqAAAD6gAAAA4=",
        "AAAAAAAAADRSZXRvcm5hIG8gQWRkcmVzcyBxdWUgdmVyaWZpY291IGEgcHJvdmEgKHNlIGV4aXN0aXIpAAAAEGdldF9jb21taXRfb3duZXIAAAABAAAAAAAAAApjb21taXRtZW50AAAAAAAOAAAAAQAAA+gAAAAT",
        "AAAAAAAAAB9WZXJzw6NvIGVzdHJ1dHVyYWRhIHBhcmEgc2V0IFZLAAAAABFzZXRfdmtfc3RydWN0dXJlZAAAAAAAAAEAAAAAAAAAAnZrAAAAAAfQAAAAD1ZlcmlmaWNhdGlvbktleQAAAAAA",
        "AAAAAAAAACxWZXJpZmljYSBzZSB1bSBjb21taXRtZW50IGrDoSBmb2kgcmVnaXN0cmFkbwAAABJpc19jb21taXRfdmVyaWZpZWQAAAAAAAEAAAAAAAAACmNvbW1pdG1lbnQAAAAAAA4AAAABAAAAAQ==",
        "AAAAAAAAAB5SZXRvcm5hIFZLIGF0dWFsIChmb3JtYXRvIHJhdykAAAAAABRnZXRfdmVyaWZpY2F0aW9uX2tleQAAAAAAAAABAAAD6AAAAA4=",
        "AAAAAAAAADBEZWZpbmUvQXR1YWxpemEgYSBWSyAodmVyaWZpY2F0aW9uIGtleSkgY29tcGxldGEAAAAUc2V0X3ZlcmlmaWNhdGlvbl9rZXkAAAABAAAAAAAAAAJ2awAAAAAADgAAAAA=",
        "AAAAAAAAAXpWYWxpZGEgdW1hIHByb3ZhIEdyb3RoMTYgKHBsYWNlaG9sZGVyIGVzdHJ1dHVyYWwpIGUgYXNzb2NpYSBvIGNvbXByb21pc3NvIMOgIGNhcnRlaXJhIHF1ZSBhc3Npbm91IGEgdHJhbnNhw6fDo28uCk5vdm8gZmx1eG86IGEgY2FydGVpcmEgZG8gdXN1w6FyaW8gZGV2ZSBhc3NpbmFyIGEgdHJhbnNhw6fDo28gcXVlIGludm9jYSBlc3RlIG3DqXRvZG8gKGNhbGxlci5yZXF1aXJlX2F1dGgoKSksCmVsaW1pbmFuZG8gZ2VyYcOnw6NvICJzaW11bGFkYSIgc2VtIHdhbGxldC4gUmV0b3JuYSBvIGNvbW1pdG1lbnQgKGhhc2ggZmluYWwpIHBhcmEgc2VyIHVzYWRvIGNvbW8gcHJvb2ZfaGFzaAplbSBvdXRyb3MgY29udHJhdG9zIChleDogQ3JlZGVudGlhbFJlZ2lzdHJ5KS4AAAAAABV2ZXJpZnlfaWRlbnRpdHlfcHJvb2YAAAAAAAADAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAABXByb29mAAAAAAAADgAAAAAAAAANcHVibGljX2lucHV0cwAAAAAAAA4AAAABAAAD6QAAAA4AAAfQAAAADVZlcmlmaWVyRXJyb3IAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    version: this.txFromJSON<string>,
        get_commit_owner: this.txFromJSON<Option<string>>,
        set_vk_structured: this.txFromJSON<null>,
        is_commit_verified: this.txFromJSON<boolean>,
        get_verification_key: this.txFromJSON<Option<Buffer>>,
        set_verification_key: this.txFromJSON<null>,
        verify_identity_proof: this.txFromJSON<Result<Buffer>>
  }
}