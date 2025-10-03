import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Smartphone, Key, Copy, CheckCircle, AlertTriangle } from 'lucide-react';

interface MFAStatus {
  isEnabled: boolean;
  hasBackupCodes: boolean;
  lastUsed?: string;
}

interface SetupData {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export default function MFASetup() {
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'complete'>('status');

  useEffect(() => {
    fetchMFAStatus();
  }, []);

  const fetchMFAStatus = async () => {
    try {
      const response = await fetch('/api/auth/mfa/status');
      if (response.ok) {
        const status = await response.json();
        setMfaStatus(status);
      }
    } catch (err) {
      setError('Erreur lors de la récupération du statut MFA');
    }
  };

  const startMFASetup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSetupData(data);
        setStep('setup');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors de la configuration MFA');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMFASetup = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Veuillez entrer un code à 6 chiffres');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/mfa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode })
      });
      
      if (response.ok) {
        setSuccess('MFA configuré avec succès !');
        setStep('complete');
        await fetchMFAStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Code de vérification invalide');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const disableMFA = async () => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver l\'authentification à deux facteurs ?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST'
      });
      
      if (response.ok) {
        setSuccess('MFA désactivé avec succès');
        await fetchMFAStatus();
        setStep('status');
      } else {
        setError('Erreur lors de la désactivation MFA');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copié dans le presse-papiers');
    setTimeout(() => setSuccess(''), 2000);
  };

  const renderMFAStatus = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Authentification à Deux Facteurs (MFA)
        </CardTitle>
        <CardDescription>
          Sécurisez votre compte avec une couche de protection supplémentaire
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {mfaStatus && (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${mfaStatus.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div>
                <p className="font-medium">
                  {mfaStatus.isEnabled ? 'MFA Activé' : 'MFA Désactivé'}
                </p>
                {mfaStatus.lastUsed && (
                  <p className="text-sm text-gray-500">
                    Dernière utilisation: {new Date(mfaStatus.lastUsed).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={mfaStatus.isEnabled ? 'default' : 'secondary'}>
              {mfaStatus.isEnabled ? 'Sécurisé' : 'Non sécurisé'}
            </Badge>
          </div>
        )}

        <div className="space-y-4">
          {!mfaStatus?.isEnabled ? (
            <Button 
              onClick={startMFASetup} 
              disabled={isLoading}
              className="w-full"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Configurer l'authentification à deux facteurs
            </Button>
          ) : (
            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('setup')}
                className="w-full"
              >
                Reconfigurer MFA
              </Button>
              <Button 
                variant="destructive" 
                onClick={disableMFA}
                disabled={isLoading}
                className="w-full"
              >
                Désactiver MFA
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderSetupStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Configuration de l'authentification à deux facteurs</CardTitle>
        <CardDescription>
          Scannez le code QR avec votre application d'authentification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {setupData && (
          <>
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg border inline-block">
                <img 
                  src={setupData.qrCode} 
                  alt="QR Code MFA" 
                  className="w-48 h-48"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Ou entrez manuellement cette clé secrète :</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={setupData.secret} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(setupData.secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label htmlFor="verification">Code de vérification</Label>
                <Input
                  id="verification"
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('status')}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={verifyMFASetup}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1"
                >
                  Vérifier et activer
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderCompleteStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          MFA Configuré avec Succès
        </CardTitle>
        <CardDescription>
          Votre compte est maintenant protégé par l'authentification à deux facteurs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {setupData?.backupCodes && (
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Codes de récupération :</p>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {setupData.backupCodes.map((code, index) => (
                    <div key={index} className="bg-gray-100 p-2 rounded">
                      {code}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-amber-600">
                  ⚠️ Conservez ces codes en lieu sûr. Ils vous permettront d'accéder à votre compte si vous perdez votre appareil.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={() => setStep('status')}
          className="w-full"
        >
          Terminer
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Sécurité du Compte</h1>
        <p className="text-gray-600">
          Gérez les paramètres de sécurité de votre compte AI Act Navigator
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="max-w-2xl mx-auto border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {step === 'status' && renderMFAStatus()}
      {step === 'setup' && renderSetupStep()}
      {step === 'complete' && renderCompleteStep()}
    </div>
  );
}
