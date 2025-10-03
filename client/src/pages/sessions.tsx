import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  MapPin, 
  Clock, 
  Shield, 
  LogOut,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';

interface Session {
  id: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  deviceName: string;
  browser: string;
  operatingSystem: string;
  ipAddress: string;
  location: {
    city?: string;
    country?: string;
    region?: string;
  };
  isCurrentSession: boolean;
  lastActivity: string;
  createdAt: string;
  riskScore: number;
  userAgent: string;
}

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  highRiskSessions: number;
  lastActivity: string;
}

export default function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSessions();
    fetchSessionStats();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/auth/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        setError('Erreur lors de la récupération des sessions');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessionStats = async () => {
    try {
      const response = await fetch('/api/auth/sessions/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques');
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir révoquer cette session ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}/revoke`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setSuccess('Session révoquée avec succès');
        await fetchSessions();
        await fetchSessionStats();
      } else {
        setError('Erreur lors de la révocation de la session');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
  };

  const revokeAllOtherSessions = async () => {
    if (!confirm('Êtes-vous sûr de vouloir révoquer toutes les autres sessions ? Vous devrez vous reconnecter sur tous vos autres appareils.')) {
      return;
    }

    try {
      const response = await fetch('/api/auth/sessions/revoke-all-others', {
        method: 'POST'
      });
      
      if (response.ok) {
        setSuccess('Toutes les autres sessions ont été révoquées');
        await fetchSessions();
        await fetchSessionStats();
      } else {
        setError('Erreur lors de la révocation des sessions');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      case 'desktop':
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getRiskBadge = (riskScore: number) => {
    if (riskScore >= 7) {
      return <Badge variant="destructive">Risque Élevé</Badge>;
    } else if (riskScore >= 4) {
      return <Badge variant="secondary">Risque Modéré</Badge>;
    } else {
      return <Badge variant="default">Risque Faible</Badge>;
    }
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays} jour(s)`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Gestion des Sessions</h1>
        <p className="text-gray-600">
          Surveillez et gérez vos sessions actives sur AI Act Navigator
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

      {/* Statistiques des sessions */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sessions Totales</p>
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sessions Actives</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeSessions}</p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Risque Élevé</p>
                  <p className="text-2xl font-bold text-red-600">{stats.highRiskSessions}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Dernière Activité</p>
                  <p className="text-sm font-medium">{formatLastActivity(stats.lastActivity)}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions globales */}
      <Card>
        <CardHeader>
          <CardTitle>Actions de Sécurité</CardTitle>
          <CardDescription>
            Gérez la sécurité de toutes vos sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={revokeAllOtherSessions}
            className="w-full md:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Révoquer toutes les autres sessions
          </Button>
        </CardContent>
      </Card>

      {/* Liste des sessions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Sessions Actives</h2>
        
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Aucune session active trouvée</p>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} className={session.isCurrentSession ? 'border-blue-500 bg-blue-50' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{session.deviceName}</h3>
                        {session.isCurrentSession && (
                          <Badge variant="default">Session Actuelle</Badge>
                        )}
                        {getRiskBadge(session.riskScore)}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{session.browser} sur {session.operatingSystem}</p>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.location.city ? 
                              `${session.location.city}, ${session.location.country}` : 
                              session.ipAddress
                            }
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatLastActivity(session.lastActivity)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <p>Créée le {new Date(session.createdAt).toLocaleDateString()}</p>
                        <p>IP: {session.ipAddress}</p>
                      </div>
                    </div>
                  </div>
                  
                  {!session.isCurrentSession && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => revokeSession(session.id)}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Révoquer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
