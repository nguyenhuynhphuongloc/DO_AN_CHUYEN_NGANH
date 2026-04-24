export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="loading-state">
      <div className="loading-state__pulse" />
      <span>{label}</span>
    </div>
  );
}
