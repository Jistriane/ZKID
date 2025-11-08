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





export interface Explanation {
  hash: Buffer;
  uri: Option<Buffer>;
}

export const ComplianceError = {
  1: {message:"AdminNotSet"},
  2: {message:"Unauthorized"},
  3: {message:"AdminAlreadySet"}
}

export interface Client {
  /**
   * Construct and simulate a init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Inicializa admin (pode ser chamado uma vez para definir o admin)
   */
  init: ({admin}: {admin: string}, options?: {
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
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Retorna o endereço do admin
   */
  get_admin: (options?: {
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
   * Construct and simulate a get_explanation transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Recupera explicação para um determinado proof_hash
   */
  get_explanation: ({proof_hash}: {proof_hash: Buffer}, options?: {
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
  }) => Promise<AssembledTransaction<Option<Explanation>>>

  /**
   * Construct and simulate a set_explanation transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Define explicação auditável para decisão de compliance (somente admin)
   */
  set_explanation: ({caller, proof_hash, explanation_hash, uri}: {caller: string, proof_hash: Buffer, explanation_hash: Buffer, uri: Option<Buffer>}, options?: {
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
   * Construct and simulate a set_sanction_status transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Atualiza status de sanção (somente admin)
   */
  set_sanction_status: ({caller, proof_hash, is_sanctioned}: {caller: string, proof_hash: Buffer, is_sanctioned: boolean}, options?: {
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
   * Construct and simulate a check_sanctions_list transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Checa lista de sanções baseado no hash da prova/credencial (placeholder)
   */
  check_sanctions_list: ({proof_hash}: {proof_hash: Buffer}, options?: {
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
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAAC0V4cGxhbmF0aW9uAAAAAAIAAAAAAAAABGhhc2gAAAAOAAAAAAAAAAN1cmkAAAAD6AAAAA4=",
        "AAAAAAAAAEBJbmljaWFsaXphIGFkbWluIChwb2RlIHNlciBjaGFtYWRvIHVtYSB2ZXogcGFyYSBkZWZpbmlyIG8gYWRtaW4pAAAABGluaXQAAAABAAAAAAAAAAVhZG1pbgAAAAAAABMAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA9Db21wbGlhbmNlRXJyb3IA",
        "AAAABAAAAAAAAAAAAAAAD0NvbXBsaWFuY2VFcnJvcgAAAAADAAAAAAAAAAtBZG1pbk5vdFNldAAAAAABAAAAAAAAAAxVbmF1dGhvcml6ZWQAAAACAAAAAAAAAA9BZG1pbkFscmVhZHlTZXQAAAAAAw==",
        "AAAAAAAAABNWZXJzw6NvIGRvIGNvbnRyYXRvAAAAAAd2ZXJzaW9uAAAAAAAAAAABAAAAEQ==",
        "AAAAAAAAABxSZXRvcm5hIG8gZW5kZXJlw6dvIGRvIGFkbWluAAAACWdldF9hZG1pbgAAAAAAAAAAAAABAAAD6AAAABM=",
        "AAAAAAAAADRSZWN1cGVyYSBleHBsaWNhw6fDo28gcGFyYSB1bSBkZXRlcm1pbmFkbyBwcm9vZl9oYXNoAAAAD2dldF9leHBsYW5hdGlvbgAAAAABAAAAAAAAAApwcm9vZl9oYXNoAAAAAAAOAAAAAQAAA+gAAAfQAAAAC0V4cGxhbmF0aW9uAA==",
        "AAAAAAAAAEpEZWZpbmUgZXhwbGljYcOnw6NvIGF1ZGl0w6F2ZWwgcGFyYSBkZWNpc8OjbyBkZSBjb21wbGlhbmNlIChzb21lbnRlIGFkbWluKQAAAAAAD3NldF9leHBsYW5hdGlvbgAAAAAEAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACnByb29mX2hhc2gAAAAAAA4AAAAAAAAAEGV4cGxhbmF0aW9uX2hhc2gAAAAOAAAAAAAAAAN1cmkAAAAD6AAAAA4AAAABAAAD6QAAA+0AAAAAAAAH0AAAAA9Db21wbGlhbmNlRXJyb3IA",
        "AAAAAAAAACtBdHVhbGl6YSBzdGF0dXMgZGUgc2Fuw6fDo28gKHNvbWVudGUgYWRtaW4pAAAAABNzZXRfc2FuY3Rpb25fc3RhdHVzAAAAAAMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAKcHJvb2ZfaGFzaAAAAAAADgAAAAAAAAANaXNfc2FuY3Rpb25lZAAAAAAAAAEAAAABAAAD6QAAA+0AAAAAAAAH0AAAAA9Db21wbGlhbmNlRXJyb3IA",
        "AAAAAAAAAEpDaGVjYSBsaXN0YSBkZSBzYW7Dp8O1ZXMgYmFzZWFkbyBubyBoYXNoIGRhIHByb3ZhL2NyZWRlbmNpYWwgKHBsYWNlaG9sZGVyKQAAAAAAFGNoZWNrX3NhbmN0aW9uc19saXN0AAAAAQAAAAAAAAAKcHJvb2ZfaGFzaAAAAAAADgAAAAEAAAAB" ]),
      options
    )
  }
  public readonly fromJSON = {
    init: this.txFromJSON<Result<void>>,
        version: this.txFromJSON<string>,
        get_admin: this.txFromJSON<Option<string>>,
        get_explanation: this.txFromJSON<Option<Explanation>>,
        set_explanation: this.txFromJSON<Result<void>>,
        set_sanction_status: this.txFromJSON<Result<void>>,
        check_sanctions_list: this.txFromJSON<boolean>
  }
}