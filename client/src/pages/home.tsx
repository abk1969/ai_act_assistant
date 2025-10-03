import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import MetricsCards from "@/components/dashboard/metrics-cards";
import RiskDistribution from "@/components/dashboard/risk-distribution";
import ActionItems from "@/components/dashboard/action-items";

interface DashboardMetrics {
  totalSystems: number;
  highRiskSystems: number;
  complianceScore: number;
  pendingActions: number;
  riskDistribution?: any;
}

interface RegulatoryUpdate {
  id: string;
  title: string;
  date: string;
  description: string;
}

export default function Home() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
  });

  const { data: updates } = useQuery<RegulatoryUpdate[]>({
    queryKey: ['/api/regulatory/updates'],
    select: (data) => data?.slice(0, 3) || [],
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="page-home">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Tableau de bord de conformité
        </h2>
        <p className="text-muted-foreground">
          Vue d'ensemble de votre conformité au Règlement (UE) 2024/1689
        </p>
      </div>

      {/* Legal Warning */}
      <Alert className="mb-8 border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Avertissement juridique :</strong> Ce système constitue un outil d'aide à la décision 
          et ne constitue en aucun cas un conseil juridique professionnel ou une certification officielle de conformité.
        </AlertDescription>
      </Alert>

      {/* Key Metrics */}
      <MetricsCards metrics={metrics} />

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RiskDistribution distribution={metrics?.riskDistribution} />
        <ActionItems />
      </div>

      {/* Recent Activity */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Activité réglementaire récente
        </h3>
        <div className="space-y-4">
          {updates?.map((update: any, index: number) => (
            <div
              key={update.id || index}
              className="flex items-start gap-4 p-4 border-l-4 border-blue-500 bg-blue-50"
              data-testid={`activity-item-${index}`}
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">
                  {update.title}
                </p>
                <p className="text-xs text-blue-600">
                  {update.source} • {new Date(update.publishedAt).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Impact: {update.category || 'Général'}
                </p>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune activité récente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
