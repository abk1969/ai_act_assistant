import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Clock,
  Users,
  ExternalLink,
  ArrowRight,
  Zap,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FileText
} from "lucide-react";

interface PersonalizedUpdate {
  id: string;
  title: string;
  content: string;
  source: string;
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

interface PriorityActionsPanelProps {
  updates: PersonalizedUpdate[];
  isLoading?: boolean;
  onViewDetails?: (updateId: string) => void;
  onGeneratePlan?: (updateId: string) => void;
}

export function PriorityActionsPanel({ 
  updates, 
  isLoading, 
  onViewDetails, 
  onGeneratePlan 
}: PriorityActionsPanelProps) {
  
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

  const getBudgetColor = (budget: string) => {
    if (budget.includes('Faible')) return 'text-green-600';
    if (budget.includes('Modéré')) return 'text-yellow-600';
    if (budget.includes('Élevé')) return 'text-red-600';
    return 'text-gray-600';
  };

  // Filtrer les actions prioritaires (immediate et high)
  const priorityUpdates = updates?.filter(
    update => update.userContext.urgencyLevel === 'immediate' || 
              update.userContext.urgencyLevel === 'high'
  ) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Actions prioritaires à entreprendre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse p-4 border rounded-lg">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Actions prioritaires à entreprendre
          </CardTitle>
          <Badge variant="destructive" className="text-xs">
            {priorityUpdates.length} action(s) urgente(s)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {priorityUpdates.length > 0 ? (
          <div className="space-y-4">
            {priorityUpdates.map((update, index) => (
              <div 
                key={update.id} 
                className="p-4 border rounded-lg bg-gradient-to-r from-red-50 to-orange-50 hover:shadow-md transition-shadow"
              >
                {/* En-tête avec urgence et impact */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getUrgencyIcon(update.userContext.urgencyLevel)}
                    <Badge className={getUrgencyColor(update.userContext.urgencyLevel)}>
                      {update.userContext.urgencyLevel.toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Impact:</span>
                      <Progress value={update.userContext.estimatedImpact} className="w-16 h-2" />
                      <span className="text-sm font-medium text-red-600">
                        {update.userContext.estimatedImpact}%
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
                
                {/* Titre et contenu */}
                <h4 className="font-semibold text-foreground mb-2 line-clamp-2">
                  {update.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {update.content}
                </p>
                
                {/* Métriques d'impact */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-white/60 rounded border mb-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="h-4 w-4 text-orange-600" />
                      <span className="text-lg font-bold text-orange-600">
                        {update.userContext.impactedSystemsCount}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Système(s)</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-bold text-blue-600">
                        {update.actionPlan.estimatedEffort}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Effort</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-lg font-bold text-green-600">
                        {update.actionPlan.priorityActionsCount}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Action(s)</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span className={`text-sm font-bold ${getBudgetColor(update.actionPlan.budgetImpact)}`}>
                        {update.actionPlan.budgetImpact}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Échéance: {update.userContext.urgencyLevel === 'immediate' ? '15 jours' : '30 jours'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewDetails?.(update.id)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Voir détails
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => onGeneratePlan?.(update.id)}
                    >
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
            <p className="text-muted-foreground mb-2">
              Aucune action prioritaire détectée
            </p>
            <p className="text-sm text-muted-foreground">
              Lancez une analyse personnalisée pour identifier les actions urgentes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
