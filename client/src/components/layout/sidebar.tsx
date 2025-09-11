import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ClipboardCheck,
  Database,
  Shield,
  FileText,
  Rss,
  Settings,
  LogOut
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
}

const navigationItems = [
  {
    name: "Tableau de bord",
    href: "/",
    icon: BarChart3,
  },
  {
    name: "Évaluation des risques",
    href: "/assessment",
    icon: ClipboardCheck,
  },
  {
    name: "Base réglementaire",
    href: "/database",
    icon: Database,
  },
  {
    name: "Conformité",
    href: "/compliance",
    icon: Shield,
  },
  {
    name: "Documentation",
    href: "/documents",
    icon: FileText,
  },
  {
    name: "Veille réglementaire",
    href: "/monitoring",
    icon: Rss,
  },
];

const authorities = [
  { name: "DGCCRF", status: "online" },
  { name: "CNIL", status: "online" },
  { name: "Commission Européenne", status: "warning" },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border z-30 transform transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      data-testid="sidebar"
    >
      <div className="p-4">
        <div className="space-y-6">
          {/* Navigation Menu */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3",
                      isActive && "bg-primary/10 text-primary"
                    )}
                    data-testid={`nav-${item.href.slice(1) || 'home'}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Authorities Status */}
          <div className="border-t border-border pt-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Autorités
            </h3>
            <div className="space-y-2">
              {authorities.map((authority) => (
                <div
                  key={authority.name}
                  className="flex items-center gap-2 px-3 py-2 text-sm"
                  data-testid={`authority-${authority.name.toLowerCase()}`}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      authority.status === "online" && "bg-green-500",
                      authority.status === "warning" && "bg-yellow-500",
                      authority.status === "offline" && "bg-red-500"
                    )}
                  />
                  <span className="text-muted-foreground">{authority.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Settings and Logout */}
          <div className="border-t border-border pt-4">
            <Link href="/settings">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 mb-2",
                  location === "/settings" && "bg-primary/10 text-primary"
                )}
                data-testid="nav-settings"
              >
                <Settings className="h-4 w-4" />
                <span>Paramètres</span>
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
