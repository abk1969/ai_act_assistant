import { useState } from "react";
import { useLocation } from "wouter";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type AuthMode = "login" | "register";

interface AuthModalProps {
  defaultMode?: AuthMode;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function AuthModal({ defaultMode = "login", onSuccess, children }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  const handleSwitchMode = () => {
    setMode(mode === "login" ? "register" : "login");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button data-testid="button-open-auth">
            Se connecter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-fit">
        {mode === "login" ? (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={handleSwitchMode}
          />
        ) : (
          <RegisterForm
            onSuccess={handleSwitchMode} // After registration, switch to login
            onSwitchToLogin={handleSwitchMode}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Standalone components for pages
export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    // Navigate to home page after successful auth
    setLocation("/");
  };

  const handleSwitchMode = () => {
    setMode(mode === "login" ? "register" : "login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {mode === "login" ? (
        <LoginForm
          onSuccess={handleSuccess}
          onSwitchToRegister={handleSwitchMode}
        />
      ) : (
        <RegisterForm
          onSuccess={handleSwitchMode} // After registration, switch to login
          onSwitchToLogin={handleSwitchMode}
        />
      )}
    </div>
  );
}