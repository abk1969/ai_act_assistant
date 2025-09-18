import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, CheckCircle, Clock, User } from "lucide-react";
import RiskForm from "@/components/assessment/risk-form";

interface AssessmentResult {
  riskLevel: 'minimal' | 'limited' | 'high' | 'unacceptable';
  riskScore: number;
  reasoning: string;
  obligations: string[];
  recommendations: string[];
  timeline: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
  };
  aiSystemId?: string;
  assessmentId?: string;
}

export default function Assessment() {
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [isFormCompleted, setIsFormCompleted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const assessmentMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest('POST', '/api/assessments', formData);
      return response.json();
    },
    onSuccess: (data: AssessmentResult) => {
      setAssessmentResult(data);
      setIsFormCompleted(true);
      queryClient.invalidateQueries({ queryKey: ['/api/ai-systems'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      
      toast({
        title: "Évaluation terminée",
        description: `Système classé comme risque ${data.riskLevel}`,
      });
    },
    onError: (error) => {
      console.error('Assessment error:', error);
      toast({
        title: "Erreur d'évaluation",
        description: "Impossible de traiter l'évaluation. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  });

  const handleFormSubmit = (formData: any) => {
    assessmentMutation.mutate(formData);
  };

  const getRiskLevelConfig = (level: string) => {
    const configs = {
      unacceptable: {
        color: 'border-purple-200 bg-purple-50',
        textColor: 'text-purple-800',
        icon: AlertTriangle,
        iconColor: 'text-purple-600'
      },
      high: {
        color: 'border-red-200 bg-red-50',
        textColor: 'text-red-800',
        icon: AlertTriangle,
        iconColor: 'text-red-600'
      },
      limited: {
        color: 'border-yellow-200 bg-yellow-50',
        textColor: 'text-yellow-800',
        icon: Clock,
        iconColor: 'text-yellow-600'
      },
      minimal: {
        color: 'border-green-200 bg-green-50',
        textColor: 'text-green-800',
        icon: CheckCircle,
        iconColor: 'text-green-600'
      }
    };
    return configs[level as keyof typeof configs] || configs.minimal;
  };

  const startNewAssessment = () => {
    setAssessmentResult(null);
    setIsFormCompleted(false);
  };

  return (
    <div className="p-8" data-testid="page-assessment">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Évaluation des risques IA
            </h2>
            <p className="text-muted-foreground">
              Basé sur le Technical Framework v3.0 - Positive AI
            </p>
          </div>
          {user && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground" data-testid="text-current-user">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                ({user.email})
              </span>
            </div>
          )}
        </div>
      </div>

      {!isFormCompleted ? (
        <RiskForm 
          onSubmit={handleFormSubmit} 
          isLoading={assessmentMutation.isPending}
        />
      ) : assessmentResult ? (
        <div className="space-y-6">
          {/* Assessment Result */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Résultat de l'évaluation
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={startNewAssessment}
                  data-testid="button-new-assessment"
                >
                  Nouvelle évaluation
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Risk Level Display */}
                <div className={`p-6 rounded-lg border ${getRiskLevelConfig(assessmentResult.riskLevel).color}`}>
                  <div className="flex items-center gap-4 mb-4">
                    {(() => {
                      const Icon = getRiskLevelConfig(assessmentResult.riskLevel).icon;
                      return <Icon className={`h-8 w-8 ${getRiskLevelConfig(assessmentResult.riskLevel).iconColor}`} />;
                    })()}
                    <div>
                      <h3 className={`text-2xl font-bold ${getRiskLevelConfig(assessmentResult.riskLevel).textColor}`}>
                        Risque {assessmentResult.riskLevel.charAt(0).toUpperCase() + assessmentResult.riskLevel.slice(1)}
                      </h3>
                      <p className={`text-sm ${getRiskLevelConfig(assessmentResult.riskLevel).textColor}`}>
                        Score de risque: {assessmentResult.riskScore}/100
                      </p>
                    </div>
                  </div>
                  
                  <div className={`text-sm ${getRiskLevelConfig(assessmentResult.riskLevel).textColor}`}>
                    <p>{assessmentResult.reasoning}</p>
                  </div>
                </div>

                {/* Obligations */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Obligations applicables</h4>
                  <div className="space-y-2">
                    {assessmentResult.obligations.map((obligation, index) => (
                      <div 
                        key={index} 
                        className="flex items-start gap-2 p-3 bg-muted rounded-lg"
                        data-testid={`obligation-${index}`}
                      >
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground">{obligation}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Recommandations</h4>
                  <div className="space-y-2">
                    {assessmentResult.recommendations.map((recommendation, index) => (
                      <div 
                        key={index} 
                        className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg"
                        data-testid={`recommendation-${index}`}
                      >
                        <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-blue-800">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">Plan d'action</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Immediate Actions */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-red-600">Actions immédiates</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {assessmentResult.timeline.immediate.map((action, index) => (
                            <div key={index} className="text-xs text-muted-foreground p-2 bg-red-50 rounded">
                              {action}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Short Term Actions */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-orange-600">Court terme</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {assessmentResult.timeline.short_term.map((action, index) => (
                            <div key={index} className="text-xs text-muted-foreground p-2 bg-orange-50 rounded">
                              {action}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Long Term Actions */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-green-600">Long terme</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {assessmentResult.timeline.long_term.map((action, index) => (
                            <div key={index} className="text-xs text-muted-foreground p-2 bg-green-50 rounded">
                              {action}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Une erreur est survenue lors de l'évaluation. Veuillez réessayer.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
