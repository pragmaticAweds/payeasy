import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Keypair } from "stellar-sdk";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum age (in ms) of a challenge timestamp before it is rejected. */
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** JWT expiry duration. */
const JWT_EXPIRY = "24h";

/** Prefix used to build the challenge message. */
const MESSAGE_PREFIX = "PayEasy Login:";

// ---------------------------------------------------------------------------
// Challenge helpers
// ---------------------------------------------------------------------------

export interface Challenge {
    nonce: string;
    timestamp: number;
    message: string;
}

/**
 * Generate a unique login challenge.
 *
 * The returned `message` is what the wallet must sign:
 *   "PayEasy Login: <nonce>.<timestamp>"
 */
export function generateChallenge(): Challenge {
    const nonce = crypto.randomBytes(32).toString("hex");
    const timestamp = Date.now();
    const message = `${MESSAGE_PREFIX} ${nonce}.${timestamp}`;
    return { nonce, timestamp, message };
}

/**
 * Re-build the canonical message from its parts so we can verify against it.
 */
export function buildMessage(nonce: string, timestamp: number): string {
    return `${MESSAGE_PREFIX} ${nonce}.${timestamp}`;
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

/**
 * Verify that `signature` was produced by the owner of `publicKey` over
 * `message`.
 *
 * @returns `true` when the signature is valid, `false` otherwise.
 */
export function verifySignature(
    publicKey: string,
    signature: string,
    message: string
): boolean {
    try {
        const keypair = Keypair.fromPublicKey(publicKey);
        const messageBuffer = Buffer.from(message, "utf-8");
        const signatureBuffer = Buffer.from(signature, "base64");
        return keypair.verify(messageBuffer, signatureBuffer);
    } catch {
        return false;
    }
}

// ---------------------------------------------------------------------------
// Timestamp / replay protection
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the given timestamp is within the allowed window
 * (±CHALLENGE_TTL_MS from *now*).
 */
export function isTimestampValid(timestamp: number): boolean {
    const now = Date.now();
    return Math.abs(now - timestamp) <= CHALLENGE_TTL_MS;
}

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET environment variable is not set");
    }
    return secret;
}

/**
 * Create a signed JWT with the Stellar public key as the subject.
 */
export function signJwt(publicKey: string): string {
    return jwt.sign({ sub: publicKey }, getJwtSecret(), {
        expiresIn: JWT_EXPIRY,
    });
}

/**
 * Verify and decode a JWT. Returns the decoded payload or `null` when the
 * token is invalid / expired.
 */
export function verifyJwt(token: string): jwt.JwtPayload | null {
    try {
        const payload = jwt.verify(token, getJwtSecret());
        if (typeof payload === "string") return null;
        return payload;
    } catch {
        return null;
    }
}
