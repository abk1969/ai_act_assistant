import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, Shield, CheckCircle } from "lucide-react";

interface MetricsCardsProps {
  metrics?: {
    totalSystems: number;
    highRiskSystems: number;
    complianceScore: number;
    pendingActions: number;
  };
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card data-testid="metric-total-systems">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Systèmes évalués</p>
              <p className="text-2xl font-bold text-foreground">{metrics.totalSystems}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card data-testid="metric-high-risk">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Risque élevé</p>
              <p className="text-2xl font-bold text-red-600">{metrics.highRiskSystems}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card data-testid="metric-compliance">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Conformité</p>
              <p className="text-2xl font-bold text-green-600">{metrics.complianceScore}%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card data-testid="metric-pending-actions">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Actions requises</p>
              <p className="text-2xl font-bold text-orange-600">{metrics.pendingActions}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
