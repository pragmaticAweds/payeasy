import "../lib/env";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ServiceWorkerProvider } from "@/components/providers/ServiceWorkerProvider";
import NextTopLoader from 'nextjs-toploader';
import WalletProvider from "@/providers/WalletProvider";
import AuthProvider from "@/providers/AuthProvider";
import FavoritesProvider from "@/components/FavoritesProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PayEasy | Shared Rent on Stellar",
  description: "Secure, blockchain-powered rent sharing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-950 text-white`}>
        <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
        <NextTopLoader color="#7D00FF" showSpinner={false} />
        <WalletProvider>
          <AuthProvider>
            <FavoritesProvider>{children}</FavoritesProvider>
          </AuthProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
