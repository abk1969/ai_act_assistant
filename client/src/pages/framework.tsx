import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Users, 
  Lightbulb, 
  Brain,
  TrendingUp,
  Shield,
  Settings,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Industry sectors matching shared/schema.ts industrySectorEnum exactly
const INDUSTRY_SECTORS = [
  { value: 'finance_banking', label: 'Banque et finance' },
  { value: 'healthcare_medical', label: 'Santé et sciences de la vie' },
  { value: 'education_training', label: 'Éducation et formation' },
  { value: 'transportation_automotive', label: 'Transport et logistique' },
  { value: 'retail_ecommerce', label: 'Commerce et distribution' },
  { value: 'manufacturing_industrial', label: 'Industrie manufacturière' },
  { value: 'energy_utilities', label: 'Énergie et utilities' },
  { value: 'telecommunications', label: 'Télécommunications et médias' },
  { value: 'insurance', label: 'Assurance et protection sociale' },
  { value: 'real_estate', label: 'Immobilier et foncier' },
  { value: 'agriculture', label: 'Agriculture et agroalimentaire' },
  { value: 'legal_services', label: 'Services juridiques' },
  { value: 'media_entertainment', label: 'Divertissement et culture' },
  { value: 'government_public_sector', label: 'Administration publique' },
  { value: 'defense_security', label: 'Défense et sécurité' },
  { value: 'research_development', label: 'Recherche et développement' },
  { value: 'consulting_professional_services', label: 'Conseil et services professionnels' },
  { value: 'technology_software', label: 'Technologies de l\'information' },
  { value: 'logistics_supply_chain', label: 'Logistique et chaîne d\'approvisionnement' },
  { value: 'hospitality_tourism', label: 'Tourisme et hôtellerie' },
  { value: 'non_profit', label: 'Associations et ONG' },
  { value: 'other', label: 'Autre secteur' }
];

// AI use cases matching shared/schema.ts aiUseCaseEnum exactly
const AI_USE_CASES = [
  { value: 'claims_management', label: 'Gestion des réclamations' },
  { value: 'talent_acquisition_recruitment', label: 'Recrutement et gestion des talents' },
  { value: 'pricing_personalization', label: 'Optimisation des prix et personnalisation' },
  { value: 'marketing_personalization', label: 'Personnalisation marketing' },
  { value: 'customer_service_chatbot', label: 'Service client automatisé (chatbots, assistants)' },
  { value: 'fraud_detection', label: 'Détection de fraude et sécurité' },
  { value: 'risk_assessment', label: 'Évaluation et gestion des risques' },
  { value: 'decision_support', label: 'Aide à la décision' },
  { value: 'predictive_analytics', label: 'Analyse prédictive et forecasting' },
  { value: 'image_recognition', label: 'Reconnaissance d\'images et vision par ordinateur' },
  { value: 'natural_language_processing', label: 'Traitement du langage naturel (NLP)' },
  { value: 'recommendation_systems', label: 'Systèmes de recommandation' },
  { value: 'automated_decision_making', label: 'Prise de décision automatisée' },
  { value: 'biometric_identification', label: 'Identification biométrique' },
  { value: 'content_moderation', label: 'Modération de contenu' },
  { value: 'quality_control', label: 'Contrôle qualité et inspection automatisée' },
  { value: 'supply_chain_optimization', label: 'Optimisation de chaîne d\'approvisionnement' },
  { value: 'medical_diagnosis', label: 'Diagnostic médical et aide à la décision clinique' },
  { value: 'financial_trading', label: 'Trading algorithmique et gestion d\'actifs' },
  { value: 'other', label: 'Autre cas d\'usage' }
];

// Framework v3.0 Dimensions
const FRAMEWORK_DIMENSIONS = [
  {
    id: 'justice_fairness',
    name: 'Justice et équité',
    icon: Users,
    description: 'Équité, non-discrimination et inclusion dans les systèmes IA',
    strategies: [
      {
        id: 'bias_mitigation',
        name: 'Atténuation des biais',
        questions: [
          {
            id: 'bias_detection',
            text: 'Avez-vous mis en place des mécanismes de détection automatique des biais dans vos données et modèles ?',
            scale: ['Aucun mécanisme', 'Tests manuels occasionnels', 'Tests réguliers', 'Monitoring automatique', 'Système complet avec alertes']
          },
          {
            id: 'bias_correction',
            text: 'Quelles mesures prenez-vous pour corriger les biais identifiés ?',
            scale: ['Aucune action', 'Corrections ad-hoc', 'Processus défini', 'Corrections automatiques', 'Système proactif complet']
          }
        ]
      },
      {
        id: 'fairness_testing',
        name: 'Tests d\'équité',
        questions: [
          {
            id: 'fairness_metrics',
            text: 'Utilisez-vous des métriques standardisées pour évaluer l\'équité de vos modèles ?',
            scale: ['Aucune métrique', 'Métriques basiques', 'Métriques standards', 'Métriques avancées', 'Métriques personnalisées et validation']
          }
        ]
      }
    ]
  },
  {
    id: 'transparency_explainability',
    name: 'Transparence et explicabilité',
    icon: Lightbulb,
    description: 'Compréhension et explicabilité des décisions IA',
    strategies: [
      {
        id: 'model_interpretability',
        name: 'Interprétabilité des modèles',
        questions: [
          {
            id: 'explanation_methods',
            text: 'Quelles méthodes d\'explication utilisez-vous pour rendre vos modèles compréhensibles ?',
            scale: ['Aucune explication', 'Explications basiques', 'Méthodes standards (LIME, SHAP)', 'Explications avancées', 'Explications personnalisées et validées']
          }
        ]
      }
    ]
  },
  {
    id: 'human_ai_interaction',
    name: 'Interaction humaine-IA',
    icon: Brain,
    description: 'Collaboration efficace entre humains et systèmes IA',
    strategies: [
      {
        id: 'human_oversight',
        name: 'Supervision humaine',
        questions: [
          {
            id: 'human_control',
            text: 'Dans quelle mesure les humains conservent-ils le contrôle sur les décisions critiques du système IA ?',
            scale: ['Contrôle minimal', 'Supervision basique', 'Contrôle significatif', 'Contrôle étendu', 'Contrôle complet avec veto']
          }
        ]
      }
    ]
  },
  {
    id: 'social_environmental_impact',
    name: 'Impact social et environnemental',
    icon: TrendingUp,
    description: 'Considération des impacts sociétaux et environnementaux',
    strategies: [
      {
        id: 'impact_assessment',
        name: 'Évaluation d\'impact',
        questions: [
          {
            id: 'social_impact',
            text: 'Évaluez-vous régulièrement l\'impact social de vos systèmes IA ?',
            scale: ['Aucune évaluation', 'Évaluation initiale', 'Évaluations périodiques', 'Monitoring continu', 'Évaluation complète et proactive']
          }
        ]
      }
    ]
  },
  {
    id: 'responsibility',
    name: 'Responsabilité',
    icon: Shield,
    description: 'Responsabilité et redevabilité dans l\'utilisation de l\'IA',
    strategies: [
      {
        id: 'governance',
        name: 'Gouvernance',
        questions: [
          {
            id: 'responsibility_framework',
            text: 'Avez-vous un cadre de gouvernance clair définissant les responsabilités pour l\'IA ?',
            scale: ['Aucun cadre', 'Cadre informel', 'Cadre documenté', 'Cadre opérationnel', 'Cadre complet et audité']
          }
        ]
      }
    ]
  },
  {
    id: 'data_privacy',
    name: 'Données et vie privée',
    icon: Settings,
    description: 'Protection des données et respect de la vie privée',
    strategies: [
      {
        id: 'privacy_protection',
        name: 'Protection de la vie privée',
        questions: [
          {
            id: 'privacy_measures',
            text: 'Quelles mesures de protection de la vie privée avez-vous mises en place ?',
            scale: ['Mesures basiques', 'Mesures standards', 'Mesures renforcées', 'Mesures avancées', 'Protection maximale avec anonymisation']
          }
        ]
      }
    ]
  },
  {
    id: 'technical_robustness_security',
    name: 'Robustesse technique et sécurité',
    icon: CheckCircle,
    description: 'Fiabilité et sécurité technique des systèmes IA',
    strategies: [
      {
        id: 'security_measures',
        name: 'Mesures de sécurité',
        questions: [
          {
            id: 'security_testing',
            text: 'À quelle fréquence effectuez-vous des tests de sécurité sur vos systèmes IA ?',
            scale: ['Tests rares', 'Tests annuels', 'Tests trimestriels', 'Tests mensuels', 'Tests continus automatisés']
          }
        ]
      }
    ]
  }
];

// Zod schema for form validation
const frameworkSchema = z.object({
  organizationName: z.string().min(1, 'Le nom de l\'organisation est requis'),
  systemName: z.string().min(1, 'Le nom du système est requis'),
  systemDescription: z.string().min(10, 'Une description détaillée est requise (minimum 10 caractères)'),
  industrySector: z.string().min(1, 'Le secteur d\'activité est requis'),
  primaryUseCase: z.string().min(1, 'Le cas d\'usage principal est requis'),
  frameworkResponses: z.record(z.number().min(0).max(4))
});

type FrameworkFormData = z.infer<typeof frameworkSchema>;

interface FrameworkAssessmentResult {
  riskLevel: 'minimal' | 'limited' | 'high' | 'unacceptable';
  riskScore: number;
  reasoning: string;
  euAiActRiskLevel: string;
  dimensionResults: Record<string, {
    score: number;
    level: string;
    strategies: Record<string, { score: number; responses: Record<string, number> }>;
  }>;
  overallFrameworkScore: number;
  applicableObligations: string[];
  recommendations: string[];
  priorityActions: string[];
  actionPlan: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
  };
  complianceScore: number;
  assessmentVersion: string;
  aiSystemId?: string;
  assessmentId?: string;
}

export default function FrameworkAssessment() {
  const [activeTab, setActiveTab] = useState<string>('justice_fairness');
  const [assessmentResult, setAssessmentResult] = useState<FrameworkAssessmentResult | null>(null);
  const [currentStep, setCurrentStep] = useState<'form' | 'results'>('form');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FrameworkFormData>({
    resolver: zodResolver(frameworkSchema),
    defaultValues: {
      organizationName: '',
      systemName: '',
      systemDescription: '',
      industrySector: '',
      primaryUseCase: '',
      frameworkResponses: {}
    }
  });

  const assessmentMutation = useMutation({
    mutationFn: async (formData: FrameworkFormData) => {
      const response = await apiRequest('POST', '/api/assessments', formData);
      return response.json();
    },
    onSuccess: (data: FrameworkAssessmentResult) => {
      setAssessmentResult(data);
      setCurrentStep('results');
      queryClient.invalidateQueries({ queryKey: ['/api/ai-systems'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      
      toast({
        title: "Évaluation Framework v3.0 terminée",
        description: `Score global: ${data.overallFrameworkScore}/100 - Niveau de risque: ${data.riskLevel}`,
      });
    },
    onError: (error) => {
      console.error('Framework assessment error:', error);
      toast({
        title: "Erreur d'évaluation",
        description: "Impossible de traiter l'évaluation Framework v3.0. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: FrameworkFormData) => {
    // Validate that all questions are answered
    const totalQuestions = FRAMEWORK_DIMENSIONS.reduce((sum, dim) => 
      sum + dim.strategies.reduce((stratSum, strat) => stratSum + strat.questions.length, 0), 0
    );
    
    // Count answered questions using flat structure
    const answeredQuestions = Object.keys(data.frameworkResponses).length;

    if (answeredQuestions < totalQuestions) {
      toast({
        title: "Évaluation incomplète",
        description: `Veuillez répondre à toutes les questions (${answeredQuestions}/${totalQuestions} répondues).`,
        variant: "destructive"
      });
      return;
    }

    assessmentMutation.mutate(data);
  };

  const handleResponseChange = (dimensionId: string, questionId: string, value: number) => {
    const currentResponses = form.getValues('frameworkResponses');
    // Create flat structure for backend compatibility: "dimensionId_questionId" -> response
    const flatKey = `${dimensionId}_${questionId}`;
    const updatedResponses = {
      ...currentResponses,
      [flatKey]: value
    };
    form.setValue('frameworkResponses', updatedResponses);
  };

  const getDimensionProgress = (dimensionId: string) => {
    const dimension = FRAMEWORK_DIMENSIONS.find(d => d.id === dimensionId);
    if (!dimension) return 0;
    
    const totalQuestions = dimension.strategies.reduce((sum, strat) => sum + strat.questions.length, 0);
    const responses = form.getValues('frameworkResponses');
    // Count responses for this dimension using flat key pattern
    const answeredQuestions = Object.keys(responses).filter(key => key.startsWith(`${dimensionId}_`)).length;
    
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const getRiskLevelConfig = (level: string) => {
    const configs = {
      'unacceptable': { color: 'border-purple-200 bg-purple-50', textColor: 'text-purple-800', icon: AlertTriangle },
      'high': { color: 'border-red-200 bg-red-50', textColor: 'text-red-800', icon: AlertTriangle },
      'limited': { color: 'border-yellow-200 bg-yellow-50', textColor: 'text-yellow-800', icon: Clock },
      'minimal': { color: 'border-green-200 bg-green-50', textColor: 'text-green-800', icon: CheckCircle }
    };
    return configs[level as keyof typeof configs] || configs.minimal;
  };

  const startNewAssessment = () => {
    setCurrentStep('form');
    setAssessmentResult(null);
    form.reset();
  };

  if (currentStep === 'results' && assessmentResult) {
    const riskConfig = getRiskLevelConfig(assessmentResult.riskLevel);
    const RiskIcon = riskConfig.icon;

    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Résultats Framework Positive AI v3.0</h1>
          <p className="text-gray-600">Évaluation complète de votre système IA</p>
        </div>

        {/* Overall Score Card */}
        <Card className={`${riskConfig.color} border-2`}>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <RiskIcon className={`h-8 w-8 ${riskConfig.textColor}`} />
              <CardTitle className={`text-2xl ${riskConfig.textColor}`}>
                Score Global: {assessmentResult.overallFrameworkScore}/100
              </CardTitle>
            </div>
            <Badge variant="outline" className={`${riskConfig.textColor} border-current text-lg px-4 py-2`}>
              Niveau de risque: {assessmentResult.riskLevel.toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent>
            <Progress value={assessmentResult.overallFrameworkScore} className="h-4 mb-4" />
            <p className={`text-center ${riskConfig.textColor} font-medium`}>
              Score de conformité: {assessmentResult.complianceScore}/100
            </p>
          </CardContent>
        </Card>

        {/* Dimension Scores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FRAMEWORK_DIMENSIONS.map((dimension) => {
            const dimensionResult = assessmentResult.dimensionResults[dimension.id];
            const DimensionIcon = dimension.icon;
            
            return (
              <Card key={dimension.id} className="border hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <DimensionIcon className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-sm font-medium">{dimension.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={dimensionResult?.score || 0} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Score:</span>
                      <span className="font-medium">{dimensionResult?.score || 0}/100</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {dimensionResult?.level || 'Non évalué'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Action Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Actions prioritaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {assessmentResult.priorityActions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{action}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Obligations applicables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {assessmentResult.applicableObligations.map((obligation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{obligation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Plan d'action temporel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-red-700 mb-2">Actions immédiates</h4>
                <ul className="space-y-1">
                  {assessmentResult.actionPlan.immediate.map((action, index) => (
                    <li key={index} className="text-sm">• {action}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-yellow-700 mb-2">Court terme (1-3 mois)</h4>
                <ul className="space-y-1">
                  {assessmentResult.actionPlan.short_term.map((action, index) => (
                    <li key={index} className="text-sm">• {action}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-700 mb-2">Long terme (3-12 mois)</h4>
                <ul className="space-y-1">
                  {assessmentResult.actionPlan.long_term.map((action, index) => (
                    <li key={index} className="text-sm">• {action}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button onClick={startNewAssessment} data-testid="button-new-assessment">
            Nouvelle évaluation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Évaluation Framework Positive AI v3.0</h1>
        <p className="text-gray-600">Évaluation complète sur les 7 dimensions éthiques de l'IA</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de base</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'organisation *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-organization-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="systemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du système IA *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-system-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industrySector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secteur d'activité *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-industry-sector">
                          <SelectValue placeholder="Sélectionnez votre secteur" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INDUSTRY_SECTORS.map((sector) => (
                          <SelectItem key={sector.value} value={sector.value}>
                            {sector.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primaryUseCase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cas d'usage principal *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-primary-usecase">
                          <SelectValue placeholder="Sélectionnez le cas d'usage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AI_USE_CASES.map((useCase) => (
                          <SelectItem key={useCase.value} value={useCase.value}>
                            {useCase.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="systemDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description du système *</FormLabel>
                      <FormControl>
                        <textarea 
                          {...field} 
                          className="w-full p-3 border rounded-md resize-vertical min-h-[100px]"
                          placeholder="Décrivez en détail votre système IA, son fonctionnement et ses objectifs..."
                          data-testid="input-system-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Framework Dimensions Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Évaluation par dimensions</CardTitle>
              <p className="text-gray-600">Répondez aux questions pour chaque dimension du Framework Positive AI v3.0</p>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-7 w-full mb-6">
                  {FRAMEWORK_DIMENSIONS.map((dimension) => {
                    const DimensionIcon = dimension.icon;
                    const progress = getDimensionProgress(dimension.id);
                    
                    return (
                      <TabsTrigger 
                        key={dimension.id} 
                        value={dimension.id}
                        className="flex flex-col items-center gap-1 p-3"
                        data-testid={`tab-${dimension.id}`}
                      >
                        <DimensionIcon className="h-4 w-4" />
                        <span className="text-xs text-center leading-tight">{dimension.name}</span>
                        <Progress value={progress} className="h-1 w-8" />
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {FRAMEWORK_DIMENSIONS.map((dimension) => (
                  <TabsContent key={dimension.id} value={dimension.id} className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                        <dimension.icon className="h-6 w-6" />
                        {dimension.name}
                      </h3>
                      <p className="text-gray-600">{dimension.description}</p>
                    </div>

                    {dimension.strategies.map((strategy) => (
                      <Card key={strategy.id} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                          <CardTitle className="text-lg">{strategy.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {strategy.questions.map((question) => (
                            <div key={question.id} className="space-y-3">
                              <Label className="text-base font-medium">{question.text}</Label>
                              <RadioGroup
                                value={form.getValues('frameworkResponses')[`${dimension.id}_${question.id}`]?.toString() || ''}
                                onValueChange={(value) => handleResponseChange(dimension.id, question.id, parseInt(value))}
                                data-testid={`radio-group-${question.id}`}
                              >
                                {question.scale.map((option, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <RadioGroupItem 
                                      value={index.toString()} 
                                      id={`${question.id}-${index}`}
                                      data-testid={`radio-${question.id}-${index}`}
                                    />
                                    <Label 
                                      htmlFor={`${question.id}-${index}`}
                                      className="text-sm cursor-pointer"
                                    >
                                      {option}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Progression de l'évaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {FRAMEWORK_DIMENSIONS.map((dimension) => {
                  const progress = getDimensionProgress(dimension.id);
                  const DimensionIcon = dimension.icon;
                  
                  return (
                    <div key={dimension.id} className="text-center space-y-2">
                      <DimensionIcon className="h-6 w-6 mx-auto text-blue-600" />
                      <p className="text-xs font-medium">{dimension.name}</p>
                      <Progress value={progress} className="h-2" />
                      <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button 
              type="submit" 
              disabled={assessmentMutation.isPending}
              className="px-8 py-3 text-lg"
              data-testid="button-submit-assessment"
            >
              {assessmentMutation.isPending ? 'Évaluation en cours...' : 'Lancer l\'évaluation Framework v3.0'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}