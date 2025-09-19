import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Newspaper, 
  AlertTriangle, 
  RefreshCw, 
  Bookmark, 
  ExternalLink,
  Clock,
  CheckCircle
} from "lucide-react";

export default function Monitoring() {
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: updates, isLoading } = useQuery({
    queryKey: ['/api/regulatory/updates', { source: selectedSource, severity: selectedSeverity }],
  });

  const { data: status } = useQuery({
    queryKey: ['/api/regulatory/status'],
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/regulatory/sync');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/regulatory/updates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/regulatory/status'] });
      toast({
        title: "Synchronisation terminée",
        description: `${data.newUpdates} nouvelles mises à jour trouvées`,
      });
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser les mises à jour",
        variant: "destructive",
      });
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critique':
        return 'bg-red-100 text-red-800';
      case 'important':
        return 'bg-orange-100 text-orange-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityDotColor = (severity: string) => {
    switch (severity) {
      case 'critique':
        return 'bg-red-500';
      case 'important':
        return 'bg-orange-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-8" data-testid="page-monitoring">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Veille réglementaire
        </h2>
        <p className="text-muted-foreground">
          Mises à jour officielles et alertes automatisées
        </p>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card data-testid="metric-new-updates">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nouvelles publications</p>
                <p className="text-2xl font-bold text-foreground">
                  {status?.totalUpdates || 0}
                </p>
                <p className="text-xs text-muted-foreground">Cette semaine</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Newspaper className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="metric-critical-alerts">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertes critiques</p>
                <p className="text-2xl font-bold text-red-600">
                  {status?.criticalAlerts || 0}
                </p>
                <p className="text-xs text-muted-foreground">Action requise</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="metric-last-sync">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dernière sync</p>
                <p className="text-lg font-bold text-foreground">
                  {status?.lastSync ? new Date(status.lastSync).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : 'Jamais'}
                </p>
                <p className="text-xs text-green-600">Système à jour</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* News Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Actualités réglementaires</CardTitle>
            <div className="flex gap-2">
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="w-48" data-testid="select-source">
                  <SelectValue placeholder="Toutes sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes sources</SelectItem>
                  <SelectItem value="Commission Européenne">Commission Européenne</SelectItem>
                  <SelectItem value="DGCCRF">DGCCRF</SelectItem>
                  <SelectItem value="CNIL">CNIL</SelectItem>
                  <SelectItem value="AI Office">AI Office</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="w-32" data-testid="select-severity">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="critique">Critique</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                data-testid="button-sync"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse p-6 border rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 bg-muted rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-3"></div>
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : updates && updates.length > 0 ? (
            <div className="divide-y divide-border">
              {updates.map((update: any, index: number) => (
                <div 
                  key={update.id} 
                  className="p-6"
                  data-testid={`update-${index}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 ${getSeverityDotColor(update.severity)} rounded-full mt-2`}></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">{update.title}</h4>
                          <p className="text-sm text-blue-600">{update.source}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {new Date(update.publishedAt).toLocaleDateString('fr-FR')}
                          </p>
                          <Badge className={getSeverityColor(update.severity)}>
                            {update.severity}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {update.content}
                      </p>
                      
                      <div className="flex items-center gap-4">
                        {update.url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={update.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Lire l'article complet
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Bookmark className="h-3 w-3 mr-1" />
                          Sauvegarder
                        </Button>
                        {update.category && (
                          <span className="text-xs text-muted-foreground">
                            Impact: {update.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {selectedSource || selectedSeverity 
                  ? "Aucune mise à jour trouvée pour les filtres sélectionnés"
                  : "Aucune mise à jour réglementaire disponible"
                }
              </p>
            </div>
          )}

          {updates && updates.length > 0 && (
            <div className="p-4 border-t border-border text-center">
              <Button variant="ghost" className="text-primary hover:text-primary/80">
                Charger plus d'actualités <span className="ml-1">↓</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
