import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Ban, AlertTriangle, CheckCircle } from "lucide-react";
import ComplianceMatrix from "@/components/compliance/compliance-matrix";

export default function Compliance() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/compliance/overview'],
  });

  const riskCategories = [
    {
      title: "Systèmes interdits (Risque inacceptable)",
      description: "Article 5 - Pratiques d'IA prohibées dans l'UE",
      icon: Ban,
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      titleColor: "text-red-800",
      obligations: [
        {
          title: "Manipulation comportementale",
          description: "Techniques subliminales ou exploitant les vulnérabilités",
          status: "prohibited"
        },
        {
          title: "Crédit social généralisé",
          description: "Évaluation ou classification des citoyens",
          status: "prohibited"
        },
        {
          title: "Identification biométrique temps réel",
          description: "Sauf exceptions limitées pour les forces de l'ordre",
          status: "prohibited"
        }
      ]
    },
    {
      title: "Systèmes à haut risque",
      description: "Chapitres III - Obligations renforcées selon Annexe III",
      icon: AlertTriangle,
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      titleColor: "text-orange-800",
      obligations: [
        {
          title: "Système de gestion qualité",
          description: "Article 17 - Documentation et processus",
          status: "required"
        },
        {
          title: "Surveillance humaine",
          description: "Article 14 - Contrôle effectif et permanent",
          status: "required"
        },
        {
          title: "Évaluation conformité",
          description: "Article 43 - Marquage CE obligatoire",
          status: "required"
        }
      ]
    }
  ];

  return (
    <div className="p-8" data-testid="page-compliance">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Tableau de conformité
        </h2>
        <p className="text-muted-foreground">
          Obligations réglementaires par catégorie de risque
        </p>
      </div>

      {/* Overview Cards */}
      {overviewLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="metric-total-systems">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{overview.totalSystems}</p>
                <p className="text-sm text-muted-foreground">Systèmes totaux</p>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="metric-compliant-systems">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{overview.compliantSystems}</p>
                <p className="text-sm text-muted-foreground">Conformes</p>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="metric-partial-compliance">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{overview.partialCompliance}</p>
                <p className="text-sm text-muted-foreground">Partiellement conformes</p>
              </div>
            </CardContent>
          </Card>
          
          <Card data-testid="metric-non-compliant-systems">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{overview.nonCompliantSystems}</p>
                <p className="text-sm text-muted-foreground">Non conformes</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Risk Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {riskCategories.map((category, index) => {
          const Icon = category.icon;
          return (
            <Card 
              key={index} 
              className={`overflow-hidden ${category.borderColor}`}
              data-testid={`risk-category-${index}`}
            >
              <div className={`${category.bgColor} px-6 py-4 border-b ${category.borderColor}`}>
                <h3 className={`font-semibold ${category.titleColor} flex items-center gap-2`}>
                  <Icon className="h-5 w-5" />
                  {category.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {category.description}
                </p>
              </div>
              <CardContent className="p-6 space-y-4">
                {category.obligations.map((obligation, obligationIndex) => (
                  <div 
                    key={obligationIndex} 
                    className="flex items-start gap-3"
                    data-testid={`obligation-${index}-${obligationIndex}`}
                  >
                    {obligation.status === "prohibited" ? (
                      <Ban className="text-red-500 mt-1 h-4 w-4 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="text-orange-500 mt-1 h-4 w-4 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {obligation.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {obligation.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Compliance Matrix */}
      <ComplianceMatrix />

      {/* Legal Notice */}
      <Alert className="mt-8 border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Rappel important :</strong> Cette matrice de conformité est fournie à titre informatif. 
          Pour une évaluation juridique définitive, consultez un avocat spécialisé en droit numérique 
          et intelligence artificielle.
        </AlertDescription>
      </Alert>
    </div>
  );
}
