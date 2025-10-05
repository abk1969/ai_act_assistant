import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { ImpactDashboard } from "@/components/monitoring/ImpactDashboard";
import { CardDetailModal } from "@/components/monitoring/CardDetailModal";
import {
  Target,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  FileText,
  Zap,
  Calendar,
  BarChart3,
  Settings,
  ArrowRight,
  ExternalLink
} from "lucide-react";

// Types pour la veille proactive
interface PersonalizedRegulatoryUpdate {
  id: string;
  title: string;
  content: string;
  source: string;
  severity: string;
  publishedAt: string;
  url: string;
  userContext: {
    relevanceScore: number;
    urgencyLevel: 'immediate' | 'high' | 'medium' | 'low';
    estimatedImpact: number;
    impactedSystemsCount: number;
  };
  actionPlan: {
    priorityActionsCount: number;
    estimatedEffort: string;
    budgetImpact: string;
  };
}

interface ImpactDashboard {
  userId: string;
  summary: {
    totalInsights: number;
    highPriorityActions: number;
    impactedSystems: number;
    urgentDeadlines: number;
    complianceGaps: number;
    estimatedEffort: string;
  };
  riskAnalysis: {
    riskAmplificationFactor: number;
    criticalSystems: any[];
    riskTrends: {
      increasing: number;
      stable: number;
      decreasing: number;
    };
  };
  actionBreakdown: {
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    byTimeline: Record<string, number>;
  };
  complianceStatus: {
    overallScore: number;
    gapsBySystem: Record<string, string[]>;
    upcomingDeadlines: Array<{
      action: any;
      daysRemaining: number;
    }>;
  };
}

interface ActionPlan {
  insightId: string;
  priorityActions: Array<{
    id: string;
    description: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    deadline: string;
    estimatedHours: number;
    category: string;
    impactLevel: string;
  }>;
  timeline: {
    immediate: number;
    short_term: number;
    medium_term: number;
    long_term: number;
  };
  estimatedEffort: string;
  budgetImpact: string;
}

export default function ProactiveMonitoring() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedUrgency, setSelectedUrgency] = useState("all");
  const [selectedCardType, setSelectedCardType] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  // Récupérer l'ID utilisateur depuis l'authentification
  const userId = user?.id;

  // Données simulées pour démonstration immédiate
  const personalizedUpdates: PersonalizedRegulatoryUpdate[] = [
    {
      id: '1',
      title: 'Nouvelles exigences de transparence pour les systèmes IA à haut risque',
      description: 'La Commission européenne a publié des lignes directrices détaillées sur les obligations de transparence pour les systèmes IA classés à haut risque selon l\'Acte sur l\'IA.',
      source: 'Commission Européenne',
      severity: 'high',
      category: 'transparency',
      publishedAt: new Date('2025-10-01'),
      url: 'https://ec.europa.eu/ai-transparency-guidelines',
      userContext: {
        relevanceScore: 92,
        urgencyLevel: 'immediate' as any,
        estimatedImpact: 85,
        impactedSystemsCount: 2,
      },
      actionPlan: {
        priorityActionsCount: 4,
        estimatedEffort: '2 semaines',
        budgetImpact: 'Modéré',
      },
    },
    {
      id: '2',
      title: 'Mise à jour des standards de documentation technique',
      description: 'Nouvelles exigences pour la documentation technique des systèmes IA, incluant les processus de validation et les métriques de performance.',
      source: 'CNIL',
      severity: 'medium',
      category: 'documentation',
      publishedAt: new Date('2025-09-28'),
      url: 'https://cnil.fr/ai-documentation-standards',
      userContext: {
        relevanceScore: 78,
        urgencyLevel: 'high' as any,
        estimatedImpact: 65,
        impactedSystemsCount: 3,
      },
      actionPlan: {
        priorityActionsCount: 3,
        estimatedEffort: '1 semaine',
        budgetImpact: 'Faible',
      },
    },
    {
      id: '3',
      title: 'Obligations de surveillance post-déploiement renforcées',
      description: 'Nouvelles directives sur la surveillance continue des systèmes IA en production, incluant la détection de dérives et les mesures correctives.',
      source: 'EUR-Lex',
      severity: 'high',
      category: 'monitoring',
      publishedAt: new Date('2025-09-25'),
      url: 'https://eur-lex.europa.eu/ai-monitoring-obligations',
      userContext: {
        relevanceScore: 88,
        urgencyLevel: 'high' as any,
        estimatedImpact: 75,
        impactedSystemsCount: 1,
      },
      actionPlan: {
        priorityActionsCount: 5,
        estimatedEffort: '3 semaines',
        budgetImpact: 'Élevé',
      },
    },
  ];

  const updatesLoading = false;

  // Simulation du dashboard d'impact
  const impactDashboard: ImpactDashboard = {
    userId: userId || '',
    summary: {
      totalInsights: personalizedUpdates.length,
      highPriorityActions: personalizedUpdates.filter(u => u.userContext.urgencyLevel === 'immediate' || u.userContext.urgencyLevel === 'high').length,
      impactedSystems: 3,
      urgentDeadlines: 2,
      complianceGaps: 1,
      estimatedEffort: '2 semaines',
    },
    riskAnalysis: {
      riskAmplificationFactor: 1.3,
      criticalSystems: [],
      riskTrends: {
        increasing: 2,
        stable: 5,
        decreasing: 1,
      },
    },
    complianceStatus: {
      overallScore: 78,
      upcomingDeadlines: [],
    },
  };

  const dashboardLoading = false;

  // Gestion des clics sur les cartes du dashboard
  const handleCardClick = (cardType: string) => {
    // Test temporaire avec alert
    alert(`Carte cliquée: ${cardType}`);
    setSelectedCardType(cardType);
    setIsDetailModalOpen(true);
  };

  // Synchronisation personnalisée
  const personalizedSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/regulatory/sync-personalized', {
        daysBack: 7,
        minRelevanceScore: 60,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/regulatory/personalized-updates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/regulatory/impact-dashboard'] });
      toast({
        title: "Analyse personnalisée terminée",
        description: `${data.actionableInsights} insights actionnables générés avec ${data.totalActions} actions`,
      });
    },
    onError: (error) => {
      console.error('Personalized sync error:', error);
      toast({
        title: "Erreur d'analyse",
        description: "Impossible d'effectuer l'analyse personnalisée",
        variant: "destructive",
      });
    }
  });

  // Fonctions utilitaires
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return <Zap className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatEffort = (effort: string) => {
    return effort.replace(/(\d+)\s*(jour|semaine|mois)/g, '$1 $2');
  };

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

  // Vérification d'authentification
  if (!isAuthenticated) {
    return (
      <div className="p-8" data-testid="page-proactive-monitoring">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Veille Réglementaire Proactive
          </h2>
          <p className="text-muted-foreground mb-4">
            Analyse personnalisée des impacts réglementaires et génération d'actions prioritaires
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Vous devez être connecté pour accéder à la veille réglementaire personnalisée.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="page-proactive-monitoring">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Veille Réglementaire Proactive - CARTES CLIQUABLES ✨
            </h2>
            <p className="text-muted-foreground">
              Analyse personnalisée des impacts réglementaires et génération d'actions prioritaires
            </p>
          </div>
          <Button
            onClick={() => personalizedSyncMutation.mutate()}
            disabled={personalizedSyncMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-personalized-sync"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${personalizedSyncMutation.isPending ? 'animate-spin' : ''}`} />
            Analyser les impacts
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard d'impact
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Actions prioritaires
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Insights personnalisés
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* ONGLET 1: DASHBOARD D'IMPACT */}
        <TabsContent value="dashboard" className="space-y-6">
          {dashboardLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <ImpactDashboard
              dashboard={impactDashboard}
              isLoading={dashboardLoading}
              onCardClick={handleCardClick}
            />
          )}
        </TabsContent>

        {/* ONGLET 2: ACTIONS PRIORITAIRES */}
        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Actions prioritaires à entreprendre
              </CardTitle>
            </CardHeader>
            <CardContent>
              {updatesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-8 bg-muted rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : personalizedUpdates && personalizedUpdates.length > 0 ? (
                <div className="space-y-4">
                  {personalizedUpdates
                    .filter(update => update.userContext.urgencyLevel === 'immediate' || update.userContext.urgencyLevel === 'high')
                    .map((update, index) => (
                    <div key={update.id} className="p-4 border rounded-lg bg-gradient-to-r from-red-50 to-orange-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getUrgencyIcon(update.userContext.urgencyLevel)}
                          <Badge className={getUrgencyColor(update.userContext.urgencyLevel)}>
                            {update.userContext.urgencyLevel.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Impact: {update.userContext.estimatedImpact}%
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-600">{update.source}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(update.publishedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      <h4 className="font-semibold text-foreground mb-2">{update.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{update.content}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {update.userContext.impactedSystemsCount} système(s)
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {update.actionPlan.estimatedEffort}
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {update.actionPlan.priorityActionsCount} action(s)
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Voir détails
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Générer plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucune action prioritaire détectée. Lancez une analyse personnalisée.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET 3: INSIGHTS PERSONNALISÉS */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Insights réglementaires personnalisés
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Toutes urgences" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes urgences</SelectItem>
                      <SelectItem value="immediate">Immédiat</SelectItem>
                      <SelectItem value="high">Élevé</SelectItem>
                      <SelectItem value="medium">Moyen</SelectItem>
                      <SelectItem value="low">Faible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {updatesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : personalizedUpdates && personalizedUpdates.length > 0 ? (
                <div className="space-y-4">
                  {personalizedUpdates
                    .filter(update => selectedUrgency === 'all' || update.userContext.urgencyLevel === selectedUrgency)
                    .map((update, index) => (
                    <div key={update.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge className={getUrgencyColor(update.userContext.urgencyLevel)}>
                            {update.userContext.urgencyLevel}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Pertinence:</span>
                            <Progress value={update.userContext.relevanceScore} className="w-20 h-2" />
                            <span className="text-sm text-muted-foreground">
                              {update.userContext.relevanceScore}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-600">{update.source}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(update.publishedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      <h4 className="font-semibold text-foreground mb-2">{update.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{update.content}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/30 rounded">
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-600">
                            {update.userContext.estimatedImpact}%
                          </p>
                          <p className="text-xs text-muted-foreground">Impact estimé</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-orange-600">
                            {update.userContext.impactedSystemsCount}
                          </p>
                          <p className="text-xs text-muted-foreground">Systèmes impactés</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">
                            {update.actionPlan.priorityActionsCount}
                          </p>
                          <p className="text-xs text-muted-foreground">Actions générées</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-purple-600">
                            {update.actionPlan.budgetImpact}
                          </p>
                          <p className="text-xs text-muted-foreground">Impact budget</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm text-muted-foreground">
                          Effort: {update.actionPlan.estimatedEffort}
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Source
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Plan d'actions
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucun insight personnalisé disponible. Lancez une analyse.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ONGLET 4: TIMELINE */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline des actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Timeline immédiate */}
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-red-600 mb-2">Actions immédiates (0-30 jours)</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-red-50 rounded border border-red-200">
                      <p className="font-medium">Audit de conformité système critique</p>
                      <p className="text-sm text-muted-foreground">Échéance: 15 jours • Effort: 24h</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded border border-red-200">
                      <p className="font-medium">Mise à jour documentation technique</p>
                      <p className="text-sm text-muted-foreground">Échéance: 20 jours • Effort: 16h</p>
                    </div>
                  </div>
                </div>

                {/* Timeline court terme */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-orange-600 mb-2">Court terme (1-3 mois)</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-orange-50 rounded border border-orange-200">
                      <p className="font-medium">Formation équipe sur nouvelles exigences</p>
                      <p className="text-sm text-muted-foreground">Échéance: 2 mois • Effort: 32h</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded border border-orange-200">
                      <p className="font-medium">Révision processus de gouvernance</p>
                      <p className="text-sm text-muted-foreground">Échéance: 10 semaines • Effort: 40h</p>
                    </div>
                  </div>
                </div>

                {/* Timeline moyen terme */}
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-semibold text-yellow-600 mb-2">Moyen terme (3-6 mois)</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                      <p className="font-medium">Implémentation nouveau framework</p>
                      <p className="text-sm text-muted-foreground">Échéance: 4 mois • Effort: 80h</p>
                    </div>
                  </div>
                </div>

                {/* Timeline long terme */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-600 mb-2">Long terme (6+ mois)</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 rounded border border-green-200">
                      <p className="font-medium">Certification conformité complète</p>
                      <p className="text-sm text-muted-foreground">Échéance: 8 mois • Effort: 120h</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de détail des cartes */}
      <CardDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        cardType={selectedCardType || ''}
        dashboard={impactDashboard}
        personalizedUpdates={personalizedUpdates}
      />
    </div>
  );
}
