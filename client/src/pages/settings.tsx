import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bot, 
  Key, 
  Server, 
  Database,
  Edit,
  Save,
  Plus,
  Info,
  CheckCircle,
  XCircle,
  Download,
  Fan
} from "lucide-react";

export default function Settings() {
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [apiKeyValues, setApiKeyValues] = useState<{ [key: string]: string }>({});
  const [primaryModel, setPrimaryModel] = useState("gemini-2.5-flash");
  const [fallbackModel, setFallbackModel] = useState("mistral-large-latest");
  const [temperature, setTemperature] = useState([30]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: llmSettings, isLoading } = useQuery({
    queryKey: ['/api/llm/settings'],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/llm/settings', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/llm/settings'] });
      toast({
        title: "Paramètres sauvegardés",
        description: "Configuration LLM mise à jour avec succès",
      });
      setEditingProvider(null);
      setApiKeyValues({});
    },
    onError: (error) => {
      console.error('Settings update error:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    }
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest('POST', '/api/llm/test-connection', { provider });
      return response.json();
    },
    onSuccess: (data, provider) => {
      toast({
        title: data.connected ? "Connexion réussie" : "Connexion échouée",
        description: data.connected 
          ? `${provider} est correctement configuré`
          : `Impossible de se connecter à ${provider}`,
        variant: data.connected ? "default" : "destructive",
      });
    }
  });

  const handleSaveApiKey = (provider: string) => {
    const apiKey = apiKeyValues[provider];
    if (!apiKey) {
      toast({
        title: "Clé API manquante",
        description: "Veuillez saisir une clé API valide",
        variant: "destructive",
      });
      return;
    }

    updateSettingsMutation.mutate({
      provider: provider.toLowerCase(),
      apiKey,
      isActive: true,
      model: getDefaultModelForProvider(provider),
      temperature: temperature[0],
    });
  };

  const getDefaultModelForProvider = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return 'gpt-5';
      case 'google':
        return 'gemini-2.5-flash';
      case 'anthropic':
        return 'claude-sonnet-4-20250514';
      case 'mistral':
        return 'mistral-large-latest';
      default:
        return 'gpt-5';
    }
  };

  const getProviderStatus = (provider: string) => {
    const setting = Array.isArray(llmSettings) ? llmSettings.find((s: any) => s.provider.toLowerCase() === provider.toLowerCase()) : null;
    if (!setting) return { status: 'not_configured', color: 'bg-gray-400' };
    if (setting.apiKey && setting.isActive) return { status: 'active', color: 'bg-green-500' };
    if (setting.apiKey) return { status: 'configured', color: 'bg-yellow-500' };
    return { status: 'not_configured', color: 'bg-gray-400' };
  };

  const providers = [
    { name: 'Google AI', key: 'google', configured: true },
    { name: 'OpenAI', key: 'openai', configured: true },
    { name: 'Mistral AI', key: 'mistral', configured: false },
    { name: 'Anthropic', key: 'anthropic', configured: false },
  ];

  return (
    <div className="p-8" data-testid="page-settings">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Paramètres</h2>
        <p className="text-muted-foreground">Configuration LLM et gestion des API</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LLM Configuration */}
        <Card data-testid="card-llm-config">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Configuration des modèles LLM
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="primary-model">Modèle principal</Label>
              <Select value={primaryModel} onValueChange={setPrimaryModel}>
                <SelectTrigger data-testid="select-primary-model">
                  <SelectValue placeholder="Sélectionner un modèle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.5-flash">Google Gemini Flash 2.5</SelectItem>
                  <SelectItem value="gpt-5">GPT-5</SelectItem>
                  <SelectItem value="mistral-large-latest">Mistral Large</SelectItem>
                  <SelectItem value="qwen-2.5">Qwen 2.5</SelectItem>
                  <SelectItem value="deepseek-v3">DeepSeek V3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fallback-model">Modèle de secours</Label>
              <Select value={fallbackModel} onValueChange={setFallbackModel}>
                <SelectTrigger data-testid="select-fallback-model">
                  <SelectValue placeholder="Sélectionner un modèle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-5">GPT-5</SelectItem>
                  <SelectItem value="mistral-large-latest">Mistral Large</SelectItem>
                  <SelectItem value="qwen-2.5">Qwen 2.5</SelectItem>
                  <SelectItem value="deepseek-v3">DeepSeek V3</SelectItem>
                  <SelectItem value="none">Aucun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="temperature">Température</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  value={temperature}
                  onValueChange={setTemperature}
                  max={100}
                  min={0}
                  step={10}
                  className="flex-1"
                  data-testid="slider-temperature"
                />
                <span className="text-sm text-muted-foreground w-12">
                  {(temperature[0] / 100).toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Plus faible = plus précis, plus élevé = plus créatif
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Keys Management */}
        <Card data-testid="card-api-keys">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Gestion des clés API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {providers.map((provider, index) => {
              const status = getProviderStatus(provider.key);
              const isEditing = editingProvider === provider.key;
              
              return (
                <div 
                  key={provider.key} 
                  className="p-4 border border-border rounded-lg"
                  data-testid={`provider-${provider.key}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${status.color} rounded-full`}></div>
                      <span className="font-medium text-foreground">{provider.name}</span>
                    </div>
                    <Badge 
                      className={
                        status.status === 'active' ? 'bg-green-50 text-green-800' :
                        status.status === 'configured' ? 'bg-yellow-50 text-yellow-800' :
                        'bg-gray-50 text-gray-800'
                      }
                    >
                      {status.status === 'active' ? 'Active' :
                       status.status === 'configured' ? 'Configuré' :
                       'Non configuré'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Input
                          type="password"
                          placeholder="Entrer la clé API..."
                          value={apiKeyValues[provider.key] || ''}
                          onChange={(e) => setApiKeyValues({
                            ...apiKeyValues,
                            [provider.key]: e.target.value
                          })}
                          className="flex-1"
                          data-testid={`input-api-key-${provider.key}`}
                        />
                        <Button 
                          size="icon"
                          onClick={() => handleSaveApiKey(provider.key)}
                          disabled={updateSettingsMutation.isPending}
                          data-testid={`button-save-${provider.key}`}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingProvider(null);
                            setApiKeyValues({});
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input
                          type="password"
                          value={status.status !== 'not_configured' ? '••••••••••••••••' : ''}
                          placeholder="Non configuré"
                          className="flex-1"
                          readOnly
                          disabled={status.status === 'not_configured'}
                        />
                        <Button 
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingProvider(provider.key)}
                          data-testid={`button-edit-${provider.key}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {status.status === 'active' && (
                          <Button 
                            size="icon"
                            variant="ghost"
                            onClick={() => testConnectionMutation.mutate(provider.key)}
                            disabled={testConnectionMutation.isPending}
                            data-testid={`button-test-${provider.key}`}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Local LLM Integration */}
        <Card data-testid="card-local-llm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Modèles locaux
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Ollama</Label>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">En ligne</span>
                </div>
              </div>
              <Input
                type="url"
                value="http://localhost:11434"
                className="mb-2"
                readOnly
                data-testid="input-ollama-endpoint"
              />
              <Select defaultValue="llama3.2:latest">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llama3.2:latest">llama3.2:latest</SelectItem>
                  <SelectItem value="mistral:7b">mistral:7b</SelectItem>
                  <SelectItem value="codellama:13b">codellama:13b</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>LM Studio</Label>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-red-600">Hors ligne</span>
                </div>
              </div>
              <Input
                type="url"
                value="http://localhost:1234/v1"
                className="mb-1"
                readOnly
                data-testid="input-lmstudio-endpoint"
              />
              <p className="text-xs text-muted-foreground">
                Démarrez LM Studio avec un serveur local
              </p>
            </div>

            <Alert className="border-yellow-200 bg-yellow-50">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <p className="font-medium">Confidentialité des données</p>
                <p className="text-xs mt-1">
                  Les modèles locaux permettent de traiter les données sensibles 
                  sans les envoyer vers des services externes.
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card data-testid="card-database">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Base de données
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">PostgreSQL</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">Connecté</span>
                </div>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Host: localhost:5432</p>
                <p>Base: ia_act_navigator</p>
                <p>Version: PostgreSQL 16.1</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stockage utilisé</span>
                <span className="font-medium text-foreground">1.2 GB / 10 GB</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                data-testid="button-backup"
              >
                <Download className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                data-testid="button-optimize"
              >
                <Fan className="h-4 w-4 mr-2" />
                Optimiser
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
