"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RentContractService } from "@/services/rent-contract";
import { useWallet } from "@/hooks/useWallet";
import { getFreighterPublicKey } from "@/lib/stellar/freighter";
import { getStellarNetworkConfig } from "@/lib/stellar/network";
import { getNetworkTransactionStatus } from "@/lib/stellar/contract-transactions";
import { Loader2, AlertCircle, CheckCircle2, Wallet, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_LISTING = {
  id: "1",
  title: "Luxury Downtown Apartment",
  address: "123 Tech Hub Blvd, San Francisco, CA",
  rentAmount: 3500, // Total rent in XLM
  contractAddress: "CDLZFC3SYJYDZT7KQLSPR4VP68SHJLHPRJ3D547PXVPH3SA2PTUXWW5N",
  shareAmount: 1750, // Tenant's share in XLM
  dueDate: "2023-11-01",
  status: "pending",
  landlord: "GBDWB...",
};

const XLM_TO_USD = 0.12; // Mock conversion rate

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    success: "bg-green-500/10 text-green-500 border-green-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
    idle: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  // @ts-ignore
  const style = styles[status] || styles.idle;

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} capitalize`}>
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  
  // State
  const [listing, setListing] = useState(MOCK_LISTING);
  const [status, setStatus] = useState<"idle" | "connecting" | "signing" | "processing" | "success" | "failed">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentRecordId, setPaymentRecordId] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string>("Testnet");
  const { isConnected, publicKey: walletKey, connect } = useWallet();

  useEffect(() => {
    const config = getStellarNetworkConfig();
    setNetworkName(config.name === "mainnet" ? "Mainnet" : "Testnet");
  }, []);

  // Poll transaction status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (status === "processing" && txHash && paymentRecordId) {
      intervalId = setInterval(async () => {
        try {
          const result = await getNetworkTransactionStatus(txHash);
          
          if (result.status === "success") {
            setStatus("success");
            clearInterval(intervalId);
            // Update payment record
            await updatePaymentRecord(paymentRecordId, "confirmed");
          } else if (result.status === "failed") {
            setStatus("failed");
            setError("Transaction failed on network.");
            clearInterval(intervalId);
            // Update payment record
            await updatePaymentRecord(paymentRecordId, "failed");
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 3000);
    }

    return () => clearInterval(intervalId);
  }, [status, txHash, paymentRecordId]);

  // Actions
  const handleConnectAndPay = async () => {
    try {
      setStatus("connecting");
      setError(null);

      if (!isConnected) {
        await connect();
      }

      // Show confirmation dialog
      setStatus("idle");
      setShowConfirm(true);
    } catch (e: any) {
      setStatus("failed");
      setError(e.message || "Failed to connect wallet.");
    }
  };

  const confirmPayment = async () => {
    setShowConfirm(false);
    setStatus("signing");
    setError(null);

    try {
      const publicKey = walletKey || await getFreighterPublicKey();
      const networkConfig = getStellarNetworkConfig();

      // 1. Call Smart Contract
      const result = await RentContractService.deposit(
        listing.contractAddress,
        BigInt(listing.shareAmount * 10_000_000), // Convert to stroops (assuming 7 decimals)
        publicKey,
        networkConfig.networkPassphrase,
        networkConfig.sorobanRpcUrl
      );

      if (result.status === "FAILED" || result.status === "failed") {
         throw new Error("Transaction submission failed: " + (result.errorResultXdr || "Unknown error"));
      }
      
      const hash = result.txHash;
      setTxHash(hash);
      setStatus("processing");

      // 2. Create Payment Record
      const record = await createPaymentRecord(listing.id, listing.shareAmount, hash);
      setPaymentRecordId(record.id);

    } catch (e: any) {
      console.error(e);
      setStatus("failed");
      setError(e.message || "Payment failed. Please try again.");
    }
  };

  const createPaymentRecord = async (listingId: string, amount: number, hash: string) => {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, amount, txHash: hash }),
    });
    
    if (!res.ok) {
        const err = await res.json();
        // Don't throw here, just log, because transaction is already submitted
        console.error("Failed to save payment record:", err);
        return { id: null };
    }
    return res.json();
  };

  const updatePaymentRecord = async (id: string, status: string) => {
    if (!id) return;
    await fetch("/api/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  };

  // Render Helpers
  const renderConfirmationModal = () => {
    if (!showConfirm) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-[#1E1E2E] border border-white/10 rounded-2xl p-6 shadow-2xl scale-100">
          <h3 className="text-xl font-semibold text-white mb-4">Confirm Payment</h3>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Amount</span>
              <span className="text-white font-medium">{listing.shareAmount} XLM</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Network Fee</span>
              <span className="text-white font-medium">~0.0001 XLM</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/10 pt-4">
              <span className="text-gray-400">Total</span>
              <span className="text-xl font-bold text-indigo-400">{listing.shareAmount} XLM</span>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6">
             <p className="text-xs text-yellow-200 flex items-start gap-2">
               <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
               <span>You will be asked to sign a transaction with your <strong>Freighter wallet</strong>. Please verify the amount and destination.</span>
             </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmPayment}
              className="flex-1 px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors font-medium"
            >
              Confirm & Pay
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0F0F13] text-white p-4 md:p-8 font-sans">
      {renderConfirmationModal()}
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <Link href={`/listings/${id}`} className="text-sm text-gray-400 hover:text-white mb-4 inline-flex items-center gap-1 transition-colors">
               <ArrowRight className="w-4 h-4 rotate-180" /> Back to Listing
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Pay Rent</h1>
            <p className="text-gray-400 mt-2">Securely pay your rent using Stellar smart contracts.</p>
          </div>
          <div className="hidden md:block">
             <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-400">
               Network: <span className={networkName === "Mainnet" ? "text-green-400" : "text-yellow-400"}>{networkName}</span>
             </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Payment Card */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-[#181820] border border-white/5 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-400" />
                Payment Details
              </h2>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center py-4 border-b border-white/5">
                  <span className="text-gray-400">Listing</span>
                  <span className="font-medium text-right text-gray-200">{listing.title}</span>
                </div>
                
                <div className="flex justify-between items-center py-4 border-b border-white/5">
                  <span className="text-gray-400">Contract Address</span>
                  <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded text-gray-400 truncate max-w-[180px] md:max-w-[300px]" title={listing.contractAddress}>
                    {listing.contractAddress}
                  </span>
                </div>

                <div className="flex justify-between items-center py-4 border-b border-white/5">
                  <span className="text-gray-400">Total Rent</span>
                  <span className="font-medium text-gray-200">{listing.rentAmount} XLM</span>
                </div>

                <div className="flex justify-between items-center py-4 border-b border-white/5">
                  <span className="text-gray-400">Due Date</span>
                  <span className="font-medium text-gray-200">{new Date(listing.dueDate).toLocaleDateString()}</span>
                </div>

                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Wallet className="w-24 h-24" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-indigo-200 font-medium">Your Share</span>
                      <span className="text-3xl font-bold text-indigo-400">{listing.shareAmount} <span className="text-lg">XLM</span></span>
                    </div>
                    <div className="text-right text-sm text-indigo-300/60">
                      ≈ ${(listing.shareAmount * XLM_TO_USD).toFixed(2)} USD
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8">
                {status === "success" ? (
                   <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center animate-in zoom-in duration-300">
                     <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                     </div>
                     <h3 className="text-xl text-green-400 font-semibold mb-2">Payment Successful!</h3>
                     <p className="text-sm text-green-400/60 mb-6">Your rent has been paid successfully and recorded on the blockchain.</p>
                     
                     <div className="flex justify-center gap-4">
                       <a 
                         href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium flex items-center gap-2"
                       >
                         View on Explorer <ExternalLink className="w-3 h-3" />
                       </a>
                       <Link
                         href={`/listings/${id}`}
                         className="px-4 py-2 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors text-sm font-medium"
                       >
                         Return to Listing
                       </Link>
                     </div>
                   </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={handleConnectAndPay}
                      disabled={status !== "idle" && status !== "failed"}
                      className={`
                        w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                        ${status === "idle" || status === "failed"
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5" 
                          : "bg-gray-800 text-gray-500 cursor-not-allowed"}
                      `}
                    >
                      {status === "idle" && (
                        <>
                          Pay {listing.shareAmount} XLM
                        </>
                      )}
                      {status === "connecting" && (
                         <>
                           <Loader2 className="w-5 h-5 animate-spin" />
                           Connecting Wallet...
                         </>
                      )}
                      {status === "signing" && (
                         <>
                           <Loader2 className="w-5 h-5 animate-spin" />
                           Check Wallet to Sign...
                         </>
                      )}
                      {status === "processing" && (
                         <>
                           <Loader2 className="w-5 h-5 animate-spin" />
                           Processing Transaction...
                         </>
                      )}
                      {status === "failed" && "Retry Payment"}
                    </button>
                    
                    {status === "failed" && error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 text-center animate-in fade-in slide-in-from-top-2">
                        <p className="font-semibold mb-1">Payment Failed</p>
                        <p className="opacity-80">{error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Info */}
          <div className="space-y-6">
            <div className="bg-[#181820] border border-white/5 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Payment Status</h3>
              <div className="flex items-center justify-between mb-4 bg-white/5 p-3 rounded-xl">
                <span className="text-gray-400 text-sm">Status</span>
                <StatusBadge status={status === "idle" ? "Pending" : status} />
              </div>
              
              {txHash && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Transaction Hash</p>
                  <a 
                    href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="text-xs text-indigo-400 hover:text-indigo-300 break-all flex items-start gap-1 p-2 bg-indigo-500/5 rounded border border-indigo-500/10 transition-colors hover:bg-indigo-500/10"
                  >
                    <span className="font-mono">{txHash}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 mt-0.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6">
              <h3 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                How it works
              </h3>
              <ul className="text-sm text-blue-200/60 space-y-3 pl-2">
                <li className="flex gap-2">
                  <span className="bg-blue-500/20 text-blue-400 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">1</span>
                  Connect your Freighter wallet
                </li>
                <li className="flex gap-2">
                  <span className="bg-blue-500/20 text-blue-400 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">2</span>
                  Sign the transaction securely
                </li>
                <li className="flex gap-2">
                  <span className="bg-blue-500/20 text-blue-400 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">3</span>
                  Funds are deposited to the smart contract
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
