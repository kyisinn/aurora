import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aurora",
  description: "AI scheduling for students",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#0b0b12] text-white`}>
          {/* Navbar */}
          <header className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600 font-bold">
                  A
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">Aurora</div>
                  <div className="text-xs text-white/50">AI Scheduling</div>
                </div>
              </Link>

              <nav className="hidden items-center gap-6 md:flex text-sm text-white/70">
                <a href="#how" className="hover:text-white">How it works</a>
                <a href="#features" className="hover:text-white">Features</a>
                <a href="#pricing" className="hover:text-white">Pricing</a>
                <a href="#faq" className="hover:text-white">FAQ</a>
              </nav>

              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10"
                >
                  Sign in
                </Link>
                <Link
                  href="/onboarding/connect-tools"
                  className="rounded-2xl bg-violet-600 px-4 py-2 text-xs font-semibold hover:bg-violet-500"
                >
                  Get started
                </Link>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="mx-auto max-w-7xl px-4 py-10">{children}</main>

          {/* Footer */}
          <footer className="border-t border-white/10">
            <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-white/50">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>© {new Date().getFullYear()} Aurora</div>
                <div className="flex gap-4">
                  <a className="hover:text-white" href="#features">Features</a>
                  <a className="hover:text-white" href="#pricing">Pricing</a>
                  <a className="hover:text-white" href="#faq">FAQ</a>
                </div>
              </div>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}