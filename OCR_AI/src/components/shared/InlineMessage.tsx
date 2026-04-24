import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

export function InlineMessage({
  tone = "info",
  children
}: {
  tone?: "info" | "error" | "success";
  children: ReactNode;
}) {
  return <div className={cn("inline-message", `inline-message--${tone}`)}>{children}</div>;
}
