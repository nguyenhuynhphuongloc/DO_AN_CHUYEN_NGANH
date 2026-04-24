import { Bot, CreditCard, FolderPlus, Upload } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  { label: "Add Transaction", path: "/transactions", icon: CreditCard },
  { label: "Upload Receipt", path: "/ocr", icon: Upload },
  { label: "Open AI Vanilla", path: "/ai-vanilla", icon: Bot },
  { label: "Create Budget", path: "/budgets", icon: FolderPlus }
];

export function QuickActions() {
  return (
    <div className="quick-actions">
      {actions.map((action) => (
        <Link key={action.label} to={action.path} className="quick-action">
          <action.icon size={18} />
          <span>{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
