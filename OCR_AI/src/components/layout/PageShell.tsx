import type { ReactNode } from "react";

import { SectionHeader } from "../shared/SectionHeader";

export function PageShell({
  eyebrow,
  title,
  description,
  action,
  children
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="page-panel">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} action={action} />
      {children}
    </section>
  );
}
