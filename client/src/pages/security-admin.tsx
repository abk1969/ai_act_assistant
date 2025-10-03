import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  Eye,
  Lock,
  UserCheck,
  TrendingUp,
  Clock,
  Globe
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: 'login_success' | 'login_failure' | 'mfa_setup' | 'password_change' | 'session_revoked' | 'suspicious_activity';
  userId: string;
  userEmail: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    city?: string;
    country?: string;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  metadata?: Record<string, any>;
}

interface SecurityStats {
  totalUsers: number;
  activeUsers: number;
  mfaEnabledUsers: number;
  suspiciousActivities: number;
  failedLogins24h: number;
  successfulLogins24h: number;
  highRiskSessions: number;
  securityAlerts: number;
}

interface SecuritySettings {
  mfaRequired: boolean;
  mfaGracePeriodDays: number;
  passwordMinLength: number;
  passwordMaxLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordExpirationDays: number;
  passwordHistoryCount: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  sessionTimeoutMinutes: number;
  maxConcurrentSessions: number;
  enableCaptcha: boolean;
  captchaAfterAttempts: number;
  enableAuditLogging: boolean;
  auditLogRetentionDays: number;
  encryptionEnabled: boolean;
  enableSecurityAlerts: boolean;
  alertEmail: string;
}

export default function SecurityAdminDashboard() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [statsRes, eventsRes, settingsRes] = await Promise.all([
        fetch('/api/security/stats'),
        fetch('/api/security/events?limit=50'),
        fetch('/api/security/settings')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (err) {
      setError('Erreur lors du chargement des données de sécurité');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSecuritySettings = async (newSettings: Partial<SecuritySettings>) => {
    try {
      const response = await fetch('/api/security/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        setSuccess('Paramètres de sécurité mis à jour avec succès');
        await fetchSecurityData();
      } else {
        setError('Erreur lors de la mise à jour des paramètres');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login_success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'login_failure':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'mfa_setup':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'password_change':
        return <Lock className="h-4 w-4 text-orange-600" />;
      case 'session_revoked':
        return <UserCheck className="h-4 w-4 text-purple-600" />;
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>;
      case 'high':
        return <Badge variant="destructive">Élevé</Badge>;
      case 'medium':
        return <Badge variant="secondary">Modéré</Badge>;
      case 'low':
      default:
        return <Badge variant="default">Faible</Badge>;
    }
  };

  const formatEventDescription = (event: SecurityEvent) => {
    const baseDesc = event.description;
    const location = event.location ? `${event.location.city}, ${event.location.country}` : event.ipAddress;
    return `${baseDesc} depuis ${location}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement du dashboard de sécurité...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Dashboard de Sécurité</h1>
        <p className="text-gray-600">
          Surveillance et gestion de la sécurité AI Act Navigator
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="events">Événements</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistiques de sécurité */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Utilisateurs Totaux</p>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">MFA Activé</p>
                      <p className="text-2xl font-bold text-green-600">{stats.mfaEnabledUsers}</p>
                      <p className="text-xs text-gray-500">
                        {Math.round((stats.mfaEnabledUsers / stats.totalUsers) * 100)}% des utilisateurs
                      </p>
                    </div>
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Connexions Réussies (24h)</p>
                      <p className="text-2xl font-bold text-green-600">{stats.successfulLogins24h}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Tentatives Échouées (24h)</p>
                      <p className="text-2xl font-bold text-red-600">{stats.failedLogins24h}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Sessions à Risque</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.highRiskSessions}</p>
                    </div>
                    <Eye className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Activités Suspectes</p>
                      <p className="text-2xl font-bold text-red-600">{stats.suspiciousActivities}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Alertes Sécurité</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.securityAlerts}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Utilisateurs Actifs</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.activeUsers}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Événements récents */}
          <Card>
            <CardHeader>
              <CardTitle>Événements de Sécurité Récents</CardTitle>
              <CardDescription>
                Les 10 derniers événements de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getEventIcon(event.type)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{formatEventDescription(event)}</p>
                        {getRiskBadge(event.riskLevel)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{event.userEmail}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {event.ipAddress}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Journal des Événements de Sécurité</CardTitle>
              <CardDescription>
                Historique complet des événements de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    {getEventIcon(event.type)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{formatEventDescription(event)}</p>
                        {getRiskBadge(event.riskLevel)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <span>Utilisateur: {event.userEmail}</span>
                        <span>IP: {event.ipAddress}</span>
                        <span>Date: {new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                      {event.metadata && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-blue-600">Détails techniques</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
              <CardDescription>
                Vue d'ensemble des utilisateurs et de leur sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Fonctionnalité de gestion des utilisateurs en cours de développement...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {settings && (
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de Sécurité</CardTitle>
                <CardDescription>
                  Configuration des politiques de sécurité globales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Authentification Multi-Facteurs</h3>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mfa-required">MFA Obligatoire</Label>
                      <Switch
                        id="mfa-required"
                        checked={settings.mfaRequired}
                        onCheckedChange={(checked) => 
                          updateSecuritySettings({ mfaRequired: checked })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="mfa-grace">Période de grâce MFA (jours)</Label>
                      <Input
                        id="mfa-grace"
                        type="number"
                        value={settings.mfaGracePeriodDays}
                        onChange={(e) => 
                          updateSecuritySettings({ mfaGracePeriodDays: parseInt(e.target.value) })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Politique des Mots de Passe</h3>
                    <div>
                      <Label htmlFor="pwd-min">Longueur minimale</Label>
                      <Input
                        id="pwd-min"
                        type="number"
                        value={settings.passwordMinLength}
                        onChange={(e) => 
                          updateSecuritySettings({ passwordMinLength: parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="pwd-max">Longueur maximale</Label>
                      <Input
                        id="pwd-max"
                        type="number"
                        value={settings.passwordMaxLength}
                        onChange={(e) => 
                          updateSecuritySettings({ passwordMaxLength: parseInt(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={() => fetchSecurityData()}>
                  <Settings className="h-4 w-4 mr-2" />
                  Actualiser les Paramètres
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
