import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { 
  Award, 
  Download, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  Plus,
  Eye,
  Search,
  Filter
} from 'lucide-react';

interface ComplianceCertificate {
  id: string;
  certificateNumber: string;
  certificateType: 'conformity' | 'risk_assessment' | 'maturity' | 'compliance_summary';
  status: 'valid' | 'expired' | 'revoked' | 'pending';
  organizationName: string;
  systemName?: string;
  riskLevel?: string;
  complianceScore?: number;
  maturityLevel?: string;
  issuedAt: string;
  validUntil: string;
  certificationCriteria: any;
  complianceDetails: any;
  certificateData: any;
  certificationHash?: string;
}

interface AiSystem {
  id: string;
  name: string;
  description?: string;
  riskLevel?: string;
}

interface MaturityAssessment {
  id: string;
  organizationName: string;
  overallMaturity?: string;
  overallScore?: number;
  completedAt: string;
}

export default function CertificatesPage() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<ComplianceCertificate | null>(null);
  
  // Form state for certificate generation
  const [generateForm, setGenerateForm] = useState({
    aiSystemId: '',
    maturityAssessmentId: '',
    certificateType: '',
    organizationName: ''
  });

  const { toast } = useToast();

  // Fetch certificates
  const { data: certificates = [], isLoading: certificatesLoading } = useQuery<ComplianceCertificate[]>({
    queryKey: ['/api/certificates'],
  });

  // Fetch AI systems for generation form
  const { data: aiSystems = [] } = useQuery<AiSystem[]>({
    queryKey: ['/api/ai-systems'],
  });

  // Fetch maturity assessments for generation form
  const { data: maturityAssessments = [] } = useQuery<MaturityAssessment[]>({
    queryKey: ['/api/maturity/assessments'],
  });

  // Generate certificate mutation
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/certificates/generate', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
      setGenerateDialogOpen(false);
      setGenerateForm({ aiSystemId: '', maturityAssessmentId: '', certificateType: '', organizationName: '' });
      toast({
        title: 'Certificat généré',
        description: 'Le certificat de conformité a été généré avec succès.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter certificates
  const filteredCertificates = certificates.filter((cert: ComplianceCertificate) => {
    const matchesType = selectedType === 'all' || cert.certificateType === selectedType;
    const matchesStatus = selectedStatus === 'all' || cert.status === selectedStatus;
    const matchesSearch = !searchQuery || 
      cert.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.systemName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  const getCertificateTypeLabel = (type: string) => {
    const labels = {
      'conformity': 'Déclaration de conformité',
      'risk_assessment': 'Certificat d\'évaluation des risques',
      'maturity': 'Certificat de maturité organisationnelle',
      'compliance_summary': 'Résumé de conformité'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'valid': 'bg-green-100 text-green-800',
      'expired': 'bg-yellow-100 text-yellow-800',
      'revoked': 'bg-red-100 text-red-800',
      'pending': 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'valid': CheckCircle,
      'expired': AlertTriangle,
      'revoked': XCircle,
      'pending': Clock
    };
    const Icon = icons[status as keyof typeof icons] || CheckCircle;
    return <Icon className="h-4 w-4" />;
  };

  const handleGenerateCertificate = () => {
    if (!generateForm.organizationName) {
      toast({
        title: 'Erreur',
        description: 'Le nom de l\'organisation est obligatoire.',
        variant: 'destructive',
      });
      return;
    }

    if (!generateForm.aiSystemId && !generateForm.maturityAssessmentId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins un système IA ou une évaluation de maturité.',
        variant: 'destructive',
      });
      return;
    }

    generateMutation.mutate({
      ...generateForm,
      maturityAssessmentId: generateForm.maturityAssessmentId || 'latest'
    });
  };

  const handleViewCertificate = (certificate: ComplianceCertificate) => {
    setSelectedCertificate(certificate);
    setViewDialogOpen(true);
  };

  const isExpired = (validUntil: string) => {
    return new Date() > new Date(validUntil);
  };

  if (certificatesLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="h-8 w-8 text-blue-600" />
            Certificats de Conformité
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestion et génération automatique des certificats de conformité EU AI Act
          </p>
        </div>

        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" data-testid="button-generate-certificate">
              <Plus className="h-4 w-4" />
              Générer un certificat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Générer un nouveau certificat</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">Nom de l'organisation *</Label>
                <Input
                  id="organizationName"
                  value={generateForm.organizationName}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, organizationName: e.target.value }))}
                  placeholder="Nom de votre organisation"
                  data-testid="input-organization-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiSystem">Système IA (optionnel)</Label>
                <Select 
                  value={generateForm.aiSystemId} 
                  onValueChange={(value) => setGenerateForm(prev => ({ ...prev, aiSystemId: value }))}
                >
                  <SelectTrigger data-testid="select-ai-system">
                    <SelectValue placeholder="Sélectionnez un système IA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun système IA</SelectItem>
                    {aiSystems.map((system: AiSystem) => (
                      <SelectItem key={system.id} value={system.id}>
                        {system.name} {system.riskLevel && `(${system.riskLevel})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maturityAssessment">Évaluation de maturité</Label>
                <Select 
                  value={generateForm.maturityAssessmentId} 
                  onValueChange={(value) => setGenerateForm(prev => ({ ...prev, maturityAssessmentId: value }))}
                >
                  <SelectTrigger data-testid="select-maturity-assessment">
                    <SelectValue placeholder="Sélectionnez une évaluation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune évaluation</SelectItem>
                    <SelectItem value="latest">Dernière évaluation</SelectItem>
                    {maturityAssessments.map((assessment: MaturityAssessment) => (
                      <SelectItem key={assessment.id} value={assessment.id}>
                        {assessment.organizationName} - {assessment.overallMaturity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificateType">Type de certificat</Label>
                <Select 
                  value={generateForm.certificateType} 
                  onValueChange={(value) => setGenerateForm(prev => ({ ...prev, certificateType: value }))}
                >
                  <SelectTrigger data-testid="select-certificate-type">
                    <SelectValue placeholder="Type automatique" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Type automatique</SelectItem>
                    <SelectItem value="conformity">Déclaration de conformité</SelectItem>
                    <SelectItem value="risk_assessment">Certificat d'évaluation des risques</SelectItem>
                    <SelectItem value="maturity">Certificat de maturité organisationnelle</SelectItem>
                    <SelectItem value="compliance_summary">Résumé de conformité</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleGenerateCertificate}
                  disabled={generateMutation.isPending}
                  data-testid="button-confirm-generate"
                >
                  {generateMutation.isPending ? 'Génération...' : 'Générer le certificat'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 min-w-0">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un certificat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
                data-testid="input-search-certificates"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48" data-testid="select-filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="conformity">Déclaration de conformité</SelectItem>
                  <SelectItem value="risk_assessment">Évaluation des risques</SelectItem>
                  <SelectItem value="maturity">Maturité organisationnelle</SelectItem>
                  <SelectItem value="compliance_summary">Résumé de conformité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32" data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="valid">Valide</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="revoked">Révoqué</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              {filteredCertificates.length} certificat{filteredCertificates.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Grid */}
      {filteredCertificates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun certificat trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {certificates.length === 0 
                ? "Vous n'avez pas encore de certificats de conformité."
                : "Aucun certificat ne correspond à vos critères de recherche."
              }
            </p>
            <Button onClick={() => setGenerateDialogOpen(true)} data-testid="button-generate-first">
              Générer votre premier certificat
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((certificate: ComplianceCertificate) => (
            <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      {certificate.certificateNumber}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {getCertificateTypeLabel(certificate.certificateType)}
                    </p>
                  </div>
                  <Badge className={getStatusColor(certificate.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(certificate.status)}
                      {certificate.status}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Organisation:</span>
                    <span className="font-medium">{certificate.organizationName}</span>
                  </div>
                  {certificate.systemName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Système:</span>
                      <span className="font-medium">{certificate.systemName}</span>
                    </div>
                  )}
                  {certificate.complianceScore && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Score:</span>
                      <span className="font-medium">{certificate.complianceScore}/100</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Émis le:</span>
                    <span>{new Date(certificate.issuedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valide jusqu'au:</span>
                    <span className={isExpired(certificate.validUntil) ? 'text-red-600' : ''}>
                      {new Date(certificate.validUntil).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewCertificate(certificate)}
                    data-testid={`button-view-certificate-${certificate.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    data-testid={`button-download-certificate-${certificate.id}`}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Certificate Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Certificat {selectedCertificate?.certificateNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCertificate && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Type de certificat</Label>
                  <p className="mt-1">{getCertificateTypeLabel(selectedCertificate.certificateType)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedCertificate.status)}>
                      {getStatusIcon(selectedCertificate.status)}
                      <span className="ml-1">{selectedCertificate.status}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Organisation</Label>
                  <p className="mt-1">{selectedCertificate.organizationName}</p>
                </div>
                {selectedCertificate.systemName && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Système IA</Label>
                    <p className="mt-1">{selectedCertificate.systemName}</p>
                  </div>
                )}
                {selectedCertificate.complianceScore && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Score de conformité</Label>
                    <p className="mt-1 text-lg font-semibold">{selectedCertificate.complianceScore}/100</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Période de validité</Label>
                  <p className="mt-1">
                    Du {new Date(selectedCertificate.issuedAt).toLocaleDateString('fr-FR')} au{' '}
                    <span className={isExpired(selectedCertificate.validUntil) ? 'text-red-600' : ''}>
                      {new Date(selectedCertificate.validUntil).toLocaleDateString('fr-FR')}
                    </span>
                  </p>
                </div>
              </div>

              <Tabs defaultValue="criteria" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="criteria">Critères évalués</TabsTrigger>
                  <TabsTrigger value="compliance">Détails de conformité</TabsTrigger>
                  <TabsTrigger value="technical">Informations techniques</TabsTrigger>
                </TabsList>
                
                <TabsContent value="criteria" className="space-y-4 mt-4">
                  <div>
                    <h4 className="font-medium mb-2">Domaines évalués</h4>
                    <div className="space-y-1">
                      {selectedCertificate.certificationCriteria?.evaluatedDomains?.map((domain: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{domain}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Vérifications de conformité</h4>
                    <div className="space-y-1">
                      {selectedCertificate.certificationCriteria?.complianceChecks?.map((check: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{check}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="compliance" className="space-y-4 mt-4">
                  <div>
                    <h4 className="font-medium mb-2">Statut global</h4>
                    <Badge className={getStatusColor(selectedCertificate.complianceDetails?.overallStatus || 'pending')}>
                      {selectedCertificate.complianceDetails?.overallStatus}
                    </Badge>
                  </div>
                  
                  {selectedCertificate.complianceDetails?.recommendations && (
                    <div>
                      <h4 className="font-medium mb-2">Recommandations</h4>
                      <div className="space-y-1">
                        {selectedCertificate.complianceDetails.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="technical" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Autorité de certification</Label>
                      <p className="mt-1">IA-ACT-NAVIGATOR</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Standard</Label>
                      <p className="mt-1">EU AI Act (Règlement UE 2024/1689)</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Hash de vérification</Label>
                      <p className="mt-1 font-mono text-xs">{selectedCertificate.certificationHash?.substring(0, 32)}...</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Prochaine révision</Label>
                      <p className="mt-1">
                        {selectedCertificate.complianceDetails?.nextReviewDate 
                          ? new Date(selectedCertificate.complianceDetails.nextReviewDate).toLocaleDateString('fr-FR')
                          : 'Non définie'
                        }
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Fermer
                </Button>
                <Button data-testid="button-download-full-certificate">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}