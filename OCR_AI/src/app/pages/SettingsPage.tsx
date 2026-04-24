import { PageShell } from "../../components/layout/PageShell";

export function SettingsPage() {
  return (
    <PageShell
      eyebrow="Settings"
      title="Workspace preferences"
      description="Future integration points for profile, security, theme defaults, connected services, and finance preferences."
    >
      <div className="settings-grid">
        <article className="panel-card">
          <h3>Profile</h3>
          <p>Manage name, email, and avatar mappings from auth-service.</p>
        </article>
        <article className="panel-card">
          <h3>Security</h3>
          <p>Expose MFA, session review, and password management when auth-service expands.</p>
        </article>
        <article className="panel-card">
          <h3>Integrations</h3>
          <p>Reserve connection settings for finance-service, OCR transport, and AI assistant backends.</p>
        </article>
      </div>
    </PageShell>
  );
}
