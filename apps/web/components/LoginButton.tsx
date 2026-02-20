"use client";

import { useState, useCallback } from "react";
import freighterApi from "@stellar/freighter-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LoginState =
    | "idle"
    | "connecting"
    | "requesting-challenge"
    | "signing"
    | "verifying"
    | "success"
    | "error";

const STATUS_LABELS: Record<LoginState, string> = {
    idle: "Sign in with Stellar",
    connecting: "Connecting wallet…",
    "requesting-challenge": "Requesting challenge…",
    signing: "Waiting for signature…",
    verifying: "Verifying…",
    success: "Signed in ✓",
    error: "Try again",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LoginButton() {
    const [state, setState] = useState<LoginState>("idle");
    const [error, setError] = useState<string | null>(null);
    const [publicKey, setPublicKey] = useState<string | null>(null);

    const handleLogin = useCallback(async () => {
        try {
            setError(null);

            // 1 — Connect wallet -----------------------------------------------
            setState("connecting");

            const connected = await freighterApi.isConnected();
            if (!connected) {
                throw new Error(
                    "Freighter wallet not found. Please install the Freighter browser extension."
                );
            }

            const userPublicKey = await freighterApi.getPublicKey();
            if (!userPublicKey) {
                throw new Error("Could not retrieve public key from Freighter.");
            }

            // 2 — Request challenge --------------------------------------------
            setState("requesting-challenge");

            const challengeRes = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ publicKey: userPublicKey }),
            });

            if (!challengeRes.ok) {
                const err = await challengeRes.json();
                throw new Error(err?.error?.message ?? "Failed to get login challenge.");
            }

            const { data: challenge } = await challengeRes.json();

            // 3 — Sign the challenge message -----------------------------------
            setState("signing");

            // Encode the challenge message as base64 for signBlob
            const messageBase64 = btoa(challenge.message);
            const signedBase64 = await freighterApi.signBlob(messageBase64);

            if (!signedBase64) {
                throw new Error("Signing was cancelled or returned empty.");
            }

            // 4 — Send signature for verification ------------------------------
            setState("verifying");

            const verifyRes = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    publicKey: userPublicKey,
                    signature: signedBase64,
                    nonce: challenge.nonce,
                    timestamp: challenge.timestamp,
                }),
            });

            if (!verifyRes.ok) {
                const err = await verifyRes.json();
                throw new Error(err?.error?.message ?? "Signature verification failed.");
            }

            // 5 — Success! Cookie is set automatically by the response ----------
            setPublicKey(userPublicKey);
            setState("success");

            // Optionally reload the page so protected routes become accessible
            setTimeout(() => window.location.reload(), 1000);
        } catch (err: unknown) {
            setState("error");
            setError(
                err instanceof Error ? err.message : "An unexpected error occurred."
            );
        }
    }, []);

    const isLoading = !["idle", "success", "error"].includes(state);

    return (
        <div className="flex flex-col items-center gap-3">
            <button
                onClick={handleLogin}
                disabled={isLoading || state === "success"}
                className={`
          group relative inline-flex items-center justify-center gap-2
          rounded-xl px-6 py-3 text-sm font-semibold
          transition-all duration-300 ease-out
          ${state === "success"
                        ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : state === "error"
                            ? "border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            : "border border-white/10 bg-white/5 text-white backdrop-blur-sm hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/10"
                    }
          disabled:cursor-not-allowed disabled:opacity-60
        `}
            >
                {/* Glow effect */}
                {!isLoading && state !== "success" && (
                    <span className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                )}

                {/* Wallet icon */}
                <svg
                    className={`h-4 w-4 ${isLoading ? "animate-pulse" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h3.75A2.25 2.25 0 0021 6V4.5A2.25 2.25 0 0018.75 2.25H5.25A2.25 2.25 0 003 4.5v15A2.25 2.25 0 005.25 21.75h13.5A2.25 2.25 0 0021 19.5V12z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 9.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                    />
                </svg>

                {STATUS_LABELS[state]}

                {/* Spinner overlay */}
                {isLoading && (
                    <svg
                        className="h-4 w-4 animate-spin text-indigo-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                )}
            </button>

            {/* Public key badge */}
            {publicKey && state === "success" && (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-400">
                    {publicKey.slice(0, 6)}…{publicKey.slice(-4)}
                </span>
            )}

            {/* Error message */}
            {error && (
                <p className="max-w-xs text-center text-xs text-red-400/80">{error}</p>
            )}
        </div>
    );
}
