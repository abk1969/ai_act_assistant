import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Shield, 
  ClipboardCheck, 
  Users, 
  Book, 
  AlertCircle,
  Download,
  Share2,
  Plus
} from "lucide-react";

export default function Documents() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/documents'],
  });

  const { data: aiSystems } = useQuery({
    queryKey: ['/api/ai-systems'],
  });

  const generateDocumentMutation = useMutation({
    mutationFn: async (data: { systemId: string; documentType: string; title: string }) => {
      const response = await apiRequest('POST', '/api/documents/generate', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document généré",
        description: "Le document a été créé avec succès",
      });
      setSelectedTemplate(null);
    },
    onError: (error) => {
      console.error('Document generation error:', error);
      toast({
        title: "Erreur de génération",
        description: "Impossible de générer le document. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  });

  const documentTemplates = [
    {
      id: "technical_documentation",
      title: "Documentation technique",
      description: "Article 11 - Documentation obligatoire pour systèmes à haut risque",
      icon: FileText,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      requirements: [
        "Description générale du système",
        "Éléments du système et processus", 
        "Surveillance et logs"
      ]
    },
    {
      id: "impact_assessment",
      title: "Évaluation d'impact",
      description: "Article 27 - Évaluation d'impact sur les droits fondamentaux",
      icon: Shield,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      requirements: [
        "Processus et finalités",
        "Catégories de personnes",
        "Mesures de mitigation"
      ]
    },
    {
      id: "conformity_declaration",
      title: "Déclaration de conformité",
      description: "Article 47 - Déclaration UE de conformité",
      icon: ClipboardCheck,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      requirements: [
        "Informations sur le fournisseur",
        "Système d'IA concerné",
        "Références normatives"
      ]
    },
    {
      id: "human_oversight_plan",
      title: "Plan de surveillance",
      description: "Article 14 - Surveillance humaine",
      icon: Users,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      requirements: [
        "Mesures de surveillance",
        "Responsabilités",
        "Procédures d'intervention"
      ]
    },
    {
      id: "usage_instructions",
      title: "Instructions d'usage",
      description: "Article 13 - Transparence et information",
      icon: Book,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      requirements: [
        "Conditions d'utilisation",
        "Limites et performances",
        "Formation requise"
      ]
    },
    {
      id: "incident_register",
      title: "Registre des incidents",
      description: "Article 62 - Signalement des dysfonctionnements",
      icon: AlertCircle,
      iconColor: "text-pink-600",
      bgColor: "bg-pink-50",
      requirements: [
        "Template de signalement",
        "Procédures internes",
        "Suivi correctionnel"
      ]
    }
  ];

  const handleGenerateDocument = (templateId: string) => {
    if (!aiSystems || aiSystems.length === 0) {
      toast({
        title: "Aucun système IA",
        description: "Veuillez d'abord créer un système IA pour générer des documents",
        variant: "destructive",
      });
      return;
    }

    // For demo, use the first AI system
    const systemId = aiSystems[0].id;
    const template = documentTemplates.find(t => t.id === templateId);
    
    if (template) {
      generateDocumentMutation.mutate({
        systemId,
        documentType: templateId,
        title: `${template.title} - ${aiSystems[0].name}`
      });
    }
  };

  return (
    <div className="p-8" data-testid="page-documents">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Génération de documentation
        </h2>
        <p className="text-muted-foreground">
          Templates de conformité automatisés
        </p>
      </div>

      {/* Document Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {documentTemplates.map((template, index) => {
          const Icon = template.icon;
          return (
            <Card 
              key={template.id} 
              className="hover:shadow-lg transition-shadow"
              data-testid={`template-${index}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 ${template.bgColor} rounded-lg`}>
                    <Icon className={`h-5 w-5 ${template.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-foreground">{template.title}</h3>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {template.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  {template.requirements.map((requirement, reqIndex) => (
                    <div key={reqIndex} className="text-xs text-muted-foreground">
                      • {requirement}
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => handleGenerateDocument(template.id)}
                  disabled={generateDocumentMutation.isPending}
                  data-testid={`button-generate-${template.id}`}
                >
                  {generateDocumentMutation.isPending ? (
                    "Génération..."
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Générer le document
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents récents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded"></div>
                    <div>
                      <div className="h-4 bg-muted rounded w-48 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-32"></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-muted rounded"></div>
                    <div className="w-8 h-8 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="divide-y divide-border">
              {documents.map((document: any, index: number) => (
                <div 
                  key={document.id} 
                  className="flex items-center justify-between p-4"
                  data-testid={`document-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{document.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Généré le {new Date(document.generatedAt).toLocaleDateString('fr-FR')} • 
                        <Badge variant="outline" className="ml-2">
                          {document.documentType}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      data-testid={`button-download-${index}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      data-testid={`button-share-${index}`}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aucun document généré. Créez votre premier document en utilisant un template ci-dessus.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
