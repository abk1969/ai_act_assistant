import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SafeUser } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<SafeUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn<SafeUser>({ on401: "returnNull" }),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: user || undefined,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and remove user query to trigger re-fetch which will return null
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      // Clear all other query cache to reset app state
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== "/api/auth/user"
      });

      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès.",
      });
      // Navigate to landing page
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de déconnexion",
        description: error.message || "Une erreur s'est produite lors de la déconnexion.",
        variant: "destructive",
      });
    },
  });
}
