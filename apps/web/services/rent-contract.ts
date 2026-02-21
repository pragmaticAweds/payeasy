import {
  buildContractTransaction,
  signContractTransaction,
  submitSignedContractTransaction,
  type SubmittedTransaction,
} from "@/lib/stellar/contract-transactions";
import { ScInt, xdr } from "stellar-sdk";

export const RentContractService = {
  /**
   * Calls the 'deposit' function on the rent contract.
   * @param contractId The Contract ID (C...)
   * @param amount The amount to deposit (in stroops/minimal unit, as i128)
   * @param sourcePublicKey The wallet address of the user
   * @param networkPassphrase The network passphrase (e.g. Testnet)
   * @param rpcUrl The Soroban RPC URL
   */
  async deposit(
    contractId: string,
    amount: bigint,
    sourcePublicKey: string,
    networkPassphrase?: string,
    rpcUrl?: string
  ): Promise<SubmittedTransaction> {
    // Convert amount to i128 ScVal
    const amountScVal = new ScInt(amount).toI128();

    // 1. Build the transaction
    const build = await buildContractTransaction({
      sourcePublicKey,
      contractId,
      method: "deposit",
      args: [amountScVal],
      networkPassphrase,
      rpcUrl,
    });

    // 2. Sign the transaction with Freighter
    // Note: This will trigger the wallet popup
    const signedXdr = await signContractTransaction(
      build.unsignedXdr,
      build.networkPassphrase
    );

    // 3. Submit the signed transaction to the network
    const result = await submitSignedContractTransaction(
      signedXdr,
      build.networkPassphrase,
      build.rpcUrl
    );

    return result;
  },
};
