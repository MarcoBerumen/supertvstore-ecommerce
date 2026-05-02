import type { ReactNode } from "react";

export function FooterColumn({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {heading}
      </h3>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}
