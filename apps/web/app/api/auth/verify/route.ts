import { NextResponse } from "next/server";
import {
    buildMessage,
    isTimestampValid,
    signJwt,
    verifySignature,
} from "@/lib/auth/stellar-auth";

/** Cookie max-age in seconds (24 hours). */
const COOKIE_MAX_AGE = 86_400;

/**
 * POST /api/auth/verify
 *
 * Accepts `{ publicKey, signature, nonce, timestamp }`, verifies the Stellar
 * signature, and returns a JWT token stored in a secure HTTP-only cookie.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { publicKey, signature, nonce, timestamp } = body;

        // --- Input validation ------------------------------------------------

        if (!publicKey || !signature || !nonce || timestamp == null) {
            return NextResponse.json(
                {
                    success: false,
                    error: { message: "publicKey, signature, nonce, and timestamp are required" },
                },
                { status: 400 }
            );
        }

        // --- Replay protection -----------------------------------------------

        if (!isTimestampValid(timestamp)) {
            return NextResponse.json(
                {
                    success: false,
                    error: { message: "Challenge expired. Please request a new login challenge." },
                },
                { status: 401 }
            );
        }

        // --- Signature verification ------------------------------------------

        const message = buildMessage(nonce, timestamp);
        const isValid = verifySignature(publicKey, signature, message);

        if (!isValid) {
            return NextResponse.json(
                {
                    success: false,
                    error: { message: "Invalid signature" },
                },
                { status: 401 }
            );
        }

        // --- Issue JWT -------------------------------------------------------

        const token = signJwt(publicKey);

        const response = NextResponse.json({
            success: true,
            data: { publicKey },
        });

        // Set the JWT in a secure HTTP-only cookie
        response.cookies.set("auth-token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: COOKIE_MAX_AGE,
        });

        return response;
    } catch {
        return NextResponse.json(
            { success: false, error: { message: "Internal server error" } },
            { status: 500 }
        );
    }
}
