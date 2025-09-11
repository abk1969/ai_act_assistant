import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Scale, Eye, UserCog, Bot } from "lucide-react";

interface RiskFormProps {
  onSubmit: (formData: any) => void;
  isLoading?: boolean;
}

export default function RiskForm({ onSubmit, isLoading }: RiskFormProps) {
  const [formData, setFormData] = useState({
    // Basic Information
    systemName: "",
    sector: "",
    description: "",

    // Justice and Equity
    sensitiveData: "",
    discriminationRisk: "",

    // Transparency
    userInformed: "",
    explainabilityLevel: "medium",

    // Human Interaction
    humanOversight: "",
    overrideCapability: "",

    // Technical Characteristics
    autonomyLevel: "medium",
    safetyImpact: "",
    decisionConsequences: "",

    // Domain Specific
    applicationDomain: "",
    userCategories: [] as string[],
    geographicalScope: "eu",
  });

  const [currentRiskLevel, setCurrentRiskLevel] = useState<string | null>(null);
  const [currentScore, setCurrentScore] = useState<number>(0);

  const handleInputChange = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Calculate real-time risk assessment
    const { level, score } = calculateRealTimeRisk(newFormData);
    setCurrentRiskLevel(level);
    setCurrentScore(score);
  };

  const calculateRealTimeRisk = (data: any) => {
    let score = 0;

    // Sensitive data handling (0-25 points)
    if (data.sensitiveData === 'yes') score += 25;
    else if (data.sensitiveData === 'limited') score += 15;
    else if (data.sensitiveData === 'no') score += 5;

    // Discrimination risk (0-20 points)
    if (data.discriminationRisk === 'high') score += 20;
    else if (data.discriminationRisk === 'medium') score += 12;
    else if (data.discriminationRisk === 'low') score += 4;

    // Human oversight (0-20 points)
    if (data.humanOversight === 'minimal') score += 20;
    else if (data.humanOversight === 'intermittent') score += 12;
    else if (data.humanOversight === 'full') score += 4;

    // Safety impact (0-20 points)
    if (data.safetyImpact === 'critical') score += 20;
    else if (data.safetyImpact === 'significant') score += 12;
    else if (data.safetyImpact === 'minimal') score += 3;

    // Determine risk level
    let level = 'minimal';
    if (score >= 70) level = 'high';
    else if (score >= 40) level = 'limited';
    else if (score >= 20) level = 'minimal';

    // Check for unacceptable practices
    if (data.applicationDomain?.includes('manipulation') || 
        data.applicationDomain?.includes('social_scoring')) {
      level = 'unacceptable';
      score = 100;
    }

    return { level, score };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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

  const isFormValid = () => {
    return (
      formData.systemName.trim() !== "" &&
      formData.sector !== "" &&
      formData.sensitiveData !== "" &&
      formData.discriminationRisk !== "" &&
      formData.userInformed !== "" &&
      formData.humanOversight !== "" &&
      formData.safetyImpact !== ""
    );
  };

  return (
    <Card data-testid="risk-assessment-form">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Informations générales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="systemName">Nom du système IA</Label>
                <Input
                  id="systemName"
                  placeholder="Ex: Système de recommandation produits"
                  value={formData.systemName}
                  onChange={(e) => handleInputChange('systemName', e.target.value)}
                  data-testid="input-system-name"
                />
              </div>
              <div>
                <Label htmlFor="sector">Secteur d'application</Label>
                <Select value={formData.sector} onValueChange={(value) => handleInputChange('sector', value)}>
                  <SelectTrigger data-testid="select-sector">
                    <SelectValue placeholder="Sélectionner un secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="health">Santé</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="education">Éducation</SelectItem>
                    <SelectItem value="employment">Emploi</SelectItem>
                    <SelectItem value="law_enforcement">Forces de l'ordre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                placeholder="Décrivez brièvement le système IA..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                data-testid="textarea-description"
              />
            </div>
          </div>

          {/* Justice and Equity */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Justice et équité
            </h3>
            <div className="space-y-6 bg-muted/30 p-6 rounded-lg">
              <div>
                <Label className="text-sm font-medium text-foreground mb-3 block">
                  Votre système traite-t-il des données sensibles ou protégées ?
                </Label>
                <RadioGroup
                  value={formData.sensitiveData}
                  onValueChange={(value) => handleInputChange('sensitiveData', value)}
                  data-testid="radio-sensitive-data"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="sensitive-yes" />
                    <Label htmlFor="sensitive-yes" className="text-sm">
                      Oui, données biométriques, ethniques ou de santé
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="limited" id="sensitive-limited" />
                    <Label htmlFor="sensitive-limited" className="text-sm">
                      Partiellement, données personnelles standards
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="sensitive-no" />
                    <Label htmlFor="sensitive-no" className="text-sm">
                      Non, données anonymisées ou publiques
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground mb-3 block">
                  Le système peut-il avoir un impact discriminatoire ?
                </Label>
                <RadioGroup
                  value={formData.discriminationRisk}
                  onValueChange={(value) => handleInputChange('discriminationRisk', value)}
                  data-testid="radio-discrimination"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="discrim-high" />
                    <Label htmlFor="discrim-high" className="text-sm">
                      Risque élevé (emploi, crédit, services essentiels)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="discrim-medium" />
                    <Label htmlFor="discrim-medium" className="text-sm">
                      Risque modéré (personnalisation, recommandations)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="discrim-low" />
                    <Label htmlFor="discrim-low" className="text-sm">
                      Risque faible (applications techniques)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Transparency & Explainability */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Transparence et explicabilité
            </h3>
            <div className="space-y-4 bg-muted/30 p-6 rounded-lg">
              <div>
                <Label className="text-sm font-medium text-foreground mb-3 block">
                  Les utilisateurs sont-ils informés de l'utilisation d'IA ?
                </Label>
                <RadioGroup
                  value={formData.userInformed}
                  onValueChange={(value) => handleInputChange('userInformed', value)}
                  data-testid="radio-user-informed"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="informed-full" />
                    <Label htmlFor="informed-full" className="text-sm">
                      Information complète et claire
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id="informed-partial" />
                    <Label htmlFor="informed-partial" className="text-sm">
                      Information partielle
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="informed-none" />
                    <Label htmlFor="informed-none" className="text-sm">
                      Aucune information
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Human Interaction */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Interaction humaine et contrôle
            </h3>
            <div className="space-y-4 bg-muted/30 p-6 rounded-lg">
              <div>
                <Label className="text-sm font-medium text-foreground mb-3 block">
                  Niveau de supervision humaine
                </Label>
                <RadioGroup
                  value={formData.humanOversight}
                  onValueChange={(value) => handleInputChange('humanOversight', value)}
                  data-testid="radio-human-oversight"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="oversight-full" />
                    <Label htmlFor="oversight-full" className="text-sm">
                      Supervision humaine permanente
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="intermittent" id="oversight-intermittent" />
                    <Label htmlFor="oversight-intermittent" className="text-sm">
                      Supervision intermittente
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="minimal" id="oversight-minimal" />
                    <Label htmlFor="oversight-minimal" className="text-sm">
                      Supervision minimale
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="safetyImpact">Impact sur la sécurité</Label>
                <Select 
                  value={formData.safetyImpact} 
                  onValueChange={(value) => handleInputChange('safetyImpact', value)}
                >
                  <SelectTrigger data-testid="select-safety-impact">
                    <SelectValue placeholder="Sélectionner l'impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critique (sécurité des personnes)</SelectItem>
                    <SelectItem value="significant">Significatif (impact économique)</SelectItem>
                    <SelectItem value="minimal">Minimal (impact limité)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Real-time Risk Assessment */}
          {currentRiskLevel && (
            <div className="border-t border-border pt-6">
              <div className="bg-muted p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Évaluation automatique du risque
                </h4>
                <div className="flex items-center gap-4 mb-4">
                  <Badge className={getRiskLevelColor(currentRiskLevel)}>
                    Risque {currentRiskLevel.charAt(0).toUpperCase() + currentRiskLevel.slice(1)}
                  </Badge>
                  <span className="text-muted-foreground">Score: {currentScore}/100</span>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {currentRiskLevel === 'unacceptable' && (
                    <p>⚠️ Ce système présente des caractéristiques interdites par l'Article 5</p>
                  )}
                  {currentRiskLevel === 'high' && (
                    <>
                      <p>• Obligations de conformité strictes applicables</p>
                      <p>• Documentation technique et évaluation CE requises</p>
                      <p>• Surveillance humaine obligatoire</p>
                    </>
                  )}
                  {currentRiskLevel === 'limited' && (
                    <>
                      <p>• Obligations de transparence applicables</p>
                      <p>• Information des utilisateurs requise</p>
                      <p>• Documentation technique recommandée</p>
                    </>
                  )}
                  {currentRiskLevel === 'minimal' && (
                    <>
                      <p>• Obligations limitées</p>
                      <p>• Bonnes pratiques d'IA éthique recommandées</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6 border-t border-border">
            <Button 
              type="button" 
              variant="outline"
              data-testid="button-save-draft"
            >
              Sauvegarder brouillon
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid() || isLoading}
              data-testid="button-submit-assessment"
            >
              {isLoading ? "Évaluation en cours..." : "Finaliser l'évaluation"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
