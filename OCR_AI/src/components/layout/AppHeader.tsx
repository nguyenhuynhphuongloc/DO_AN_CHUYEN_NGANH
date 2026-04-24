import { AI_ASSISTANT_NAME, APP_TAGLINE } from "../../lib/constants";

export function AppHeader() {
  return (
    <header className="app-header">
      <div>
        <div className="app-header__eyebrow">Personal finance management system</div>
        <h1>{AI_ASSISTANT_NAME} + OCR-guided money operations</h1>
        <p>{APP_TAGLINE}</p>
      </div>
      <div className="app-header__actions">
        <div className="app-header__badge">Workspace overview</div>
      </div>
    </header>
  );
}
