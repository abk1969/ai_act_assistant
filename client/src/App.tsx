import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Assessment from "@/pages/assessment";
import Maturity from "@/pages/maturity";
import FrameworkAssessment from "@/pages/framework";
import Database from "@/pages/database";
import Compliance from "@/pages/compliance";
import Documents from "@/pages/documents";
import Certificates from "@/pages/certificates";
import Monitoring from "@/pages/monitoring";
import Settings from "@/pages/settings";
import MFASetup from "@/pages/mfa-setup";
import Sessions from "@/pages/sessions";
import SecurityAdmin from "@/pages/security-admin";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/main-layout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading ? (
        // Show loading state while checking authentication
        <Route path="*" component={() => <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-lg">Chargement...</div></div>} />
      ) : !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="*" component={Landing} />
        </>
      ) : (
        <MainLayout>
          <Route path="/" component={Home} />
          <Route path="/assessment" component={Assessment} />
          <Route path="/maturity" component={Maturity} />
          <Route path="/framework" component={FrameworkAssessment} />
          <Route path="/database" component={Database} />
          <Route path="/compliance" component={Compliance} />
          <Route path="/documents" component={Documents} />
          <Route path="/certificates" component={Certificates} />
          <Route path="/monitoring" component={Monitoring} />
          <Route path="/settings" component={Settings} />
          <Route path="/security/mfa" component={MFASetup} />
          <Route path="/security/sessions" component={Sessions} />
          <Route path="/security/admin" component={SecurityAdmin} />
        </MainLayout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
