import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Target,
  Users,
  Clock,
  AlertTriangle,
  FileText,
  BarChart3,
  CheckCircle,
  Zap
} from "lucide-react";

interface ImpactDashboardProps {
  dashboard: {
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
    complianceStatus: {
      overallScore: number;
      upcomingDeadlines: Array<{
        action: any;
        daysRemaining: number;
      }>;
    };
  };
  isLoading?: boolean;
  onCardClick?: (cardType: string) => void;
}

export function ImpactDashboard({ dashboard, isLoading, onCardClick }: ImpactDashboardProps) {
  if (isLoading) {
    return (
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
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Aucune donnée d'impact disponible. Lancez une analyse personnalisée.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques de synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card
          className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onCardClick?.('insights')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Insights actionnables</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboard.summary.totalInsights}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-l-4 border-l-red-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onCardClick?.('actions')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actions prioritaires</p>
                <p className="text-2xl font-bold text-red-600">
                  {dashboard.summary.highPriorityActions}
                </p>
              </div>
              <Target className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-l-4 border-l-orange-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onCardClick?.('systems')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Systèmes impactés</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dashboard.summary.impactedSystems}
                </p>
              </div>
              <Users className="h-5 w-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-l-4 border-l-purple-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onCardClick?.('deadlines')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Échéances urgentes</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboard.summary.urgentDeadlines}
                </p>
              </div>
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-l-4 border-l-yellow-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onCardClick?.('compliance')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gaps conformité</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {dashboard.summary.complianceGaps}
                </p>
              </div>
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onCardClick?.('effort')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Effort estimé</p>
                <p className="text-lg font-bold text-green-600">
                  {dashboard.summary.estimatedEffort}
                </p>
              </div>
              <FileText className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analyse des risques et conformité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analyse des risques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Facteur d'amplification</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-red-600">
                      {dashboard.riskAnalysis.riskAmplificationFactor.toFixed(1)}x
                    </span>
                    {dashboard.riskAnalysis.riskAmplificationFactor > 1.5 && (
                      <Badge variant="destructive" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Critique
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress 
                  value={Math.min(dashboard.riskAnalysis.riskAmplificationFactor * 50, 100)} 
                  className="h-2"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-lg font-bold text-red-600">
                    {dashboard.riskAnalysis.riskTrends.increasing}
                  </p>
                  <p className="text-xs text-muted-foreground">En hausse</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-lg font-bold text-yellow-600">
                    {dashboard.riskAnalysis.riskTrends.stable}
                  </p>
                  <p className="text-xs text-muted-foreground">Stables</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-lg font-bold text-green-600">
                    {dashboard.riskAnalysis.riskTrends.decreasing}
                  </p>
                  <p className="text-xs text-muted-foreground">En baisse</p>
                </div>
              </div>

              {dashboard.riskAnalysis.criticalSystems.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    Systèmes critiques identifiés:
                  </p>
                  <p className="text-sm text-red-600">
                    {dashboard.riskAnalysis.criticalSystems.length} système(s) nécessitent une attention immédiate
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Statut de conformité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Score global</span>
                  <span className="text-lg font-bold text-blue-600">
                    {Math.round(dashboard.complianceStatus.overallScore)}%
                  </span>
                </div>
                <Progress 
                  value={dashboard.complianceStatus.overallScore} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Non conforme</span>
                  <span>Conforme</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Systèmes critiques:</span>
                  <span className="font-medium">{dashboard.riskAnalysis.criticalSystems.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Échéances à venir:</span>
                  <span className="font-medium">{dashboard.complianceStatus.upcomingDeadlines.length}</span>
                </div>
              </div>

              {dashboard.complianceStatus.upcomingDeadlines.length > 0 && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-medium text-orange-800 mb-2">
                    Prochaines échéances:
                  </p>
                  <div className="space-y-1">
                    {dashboard.complianceStatus.upcomingDeadlines.slice(0, 3).map((deadline, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-orange-700">Action #{index + 1}</span>
                        <span className="text-orange-600 font-medium">
                          {deadline.daysRemaining} jour(s)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
