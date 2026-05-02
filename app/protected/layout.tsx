import Link from "next/link";
import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            <span>Super TV </span>
            <span className="text-accent">Store</span>
          </Link>
          <Suspense>
            <AuthButton />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-5">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <ThemeSwitcher />
        </div>
      </footer>
    </div>
  );
}
