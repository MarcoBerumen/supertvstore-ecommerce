import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/components/cart-context";
import { getCartItemCount } from "@/lib/supabase/cart";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Super TV Store — Houston's TV store, now shipping screens",
  description:
    "TVs, soundbars, speakers, and home electronics from Houston's own Super TV Store. In-store pickup or delivered.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  display: "swap",
  subsets: ["latin"],
});

async function CartShell({ children }: { children: React.ReactNode }) {
  let initialCount = 0;
  try {
    initialCount = await getCartItemCount();
  } catch {
    // If the cart store is unreachable on initial render, render with 0 — the
    // badge will catch up as soon as the user takes any cart action.
    initialCount = 0;
  }
  return <CartProvider initialCount={initialCount}>{children}</CartProvider>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={300}>
            <Suspense fallback={<CartProvider initialCount={0}>{children}</CartProvider>}>
              <CartShell>{children}</CartShell>
            </Suspense>
            <Toaster
              position="top-right"
              richColors
              closeButton
              mobileOffset={{ bottom: "var(--toast-margin-bottom)" }}
            />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
