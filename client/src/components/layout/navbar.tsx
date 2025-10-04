import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Menu, Search, Bell, ChevronDown, Bot, User, LogOut } from "lucide-react";

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-card border-b border-border z-40">
      <div className="px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            data-testid="button-sidebar-toggle"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">IA-ACT-NAVIGATOR</h1>
            <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">
              v2.0.0
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Rechercher dans la réglementation..."
              className="w-80 pl-10"
              data-testid="input-search"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" data-testid="button-notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs"></span>
          </Button>
          
          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer" data-testid="button-user-menu">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-accent-foreground text-sm font-medium">
                      {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground" data-testid="text-username">
                  {user?.firstName || user?.email || 'Utilisateur'}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem data-testid="menu-profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  logout.mutate();
                }}
                disabled={logout.isPending}
                data-testid="menu-logout"
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{logout.isPending ? 'Déconnexion...' : 'Se déconnecter'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
