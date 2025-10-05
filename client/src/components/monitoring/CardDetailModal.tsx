import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Target,
  Users,
  Clock,
  AlertTriangle,
  FileText,
  CheckCircle,
  BarChart3,
  Calendar,
  Zap
} from "lucide-react";

interface CardDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardType: string;
  dashboard: any;
  personalizedUpdates: any[];
}

export function CardDetailModal({ 
  isOpen, 
  onClose, 
  cardType, 
  dashboard, 
  personalizedUpdates 
}: CardDetailModalProps) {
  const getCardDetails = () => {
    switch (cardType) {
      case 'insights':
        return {
          title: 'Insights Actionnables',
          icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
          content: (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{dashboard.summary.totalInsights}</p>
                      <p className="text-sm text-muted-foreground">Total insights</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {personalizedUpdates.filter(u => u.userContext.relevanceScore >= 80).length}
                      </p>
                      <p className="text-sm text-muted-foreground">Haute pertinence</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">Insights par catégorie</h4>
                {personalizedUpdates.map((update, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">{update.title}</h5>
                          <p className="text-xs text-muted-foreground mt-1">{update.category}</p>
                        </div>
                        <Badge variant={update.userContext.relevanceScore >= 80 ? "default" : "secondary"}>
                          {update.userContext.relevanceScore}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        };

      case 'actions':
        return {
          title: 'Actions Prioritaires',
          icon: <Target className="h-6 w-6 text-red-600" />,
          content: (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{dashboard.summary.highPriorityActions}</p>
                    <p className="text-sm text-muted-foreground">Urgentes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {personalizedUpdates.filter(u => u.userContext.urgencyLevel === 'high').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Importantes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {personalizedUpdates.filter(u => u.userContext.urgencyLevel === 'medium').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Moyennes</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Actions par priorité</h4>
                {personalizedUpdates
                  .filter(u => u.userContext.urgencyLevel === 'immediate' || u.userContext.urgencyLevel === 'high')
                  .map((update, index) => (
                    <Card key={index} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{update.title}</h5>
                            <p className="text-xs text-muted-foreground mt-1">
                              Effort: {update.actionPlan.estimatedEffort} • Impact: {update.actionPlan.budgetImpact}
                            </p>
                          </div>
                          <Badge variant={update.userContext.urgencyLevel === 'immediate' ? "destructive" : "default"}>
                            {update.userContext.urgencyLevel}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )
        };

      case 'systems':
        return {
          title: 'Systèmes Impactés',
          icon: <Users className="h-6 w-6 text-orange-600" />,
          content: (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600">{dashboard.summary.impactedSystems}</p>
                    <p className="text-sm text-muted-foreground">Systèmes IA impactés</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <h4 className="font-semibold">Répartition par type d'impact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Haut risque</p>
                          <p className="text-2xl font-bold text-red-600">1</p>
                        </div>
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Risque limité</p>
                          <p className="text-2xl font-bold text-yellow-600">2</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )
        };

      case 'deadlines':
        return {
          title: 'Échéances Urgentes',
          icon: <Clock className="h-6 w-6 text-purple-600" />,
          content: (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">{dashboard.summary.urgentDeadlines}</p>
                    <p className="text-sm text-muted-foreground">Échéances dans les 30 jours</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <h4 className="font-semibold">Prochaines échéances</h4>
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Documentation technique</p>
                        <p className="text-xs text-muted-foreground">Système de recommandation</p>
                      </div>
                      <Badge variant="destructive">7 jours</Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Audit de conformité</p>
                        <p className="text-xs text-muted-foreground">Système de classification</p>
                      </div>
                      <Badge variant="default">15 jours</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        };

      case 'compliance':
        return {
          title: 'Gaps de Conformité',
          icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
          content: (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-600">{dashboard.summary.complianceGaps}</p>
                    <p className="text-sm text-muted-foreground">Gaps identifiés</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <h4 className="font-semibold">Gaps par catégorie</h4>
                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Transparence</p>
                        <p className="text-xs text-muted-foreground">Documentation utilisateur insuffisante</p>
                      </div>
                      <Badge variant="outline">Critique</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        };

      case 'effort':
        return {
          title: 'Effort Estimé',
          icon: <FileText className="h-6 w-6 text-green-600" />,
          content: (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{dashboard.summary.estimatedEffort}</p>
                    <p className="text-sm text-muted-foreground">Effort total estimé</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <h4 className="font-semibold">Répartition par action</h4>
                {personalizedUpdates.map((update, index) => (
                  <Card key={index} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{update.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {update.actionPlan.priorityActionsCount} actions • {update.actionPlan.budgetImpact} impact
                          </p>
                        </div>
                        <Badge variant="outline">{update.actionPlan.estimatedEffort}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        };

      default:
        return {
          title: 'Détails',
          icon: <BarChart3 className="h-6 w-6" />,
          content: <p>Aucun détail disponible pour cette carte.</p>
        };
    }
  };

  const details = getCardDetails();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {details.icon}
            {details.title}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {details.content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
