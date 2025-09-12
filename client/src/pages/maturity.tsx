import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  CheckCircle, 
  Target, 
  Users, 
  Shield, 
  Brain,
  AlertTriangle,
  Clock,
  Lightbulb,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Constants for Framework Positive AI v3.0
const INDUSTRY_SECTORS = [
  { value: 'healthcare', label: 'Santé et sciences de la vie' },
  { value: 'transport', label: 'Transport et logistique' },
  { value: 'finance', label: 'Banque et finance' },
  { value: 'education', label: 'Éducation et formation' },
  { value: 'law_enforcement', label: 'Forces de l\'ordre et justice' },
  { value: 'energy', label: 'Énergie et utilities' },
  { value: 'agriculture', label: 'Agriculture et agroalimentaire' },
  { value: 'manufacturing', label: 'Industrie manufacturière' },
  { value: 'retail', label: 'Commerce et distribution' },
  { value: 'telecommunications', label: 'Télécommunications et médias' },
  { value: 'construction', label: 'BTP et construction' },
  { value: 'real_estate', label: 'Immobilier et foncier' },
  { value: 'tourism', label: 'Tourisme et hôtellerie' },
  { value: 'entertainment', label: 'Divertissement et culture' },
  { value: 'consulting', label: 'Conseil et services professionnels' },
  { value: 'research', label: 'Recherche et développement' },
  { value: 'government', label: 'Administration publique' },
  { value: 'defense', label: 'Défense et sécurité' },
  { value: 'insurance', label: 'Assurance et protection sociale' },
  { value: 'non_profit', label: 'Associations et ONG' },
  { value: 'technology', label: 'Technologies de l\'information' },
  { value: 'other', label: 'Autre secteur' }
];

const AI_USE_CASES = [
  { value: 'predictive_analytics', label: 'Analyse prédictive et forecasting' },
  { value: 'customer_service', label: 'Service client automatisé (chatbots, assistants)' },
  { value: 'fraud_detection', label: 'Détection de fraude et sécurité' },
  { value: 'recommendation_systems', label: 'Systèmes de recommandation' },
  { value: 'image_recognition', label: 'Reconnaissance d\'images et vision par ordinateur' },
  { value: 'natural_language_processing', label: 'Traitement du langage naturel (NLP)' },
  { value: 'process_automation', label: 'Automatisation des processus métier (RPA+)' },
  { value: 'risk_assessment', label: 'Évaluation et gestion des risques' },
  { value: 'quality_control', label: 'Contrôle qualité et inspection automatisée' },
  { value: 'supply_chain_optimization', label: 'Optimisation de chaîne d\'approvisionnement' },
  { value: 'medical_diagnosis', label: 'Diagnostic médical et aide à la décision clinique' },
  { value: 'financial_trading', label: 'Trading algorithmique et gestion d\'actifs' },
  { value: 'hr_recruitment', label: 'Recrutement et gestion des talents' },
  { value: 'content_generation', label: 'Génération de contenu (texte, images, vidéo)' },
  { value: 'voice_recognition', label: 'Reconnaissance vocale et synthèse vocale' },
  { value: 'autonomous_systems', label: 'Systèmes autonomes (véhicules, drones, robots)' },
  { value: 'pricing_optimization', label: 'Optimisation des prix et revenus' },
  { value: 'sentiment_analysis', label: 'Analyse de sentiment et opinion mining' },
  { value: 'predictive_maintenance', label: 'Maintenance prédictive et IoT' },
  { value: 'other', label: 'Autre cas d\'usage' }
];

// Types
interface MaturityDomain {
  name: string;
  description: string;
  questions: MaturityQuestion[];
  weight: number;
}

interface MaturityQuestion {
  id: string;
  category: string;
  question: string;
  options: MaturityOption[];
}

interface MaturityOption {
  value: number;
  label: string;
  description: string;
}

interface MaturityFormData {
  organizationName: string;
  industrySector?: string;
  primaryUseCase?: string;
  responses: Record<string, number>;
}

interface MaturityAssessmentResult {
  overallMaturity: 'initial' | 'developing' | 'defined' | 'managed' | 'optimizing';
  overallScore: number;
  domainScores: Record<string, {
    score: number;
    maturityLevel: string;
    strengths: string[];
    improvements: string[];
  }>;
  recommendations: string[];
  actionPlan: {
    priority: 'high' | 'medium' | 'low';
    domain: string;
    action: string;
    timeline: string;
    resources: string[];
  }[];
  assessmentId?: string;
}

export default function MaturityPage() {
  const [currentStep, setCurrentStep] = useState<'form' | 'result'>('form');
  const [formData, setFormData] = useState<MaturityFormData>({
    organizationName: '',
    industrySector: undefined,
    primaryUseCase: undefined,
    responses: {}
  });
  const [assessmentResult, setAssessmentResult] = useState<MaturityAssessmentResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch maturity framework
  const { data: framework, isLoading: frameworkLoading } = useQuery<MaturityDomain[]>({
    queryKey: ['/api/maturity/framework'],
  });

  // Fetch user's maturity assessments
  const { data: userAssessments, isLoading: assessmentsLoading } = useQuery<MaturityAssessmentResult[]>({
    queryKey: ['/api/maturity/assessments'],
  });

  // Assessment mutation
  const assessmentMutation = useMutation({
    mutationFn: async (data: MaturityFormData): Promise<MaturityAssessmentResult> => {
      const response = await fetch('/api/maturity/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to perform assessment');
      return response.json();
    },
    onSuccess: (result) => {
      setAssessmentResult(result);
      setCurrentStep('result');
      queryClient.invalidateQueries({ queryKey: ['/api/maturity/assessments'] });
      toast({
        title: "Évaluation complétée",
        description: "Votre évaluation de maturité organisationnelle a été réalisée avec succès."
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de l'évaluation. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  });

  const handleSubmitAssessment = () => {
    if (!formData.organizationName.trim()) {
      toast({
        title: "Nom d'organisation requis",
        description: "Veuillez saisir le nom de votre organisation.",
        variant: "destructive"
      });
      return;
    }

    const totalQuestions = framework?.reduce((sum, domain) => sum + domain.questions.length, 0) || 0;
    const answeredQuestions = Object.keys(formData.responses).length;

    if (answeredQuestions < totalQuestions) {
      toast({
        title: "Évaluation incomplète",
        description: `Veuillez répondre à toutes les questions (${answeredQuestions}/${totalQuestions} répondues).`,
        variant: "destructive"
      });
      return;
    }

    assessmentMutation.mutate(formData);
  };

  const handleResponseChange = (questionId: string, value: number) => {
    console.log('Response change:', questionId, value); // Debug log
    setFormData(prev => {
      const newData = {
        ...prev,
        responses: {
          ...prev.responses,
          [questionId]: value
        }
      };
      console.log('Updated formData:', newData); // Debug log
      return newData;
    });
  };

  const startNewAssessment = () => {
    setCurrentStep('form');
    setAssessmentResult(null);
    setFormData({
      organizationName: '',
      industrySector: undefined,
      primaryUseCase: undefined,
      responses: {}
    });
  };

  const getMaturityLevelConfig = (level: string) => {
    const configs = {
      'initial': { 
        color: 'bg-red-50 border-red-200', 
        textColor: 'text-red-800', 
        iconColor: 'text-red-600',
        icon: AlertTriangle 
      },
      'developing': { 
        color: 'bg-orange-50 border-orange-200', 
        textColor: 'text-orange-800', 
        iconColor: 'text-orange-600',
        icon: TrendingUp 
      },
      'defined': { 
        color: 'bg-yellow-50 border-yellow-200', 
        textColor: 'text-yellow-800', 
        iconColor: 'text-yellow-600',
        icon: Settings 
      },
      'managed': { 
        color: 'bg-blue-50 border-blue-200', 
        textColor: 'text-blue-800', 
        iconColor: 'text-blue-600',
        icon: Target 
      },
      'optimizing': { 
        color: 'bg-green-50 border-green-200', 
        textColor: 'text-green-800', 
        iconColor: 'text-green-600',
        icon: CheckCircle 
      }
    };
    return configs[level as keyof typeof configs] || configs.initial;
  };

  const getDomainIcon = (domain: string) => {
    const icons = {
      'strategy': Brain,
      'governance': Shield,
      'ethics': Users,
      'capabilities': Settings
    };
    return icons[domain as keyof typeof icons] || Settings;
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
    }
  };

  if (frameworkLoading || assessmentsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Évaluation de Maturité Organisationnelle</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Évaluez la maturité de votre organisation en matière d'Intelligence Artificielle 
          avec le framework Positive AI. Identifiez vos forces et axes d'amélioration.
        </p>
      </div>

      {currentStep === 'form' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Questionnaire d'évaluation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="org-name">Nom de l'organisation</Label>
              <Input
                id="org-name"
                placeholder="Entrez le nom de votre organisation"
                value={formData.organizationName}
                onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                data-testid="input-organization-name"
              />
            </div>

            {/* Industry Sector */}
            <div className="space-y-2">
              <Label htmlFor="industry-sector">Secteur d'activité</Label>
              <Select
                value={formData.industrySector}
                onValueChange={(value) => setFormData(prev => ({ ...prev, industrySector: value }))}
              >
                <SelectTrigger data-testid="select-industry-sector">
                  <SelectValue placeholder="Sélectionnez votre secteur d'activité" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_SECTORS.map((sector) => (
                    <SelectItem key={sector.value} value={sector.value}>
                      {sector.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Primary Use Case */}
            <div className="space-y-2">
              <Label htmlFor="primary-use-case">Cas d'usage principal IA</Label>
              <Select
                value={formData.primaryUseCase}
                onValueChange={(value) => setFormData(prev => ({ ...prev, primaryUseCase: value }))}
              >
                <SelectTrigger data-testid="select-primary-use-case">
                  <SelectValue placeholder="Sélectionnez votre cas d'usage principal IA" />
                </SelectTrigger>
                <SelectContent>
                  {AI_USE_CASES.map((useCase) => (
                    <SelectItem key={useCase.value} value={useCase.value}>
                      {useCase.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Questions by Domain */}
            {framework?.map((domain) => {
              const DomainIcon = getDomainIcon(domain.name);
              return (
                <Card key={domain.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DomainIcon className="h-5 w-5" />
                      {domain.description}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {domain.questions.map((question) => (
                      <div key={question.id} className="space-y-3">
                        <Label className="text-base font-medium">{question.question}</Label>
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <div key={option.value} className="flex items-start space-x-3">
                              <input
                                type="radio"
                                id={`${question.id}-${option.value}`}
                                name={question.id}
                                value={option.value}
                                checked={formData.responses[question.id] === option.value}
                                onChange={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleResponseChange(question.id, option.value);
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResponseChange(question.id, option.value);
                                }}
                                className="mt-1"
                                data-testid={`radio-${question.id}-${option.value}`}
                              />
                              <div className="space-y-1">
                                <label 
                                  htmlFor={`${question.id}-${option.value}`}
                                  className="text-sm font-medium cursor-pointer"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleResponseChange(question.id, option.value);
                                  }}
                                >
                                  {option.label}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  {option.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <Button 
                onClick={handleSubmitAssessment}
                disabled={assessmentMutation.isPending}
                size="lg"
                data-testid="button-submit-assessment"
              >
                {assessmentMutation.isPending ? 'Évaluation en cours...' : 'Lancer l\'évaluation'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : assessmentResult ? (
        <div className="space-y-6">
          {/* Results Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Résultats de l'évaluation</span>
                <Button 
                  variant="outline" 
                  onClick={startNewAssessment}
                  data-testid="button-new-assessment"
                >
                  Nouvelle évaluation
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Overall Score */}
              <div className={`p-6 rounded-lg border ${getMaturityLevelConfig(assessmentResult.overallMaturity).color} mb-6`}>
                <div className="flex items-center gap-4 mb-4">
                  {(() => {
                    const Icon = getMaturityLevelConfig(assessmentResult.overallMaturity).icon;
                    return <Icon className={`h-8 w-8 ${getMaturityLevelConfig(assessmentResult.overallMaturity).iconColor}`} />;
                  })()}
                  <div>
                    <h3 className={`text-2xl font-bold ${getMaturityLevelConfig(assessmentResult.overallMaturity).textColor}`}>
                      Maturité {assessmentResult.overallMaturity.charAt(0).toUpperCase() + assessmentResult.overallMaturity.slice(1)}
                    </h3>
                    <p className={`text-sm ${getMaturityLevelConfig(assessmentResult.overallMaturity).textColor}`}>
                      Score global: {assessmentResult.overallScore}/100
                    </p>
                  </div>
                </div>
                <Progress 
                  value={assessmentResult.overallScore} 
                  className="w-full h-3"
                />
              </div>

              <Tabs defaultValue="domains" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="domains">Domaines</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
                  <TabsTrigger value="action-plan">Plan d'action</TabsTrigger>
                </TabsList>

                <TabsContent value="domains" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(assessmentResult.domainScores).map(([domain, data]) => {
                      const DomainIcon = getDomainIcon(domain);
                      return (
                        <Card key={domain}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <DomainIcon className="h-5 w-5" />
                              {domain.charAt(0).toUpperCase() + domain.slice(1)}
                              <Badge variant={data.score >= 60 ? 'default' : 'secondary'}>
                                {data.score}/100
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <Progress value={data.score} className="w-full" />
                            <p className="text-sm font-medium">
                              Niveau: {data.maturityLevel.charAt(0).toUpperCase() + data.maturityLevel.slice(1)}
                            </p>
                            
                            {data.strengths.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-green-700 mb-1">Forces:</p>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {data.strengths.map((strength, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                      {strength}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {data.improvements.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-amber-700 mb-1">Améliorations:</p>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {data.improvements.map((improvement, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <Target className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                      {improvement}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                  <div className="space-y-3">
                    {assessmentResult.recommendations.map((recommendation, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{recommendation}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="action-plan" className="space-y-4">
                  <div className="space-y-3">
                    {assessmentResult.actionPlan.map((action, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className={getPriorityColor(action.priority)}>
                                  {action.priority === 'high' ? 'Priorité haute' : 
                                   action.priority === 'medium' ? 'Priorité moyenne' : 'Priorité basse'}
                                </Badge>
                                <Badge variant="outline">{action.domain}</Badge>
                              </div>
                              <p className="font-medium">{action.action}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {action.timeline}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {action.resources.join(', ')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
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

      {/* Previous Assessments */}
      {userAssessments && userAssessments.length > 0 && currentStep === 'form' && (
        <Card>
          <CardHeader>
            <CardTitle>Évaluations précédentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userAssessments.slice(0, 3).map((assessment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">Évaluation de maturité</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={assessment.overallScore >= 60 ? 'default' : 'secondary'}>
                        {assessment.overallScore}/100
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {assessment.overallMaturity}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Voir détails
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}