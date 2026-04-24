import { PageShell } from "../../components/layout/PageShell";
import { notifications } from "../../mocks/finance";

export function NotificationsPage() {
  return (
    <PageShell
      eyebrow="Notifications"
      title="Alerts and updates"
      description="A compact feed of budget alerts, OCR confirmations, and savings notices."
    >
      <div className="list-card">
        {notifications.map((notification) => (
          <article key={notification.id} className={`notification-card notification-card--${notification.tone}`}>
            <strong>{notification.title}</strong>
            <p>{notification.description}</p>
            <span>{notification.time}</span>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
