import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User,
  Users,
  Lightbulb,
  Brain,
  TrendingUp,
  Shield,
  Settings,
  Database,
  Scale
} from "lucide-react";

// Constants for Framework v3.0
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
  { value: 'government_public_sector', label: 'Administration publique' },
  { value: 'defense_security', label: 'Défense et sécurité' },
  { value: 'technology_software', label: 'Technologies de l\'information' },
  { value: 'other', label: 'Autre secteur' }
];

const AI_USE_CASES = [
  { value: 'claims_management', label: 'Gestion des réclamations' },
  { value: 'talent_acquisition_recruitment', label: 'Recrutement et gestion des talents' },
  { value: 'pricing_personalization', label: 'Optimisation des prix et personnalisation' },
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
  { value: 'medical_diagnosis', label: 'Diagnostic médical et aide à la décision clinique' },
  { value: 'other', label: 'Autre cas d\'usage' }
];

// Framework v3.0 Risk Assessment Dimensions
const RISK_ASSESSMENT_DIMENSIONS = [
  {
    id: 'justice_fairness',
    name: 'Justice et équité',
    icon: Users,
    description: 'Évaluation des risques de discrimination et de biais',
    questions: [
      {
        id: 'bias_risk',
        text: 'Quel est le risque de biais discriminatoire dans votre système IA ?',
        options: [
          { value: 0, label: 'Aucun risque', description: 'Pas de données sensibles ou de décisions impactantes' },
          { value: 25, label: 'Risque faible', description: 'Données non-sensibles, impacts limités' },
          { value: 50, label: 'Risque modéré', description: 'Quelques données sensibles, impacts moyens' },
          { value: 75, label: 'Risque élevé', description: 'Données sensibles importantes, impacts significatifs' },
          { value: 100, label: 'Risque critique', description: 'Risque majeur de discrimination systémique' }
        ]
      },
      {
        id: 'protected_groups',
        text: 'Votre système affecte-t-il des groupes protégés ?',
        options: [
          { value: 0, label: 'Non applicable', description: 'Aucun impact sur des groupes protégés' },
          { value: 20, label: 'Impact minimal', description: 'Impact indirect et limité' },
          { value: 40, label: 'Impact modéré', description: 'Impact direct mais contrôlé' },
          { value: 70, label: 'Impact important', description: 'Impact direct significatif' },
          { value: 100, label: 'Impact critique', description: 'Risque majeur pour les droits fondamentaux' }
        ]
      }
    ]
  },
  {
    id: 'transparency_explainability',
    name: 'Transparence et explicabilité',
    icon: Lightbulb,
    description: 'Évaluation des risques liés à l\'opacité du système',
    questions: [
      {
        id: 'explainability_risk',
        text: 'Quel est le risque lié au manque d\'explicabilité ?',
        options: [
          { value: 0, label: 'Transparence complète', description: 'Système entièrement explicable' },
          { value: 15, label: 'Transparence élevée', description: 'Explications claires disponibles' },
          { value: 30, label: 'Transparence moyenne', description: 'Explications partielles' },
          { value: 60, label: 'Transparence faible', description: 'Système peu explicable' },
          { value: 90, label: 'Boîte noire', description: 'Système opaque avec impacts significatifs' }
        ]
      },
      {
        id: 'user_awareness',
        text: 'Les utilisateurs sont-ils informés de l\'usage de l\'IA ?',
        options: [
          { value: 0, label: 'Information complète', description: 'Utilisateurs pleinement informés' },
          { value: 20, label: 'Information adéquate', description: 'Information suffisante fournie' },
          { value: 45, label: 'Information partielle', description: 'Information basique seulement' },
          { value: 70, label: 'Information insuffisante', description: 'Information minimale ou peu claire' },
          { value: 100, label: 'Aucune information', description: 'Utilisateurs non informés de l\'usage IA' }
        ]
      }
    ]
  },
  {
    id: 'human_ai_interaction',
    name: 'Interaction humaine-IA',
    icon: Brain,
    description: 'Évaluation des risques de l\'autonomie du système',
    questions: [
      {
        id: 'human_oversight',
        text: 'Quel est le niveau de supervision humaine ?',
        options: [
          { value: 0, label: 'Supervision complète', description: 'Contrôle humain permanent' },
          { value: 20, label: 'Supervision régulière', description: 'Contrôle humain fréquent' },
          { value: 40, label: 'Supervision ponctuelle', description: 'Contrôle humain intermittent' },
          { value: 70, label: 'Supervision minimale', description: 'Contrôle humain rare' },
          { value: 100, label: 'Aucune supervision', description: 'Système entièrement autonome' }
        ]
      },
      {
        id: 'override_capability',
        text: 'Les humains peuvent-ils annuler les décisions IA ?',
        options: [
          { value: 0, label: 'Annulation toujours possible', description: 'Contrôle humain total' },
          { value: 25, label: 'Annulation généralement possible', description: 'Quelques restrictions mineures' },
          { value: 50, label: 'Annulation parfois possible', description: 'Contraintes significatives' },
          { value: 75, label: 'Annulation rarement possible', description: 'Capacité très limitée' },
          { value: 100, label: 'Aucune annulation possible', description: 'Décisions IA irrévocables' }
        ]
      }
    ]
  },
  {
    id: 'social_environmental_impact',
    name: 'Impact social et environnemental',
    icon: TrendingUp,
    description: 'Évaluation des risques sociétaux et environnementaux',
    questions: [
      {
        id: 'societal_harm',
        text: 'Quel est le risque de dommage sociétal ?',
        options: [
          { value: 0, label: 'Aucun risque', description: 'Impact sociétal positif ou neutre' },
          { value: 15, label: 'Risque négligeable', description: 'Impact très limité' },
          { value: 35, label: 'Risque modéré', description: 'Impacts sociétaux contrôlables' },
          { value: 65, label: 'Risque significatif', description: 'Impacts sociétaux importants' },
          { value: 95, label: 'Risque majeur', description: 'Menace pour la cohésion sociale' }
        ]
      },
      {
        id: 'environmental_impact',
        text: 'Quel est l\'impact environnemental du système ?',
        options: [
          { value: 0, label: 'Impact minimal', description: 'Consommation énergétique négligeable' },
          { value: 10, label: 'Impact faible', description: 'Consommation modérée' },
          { value: 25, label: 'Impact modéré', description: 'Consommation notable' },
          { value: 45, label: 'Impact élevé', description: 'Consommation importante' },
          { value: 70, label: 'Impact très élevé', description: 'Consommation énergétique massive' }
        ]
      }
    ]
  },
  {
    id: 'responsibility',
    name: 'Responsabilité',
    icon: Shield,
    description: 'Évaluation des risques liés à la gouvernance et responsabilité',
    questions: [
      {
        id: 'accountability_risk',
        text: 'Quel est le risque lié au manque de responsabilité ?',
        options: [
          { value: 0, label: 'Responsabilité claire', description: 'Chaîne de responsabilité bien définie' },
          { value: 20, label: 'Responsabilité définie', description: 'Responsabilités généralement claires' },
          { value: 40, label: 'Responsabilité floue', description: 'Certaines zones d\'ombre' },
          { value: 70, label: 'Responsabilité peu claire', description: 'Difficultés d\'attribution' },
          { value: 100, label: 'Aucune responsabilité', description: 'Impossible d\'identifier les responsables' }
        ]
      },
      {
        id: 'incident_management',
        text: 'Existe-t-il un plan de gestion des incidents ?',
        options: [
          { value: 0, label: 'Plan complet', description: 'Procédures détaillées et testées' },
          { value: 25, label: 'Plan défini', description: 'Procédures claires disponibles' },
          { value: 50, label: 'Plan basique', description: 'Procédures minimales' },
          { value: 75, label: 'Plan insuffisant', description: 'Procédures inadéquates' },
          { value: 100, label: 'Aucun plan', description: 'Pas de préparation aux incidents' }
        ]
      }
    ]
  },
  {
    id: 'data_privacy',
    name: 'Données et vie privée',
    icon: Database,
    description: 'Évaluation des risques pour la vie privée et les données',
    questions: [
      {
        id: 'data_sensitivity',
        text: 'Quel est le niveau de sensibilité des données traitées ?',
        options: [
          { value: 0, label: 'Données publiques', description: 'Aucune donnée sensible' },
          { value: 20, label: 'Données peu sensibles', description: 'Informations générales' },
          { value: 45, label: 'Données moyennement sensibles', description: 'Quelques données personnelles' },
          { value: 70, label: 'Données sensibles', description: 'Données personnelles importantes' },
          { value: 100, label: 'Données très sensibles', description: 'Données biométriques, santé, etc.' }
        ]
      },
      {
        id: 'privacy_protection',
        text: 'Quel est le niveau de protection de la vie privée ?',
        options: [
          { value: 0, label: 'Protection maximale', description: 'Mesures de protection robustes' },
          { value: 15, label: 'Protection élevée', description: 'Bonnes mesures de protection' },
          { value: 35, label: 'Protection adéquate', description: 'Mesures de base respectées' },
          { value: 60, label: 'Protection insuffisante', description: 'Mesures limitées' },
          { value: 90, label: 'Protection minimale', description: 'Risques importants pour la vie privée' }
        ]
      }
    ]
  },
  {
    id: 'technical_robustness_security',
    name: 'Robustesse technique et sécurité',
    icon: Settings,
    description: 'Évaluation des risques techniques et de sécurité',
    questions: [
      {
        id: 'security_risk',
        text: 'Quel est le niveau de risque sécuritaire ?',
        options: [
          { value: 0, label: 'Sécurité maximale', description: 'Mesures de sécurité robustes' },
          { value: 20, label: 'Sécurité élevée', description: 'Bonnes pratiques de sécurité' },
          { value: 40, label: 'Sécurité adéquate', description: 'Mesures de sécurité de base' },
          { value: 70, label: 'Sécurité insuffisante', description: 'Vulnérabilités importantes' },
          { value: 100, label: 'Sécurité critique', description: 'Risques majeurs de sécurité' }
        ]
      },
      {
        id: 'robustness_risk',
        text: 'Quel est le risque de défaillance technique ?',
        options: [
          { value: 0, label: 'Très robuste', description: 'Système très fiable' },
          { value: 25, label: 'Robuste', description: 'Fiabilité élevée' },
          { value: 45, label: 'Moyennement robuste', description: 'Fiabilité acceptable' },
          { value: 70, label: 'Peu robuste', description: 'Risques de défaillance' },
          { value: 100, label: 'Fragile', description: 'Défaillances fréquentes attendues' }
        ]
      }
    ]
  }
];

interface AssessmentFormData {
  systemName: string;
  industrySector?: string;
  primaryUseCase?: string;
  responses: Record<string, number>;
}

interface AssessmentResult {
  riskLevel: 'minimal' | 'limited' | 'high' | 'unacceptable';
  riskScore: number;
  reasoning: string;
  obligations: string[];
  recommendations: string[];
  dimensionScores: Record<string, {
    score: number;
    riskLevel: string;
    recommendations: string[];
  }>;
  timeline: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
  };
  aiSystemId?: string;
  assessmentId?: string;
}

export default function Assessment() {
  console.log('🔄 Assessment component rendering');

  // Ref to track if submission is in progress (more reliable than state)
  const isSubmittingRef = useRef(false);
  // Ref to track last step change time
  const lastStepChangeRef = useRef<number>(0);

  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [isFormCompleted, setIsFormCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AssessmentFormData>({
    systemName: '',
    industrySector: '',
    primaryUseCase: '',
    responses: {}
  });
  const [currentRiskScore, setCurrentRiskScore] = useState(0);
  const [currentRiskLevel, setCurrentRiskLevel] = useState<string>('minimal');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  console.log('📊 Current state:', {
    isFormCompleted,
    currentStep,
    formDataKeys: Object.keys(formData),
    responsesCount: Object.keys(formData.responses).length,
    isSubmitting: isSubmittingRef.current
  });

  // Calculate real-time risk assessment
  useEffect(() => {
    const calculateRiskScore = () => {
      const responses = Object.values(formData.responses);
      if (responses.length === 0) return { score: 0, level: 'minimal' };
      
      const totalScore = responses.reduce((sum, value) => sum + value, 0);
      const averageScore = totalScore / responses.length;
      
      let level = 'minimal';
      if (averageScore >= 80) level = 'unacceptable';
      else if (averageScore >= 60) level = 'high';
      else if (averageScore >= 30) level = 'limited';
      
      return { score: Math.round(averageScore), level };
    };
    
    const { score, level } = calculateRiskScore();
    setCurrentRiskScore(score);
    setCurrentRiskLevel(level);
  }, [formData.responses]);

  const assessmentMutation = useMutation({
    retry: false, // Disable automatic retries
    mutationFn: async (data: AssessmentFormData) => {
      // Double check with ref
      if (isSubmittingRef.current) {
        console.warn('⚠️ Submission already in progress (ref check), aborting');
        throw new Error('Submission already in progress');
      }

      isSubmittingRef.current = true;
      console.log('🚀 Starting assessment for system:', data.systemName);
      console.log('📍 Stack trace:', new Error().stack);

      try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Assessment timeout after 2 minutes'));
          }, 120000); // 2 minutes timeout
        });

        // Create the API request promise with error handling
        const apiPromise = (async () => {
          try {
            const response = await apiRequest('POST', '/api/assessments', data);
            const result = await response.json();
            console.log('📦 Received assessment result:', result);
            return result;
          } catch (err) {
            console.error('🔴 API request error:', err);
            // Re-throw with more context
            if (err instanceof Error) {
              throw new Error(`API Error: ${err.message}`);
            }
            throw err;
          }
        })();

        // Race between timeout and API call
        const result = await Promise.race([apiPromise, timeoutPromise]);
        return result;
      } catch (error) {
        console.error('🔴 Assessment mutation error:', error);
        isSubmittingRef.current = false; // Reset on error
        throw error;
      }
    },
    onSuccess: (data: AssessmentResult) => {
      console.log('✅ Assessment completed successfully:', data);
      isSubmittingRef.current = false; // Reset on success
      setAssessmentResult(data);
      setIsFormCompleted(true);
      queryClient.invalidateQueries({ queryKey: ['/api/ai-systems'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });

      toast({
        title: "Évaluation terminée",
        description: `Système classé comme risque ${data.riskLevel}`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Assessment error:', error);
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);

      isSubmittingRef.current = false; // Reset on error

      let errorMessage = "Impossible de traiter l'évaluation. Veuillez réessayer.";
      let errorTitle = "Erreur d'évaluation";

      // Handle specific error types
      const errorMsg = error?.message || String(error);

      if (errorMsg.includes('timeout')) {
        errorMessage = "L'évaluation a pris trop de temps. Veuillez réessayer avec des données plus simples.";
        errorTitle = "Timeout d'évaluation";
      } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        errorMessage = "Session expirée. Veuillez vous reconnecter.";
        errorTitle = "Session expirée";
      } else if (errorMsg.includes('408')) {
        errorMessage = "Le serveur a mis trop de temps à répondre. Veuillez réessayer.";
        errorTitle = "Timeout serveur";
      } else if (errorMsg.includes('500') || errorMsg.includes('Internal Server Error')) {
        errorMessage = "Erreur serveur. Veuillez réessayer dans quelques instants.";
        errorTitle = "Erreur serveur";
      } else if (errorMsg.includes('message channel closed') || errorMsg.includes('channel closed')) {
        errorMessage = "Connexion interrompue. Veuillez désactiver les extensions de navigateur et réessayer.";
        errorTitle = "Connexion interrompue";
      } else if (errorMsg.includes('Network') || errorMsg.includes('Failed to fetch')) {
        errorMessage = "Erreur de connexion. Vérifiez votre connexion internet.";
        errorTitle = "Erreur réseau";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  console.log('✅ assessmentMutation created, isPending:', assessmentMutation.isPending);

  const handleFormSubmit = useCallback((event?: React.MouseEvent) => {
    // Prevent default if called from an event
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Protection: Don't submit if step just changed (within 500ms)
    const timeSinceStepChange = Date.now() - lastStepChangeRef.current;
    if (timeSinceStepChange < 500) {
      console.warn(`⚠️ Step changed ${timeSinceStepChange}ms ago, ignoring premature submission`);
      return;
    }

    // Triple protection against multiple submissions
    if (isSubmittingRef.current) {
      console.warn('⚠️ Assessment already in progress (ref check), ignoring duplicate submission');
      return;
    }

    if (assessmentMutation.isPending) {
      console.warn('⚠️ Assessment already in progress (state check), ignoring duplicate submission');
      return;
    }

    if (!isFormValid()) {
      console.warn('⚠️ Form is not valid, cannot submit');
      return;
    }

    console.log('✅ User clicked submit button, starting assessment...');
    console.log('📋 Form data:', formData);
    assessmentMutation.mutate(formData);
  }, [assessmentMutation, formData]);

  const handleStepChange = useCallback((newStep: number) => {
    console.log(`🔄 Changing step from ${currentStep} to ${newStep}`);
    lastStepChangeRef.current = Date.now();
    setCurrentStep(newStep);
  }, [currentStep]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleResponseChange = (questionId: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      responses: { ...prev.responses, [questionId]: value }
    }));
  };

  const isFormValid = () => {
    const requiredQuestions = RISK_ASSESSMENT_DIMENSIONS.flatMap(d => d.questions.map(q => q.id));
    const answeredQuestions = Object.keys(formData.responses);
    
    return (
      formData.systemName.trim() !== '' &&
      formData.industrySector !== '' &&
      formData.primaryUseCase !== '' &&
      requiredQuestions.every(q => answeredQuestions.includes(q))
    );
  };

  const getTotalProgress = () => {
    const totalQuestions = RISK_ASSESSMENT_DIMENSIONS.flatMap(d => d.questions).length;
    const answeredQuestions = Object.keys(formData.responses).length;
    return Math.round((answeredQuestions / totalQuestions) * 100);
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
    handleStepChange(0);
    setFormData({
      systemName: '',
      industrySector: '',
      primaryUseCase: '',
      responses: {}
    });
    setCurrentRiskScore(0);
    setCurrentRiskLevel('minimal');
    isSubmittingRef.current = false; // Reset submission flag
  };

  const getRiskValueColor = (value: number) => {
    if (value >= 80) return 'border-purple-200 bg-purple-50 text-purple-700';
    if (value >= 60) return 'border-red-200 bg-red-50 text-red-700';
    if (value >= 30) return 'border-yellow-200 bg-yellow-50 text-yellow-700';
    return 'border-green-200 bg-green-50 text-green-700';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
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
        <div className="space-y-6">
          {/* Progress Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression de l'évaluation</span>
                  <span>{getTotalProgress()}%</span>
                </div>
                <Progress value={getTotalProgress()} className="h-2" />
                {currentRiskScore > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm text-muted-foreground">Score de risque actuel:</span>
                    <Badge 
                      variant="secondary" 
                      className={getRiskLevelColor(currentRiskLevel)}
                      data-testid="current-risk-level"
                    >
                      {currentRiskLevel.charAt(0).toUpperCase() + currentRiskLevel.slice(1)} ({currentRiskScore}/100)
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="systemName">Nom du système IA *</Label>
                  <Input
                    id="systemName"
                    value={formData.systemName}
                    onChange={(e) => handleInputChange('systemName', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Ex: Système de recommandation produits"
                    data-testid="input-system-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industrySector">Secteur d'activité *</Label>
                  <Select
                    value={formData.industrySector}
                    onValueChange={(value) => handleInputChange('industrySector', value)}
                  >
                    <SelectTrigger data-testid="select-industry-sector">
                      <SelectValue placeholder="Sélectionnez un secteur" />
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
                <div className="space-y-2">
                  <Label htmlFor="primaryUseCase">Cas d'usage principal *</Label>
                  <Select
                    value={formData.primaryUseCase}
                    onValueChange={(value) => handleInputChange('primaryUseCase', value)}
                  >
                    <SelectTrigger data-testid="select-use-case">
                      <SelectValue placeholder="Sélectionnez un cas d'usage" />
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
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment Dimensions */}
          <Tabs value={RISK_ASSESSMENT_DIMENSIONS[currentStep]?.id} onValueChange={(value) => {
            const stepIndex = RISK_ASSESSMENT_DIMENSIONS.findIndex(d => d.id === value);
            handleStepChange(stepIndex);
          }}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-7 mb-6">
              {RISK_ASSESSMENT_DIMENSIONS.map((dimension, index) => {
                const Icon = dimension.icon;
                const answeredQuestions = dimension.questions.filter(q => 
                  formData.responses[q.id] !== undefined
                ).length;
                const totalQuestions = dimension.questions.length;
                const isCompleted = answeredQuestions === totalQuestions;
                
                return (
                  <TabsTrigger
                    key={dimension.id}
                    value={dimension.id}
                    className="flex flex-col gap-1 h-auto py-3"
                    data-testid={`tab-${dimension.id}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs text-center leading-tight">
                      {dimension.name}
                    </span>
                    {isCompleted && (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {answeredQuestions}/{totalQuestions}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {RISK_ASSESSMENT_DIMENSIONS.map((dimension) => {
              const Icon = dimension.icon;
              return (
                <TabsContent key={dimension.id} value={dimension.id}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {dimension.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {dimension.description}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {dimension.questions.map((question) => (
                        <div key={question.id} className="space-y-3">
                          <Label className="text-base font-medium">
                            {question.text}
                          </Label>
                          <RadioGroup
                            value={formData.responses[question.id]?.toString() || ''}
                            onValueChange={(value) => handleResponseChange(question.id, parseInt(value))}
                            className="space-y-2"
                          >
                            {question.options.map((option) => (
                              <div key={option.value} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                                <RadioGroupItem
                                  value={option.value.toString()}
                                  id={`${question.id}-${option.value}`}
                                  className="mt-1"
                                  data-testid={`radio-${question.id}-${option.value}`}
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`${question.id}-${option.value}`}
                                    className="font-medium cursor-pointer"
                                  >
                                    {option.label}
                                  </Label>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {option.description}
                                  </p>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={`ml-2 ${getRiskValueColor(option.value)}`}
                                >
                                  {option.value}
                                </Badge>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleStepChange(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              data-testid="button-previous"
            >
              Précédent
            </Button>

            <div className="flex flex-col gap-2 items-end">
              <div className="flex gap-2">
                {currentStep < RISK_ASSESSMENT_DIMENSIONS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={() => handleStepChange(Math.min(RISK_ASSESSMENT_DIMENSIONS.length - 1, currentStep + 1))}
                    data-testid="button-next"
                  >
                    Suivant
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleFormSubmit}
                    disabled={!isFormValid() || assessmentMutation.isPending}
                    data-testid="button-submit-assessment"
                  >
                    {assessmentMutation.isPending ? 'Évaluation en cours...' : 'Lancer l\'évaluation'}
                  </Button>
                )}
              </div>
              {currentStep === RISK_ASSESSMENT_DIMENSIONS.length - 1 && !isFormValid() && (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  <p className="font-medium">⚠️ Veuillez compléter toutes les étapes:</p>
                  <ul className="mt-1 space-y-1">
                    {!formData.systemName && <li>• Nom du système</li>}
                    {!formData.industrySector && <li>• Secteur d'activité</li>}
                    {!formData.primaryUseCase && <li>• Cas d'usage principal</li>}
                    {RISK_ASSESSMENT_DIMENSIONS.map((dim, idx) => {
                      const answered = dim.questions.filter(q => formData.responses[q.id] !== undefined).length;
                      const total = dim.questions.length;
                      if (answered < total) {
                        return <li key={dim.id}>• {dim.name}: {answered}/{total} questions</li>;
                      }
                      return null;
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : assessmentResult ? (
        <div className="space-y-6">
          {/* Assessment Result */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Résultat de l'évaluation
                <Button
                  type="button"
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
                {assessmentResult.obligations && assessmentResult.obligations.length > 0 && (
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
                )}

                {/* Recommendations */}
                {assessmentResult.recommendations && assessmentResult.recommendations.length > 0 && (
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
                )}

                {/* Timeline */}
                {assessmentResult.timeline && (
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-3">Plan d'action</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Immediate Actions */}
                      {assessmentResult.timeline.immediate && assessmentResult.timeline.immediate.length > 0 && (
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
                      )}

                      {/* Short Term Actions */}
                      {assessmentResult.timeline.short_term && assessmentResult.timeline.short_term.length > 0 && (
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
                      )}

                      {/* Long Term Actions */}
                      {assessmentResult.timeline.long_term && assessmentResult.timeline.long_term.length > 0 && (
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
                      )}
                    </div>
                  </div>
                )}
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
