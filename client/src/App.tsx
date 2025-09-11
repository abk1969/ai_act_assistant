import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Assessment from "@/pages/assessment";
import Database from "@/pages/database";
import Compliance from "@/pages/compliance";
import Documents from "@/pages/documents";
import Monitoring from "@/pages/monitoring";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/main-layout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <MainLayout>
          <Route path="/" component={Home} />
          <Route path="/assessment" component={Assessment} />
          <Route path="/database" component={Database} />
          <Route path="/compliance" component={Compliance} />
          <Route path="/documents" component={Documents} />
          <Route path="/monitoring" component={Monitoring} />
          <Route path="/settings" component={Settings} />
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
