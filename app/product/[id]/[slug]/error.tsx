"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[product-page] error", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="rounded-full bg-secondary p-6 text-muted-foreground">
        <AlertTriangle className="h-10 w-10" aria-hidden="true" />
      </div>
      <h1 className="mt-8 text-2xl font-semibold tracking-tight md:text-3xl">
        Something went wrong on our end.
      </h1>
      <p className="mt-2 text-muted-foreground">
        Try refreshing in a moment.
      </p>
      <div className="mt-6">
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </main>
  );
}
