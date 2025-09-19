import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Bot, FileText, Eye, AlertTriangle, Scale } from "lucide-react";
import { AuthModal } from "@/components/auth";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">IA-ACT-NAVIGATOR</h1>
                <p className="text-xs text-muted-foreground">Conformité au Règlement (UE) 2024/1689</p>
              </div>
            </div>
            
            <AuthModal>
              <Button data-testid="button-login">
                Se connecter
              </Button>
            </AuthModal>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Plateforme de Conformité <span className="text-primary">EU AI Act</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Évaluez, documentez et maintenez la conformité de vos systèmes d'intelligence artificielle 
            selon le Règlement (UE) 2024/1689 avec notre plateforme experte.
          </p>
          
          {/* Legal Warning */}
          <Alert className="max-w-2xl mx-auto mb-12 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-left">
              <strong>Avertissement juridique :</strong> Cette plateforme constitue un outil d'aide à la décision 
              et ne constitue en aucun cas un conseil juridique professionnel ou une certification officielle de conformité.
            </AlertDescription>
          </Alert>

          <AuthModal>
            <Button 
              size="lg"
              className="mb-16"
              data-testid="button-get-started"
            >
              Commencer l'évaluation
            </Button>
          </AuthModal>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Scale className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Évaluation des risques</CardTitle>
              <CardDescription>
                Questionnaire basé sur le Technical Framework v3.0 pour classifier automatiquement vos systèmes IA
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Conformité automatisée</CardTitle>
              <CardDescription>
                Tableau de bord de conformité avec obligations par catégorie de risque et suivi des actions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Documentation générée</CardTitle>
              <CardDescription>
                Templates automatiques pour la documentation technique, DPIA, et déclarations de conformité
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Base réglementaire</CardTitle>
              <CardDescription>
                Accès complet aux articles du Règlement EU AI Act avec recherche avancée et explications
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Veille réglementaire</CardTitle>
              <CardDescription>
                Surveillance automatique des mises à jour officielles (Commission UE, DGCCRF, CNIL)
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>IA configurable</CardTitle>
              <CardDescription>
                Support multi-LLM avec API managées (GPT-5, Gemini, Claude) et modèles locaux (Ollama, LM Studio)
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Authorities Section */}
        <section className="mt-20 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Conformité aux autorités françaises</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="font-medium text-sm">DGCCRF</p>
              <p className="text-xs text-muted-foreground">Surveillance marché</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="font-medium text-sm">CNIL</p>
              <p className="text-xs text-muted-foreground">Protection données</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow">
              <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
              <p className="font-medium text-sm">Commission UE</p>
              <p className="text-xs text-muted-foreground">AI Office</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow">
              <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto mb-2"></div>
              <p className="font-medium text-sm">ANSSI</p>
              <p className="text-xs text-muted-foreground">Cybersécurité</p>
            </div>
          </div>
        </section>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 IA-ACT-NAVIGATOR • Règlement (UE) 2024/1689 • Version 2.0.0
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Référence réglementaire : Technical Framework v3.0 - Positive AI (5 juin 2024)
          </p>
        </div>
      </footer>
    </div>
  );
}
