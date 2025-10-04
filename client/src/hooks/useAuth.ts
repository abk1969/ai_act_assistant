import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SafeUser } from "@shared/schema";

// Custom query function that silently handles 401 responses
async function fetchCurrentUser(): Promise<SafeUser | null> {
  try {
    const res = await fetch("/api/auth/user", {
      credentials: "include",
    });

    // Return null if not authenticated (instead of throwing)
    if (res.status === 401) {
      return null;
    }

    // Throw for other errors
    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }

    return await res.json();
  } catch (error) {
    // Return null for network errors or other issues
    return null;
  }
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<SafeUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchCurrentUser,
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
      // Set user data to null and cancel any ongoing queries
      queryClient.cancelQueries({ queryKey: ["/api/auth/user"] });
      queryClient.setQueryData(["/api/auth/user"], null);

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
