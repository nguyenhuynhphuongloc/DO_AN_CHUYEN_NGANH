import type { PropsWithChildren, ReactNode } from "react";

export function PageShell({
  title,
  description,
  actions,
  children
}: PropsWithChildren<{ title: string; description: string; actions?: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f8fafc_50%,_#ffffff)] px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
              OCR Expense Flow
            </p>
            <h1 className="text-4xl font-semibold text-slate-900">{title}</h1>
            <p className="max-w-2xl text-sm text-slate-600">{description}</p>
          </div>
          {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
