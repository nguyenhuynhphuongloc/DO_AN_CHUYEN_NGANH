import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Bot,
  ChartColumnBig,
  FolderKanban,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Settings,
  Tags,
  WalletCards
} from "lucide-react";

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const primaryNavigation: NavigationItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", path: "/transactions", icon: WalletCards },
  { label: "Budgets", path: "/budgets", icon: FolderKanban },
  { label: "Categories", path: "/categories", icon: Tags },
  { label: "Savings Goals", path: "/savings-goals", icon: PiggyBank },
  { label: "Reports / Analytics", path: "/reports", icon: ChartColumnBig },
  { label: "OCR Receipts", path: "/ocr", icon: Receipt },
  { label: "AI Vanilla", path: "/ai-vanilla", icon: Bot },
  { label: "Notifications", path: "/notifications", icon: Bell },
  { label: "Settings", path: "/settings", icon: Settings }
];
