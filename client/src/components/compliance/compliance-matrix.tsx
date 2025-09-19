import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Minus } from "lucide-react";

export default function ComplianceMatrix() {
  const { data: matrix, isLoading } = useQuery({
    queryKey: ['/api/compliance/matrix'],
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'not_applicable':
        return <Minus className="h-4 w-4 text-gray-400" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      case 'non_compliant':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'unacceptable':
        return 'bg-purple-100 text-purple-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'limited':
        return 'bg-yellow-100 text-yellow-800';
      case 'minimal':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matrice de conformité par système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-12 bg-muted rounded mb-4"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded mb-2"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!matrix || matrix.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matrice de conformité par système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Aucun système IA évalué. Commencez par créer une évaluation des risques.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="compliance-matrix">
      <CardHeader>
        <CardTitle>Matrice de conformité par système</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Système
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Documentation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Surveillance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Transparence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {matrix.map((item: any, index: number) => (
                <tr key={item.systemId} data-testid={`matrix-row-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      {item.systemName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Mis à jour: {new Date(item.lastUpdated).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getRiskLevelColor(item.riskLevel)}>
                      {item.riskLevel === 'unacceptable' && 'Inacceptable'}
                      {item.riskLevel === 'high' && 'Haut risque'}
                      {item.riskLevel === 'limited' && 'Risque limité'}
                      {item.riskLevel === 'minimal' && 'Risque minimal'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusIcon(item.obligations.documentation)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusIcon(item.obligations.testing)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusIcon(item.obligations.surveillance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusIcon(item.obligations.transparency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getOverallStatusColor(item.overallStatus)}>
                      {item.overallStatus === 'compliant' && 'Conforme'}
                      {item.overallStatus === 'partial' && 'Partiel'}
                      {item.overallStatus === 'non_compliant' && 'Non conforme'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Legend */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-3">Légende</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Conforme</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-orange-500" />
              <span>En attente</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-3 w-3 text-red-500" />
              <span>Non conforme</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="h-3 w-3 text-gray-400" />
              <span>Non applicable</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
