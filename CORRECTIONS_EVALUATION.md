# Corrections du problème d'évaluation des risques

## Problème identifié
Le bouton "Lancer l'évaluation" se déclenchait automatiquement et tournait en boucle, empêchant l'utilisateur de contrôler le processus d'évaluation.

## Causes racines identifiées

### 1. Absence de timeouts
- **Problème** : Aucun timeout configuré pour les appels LLM
- **Impact** : Les appels LLM pouvaient ne jamais se terminer, causant un état de chargement permanent
- **Solution** : Ajout de timeouts à plusieurs niveaux

### 2. Détection de format incorrecte
- **Problème** : La logique `isFrameworkV3Format` ne détectait pas correctement le nouveau format
- **Impact** : Mauvaise classification entre format legacy et Framework v3.0
- **Solution** : Amélioration de la logique de détection

### 3. Gestion d'erreur insuffisante
- **Problème** : Pas de fallback en cas d'échec des appels LLM
- **Impact** : L'évaluation échouait sans alternative
- **Solution** : Ajout de fallbacks et gestion d'erreur robuste

## Corrections apportées

### 1. Service LLM (`server/services/llmService.ts`)
```typescript
// Ajout de timeout global avec Promise.race
const timeout = options?.timeout || 60000;
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => {
    reject(new Error(`LLM request timeout after ${timeout}ms`));
  }, timeout);
});

return await Promise.race([llmPromise, timeoutPromise]);
```

```typescript
// Ajout de timeouts pour fetch (Ollama, LM Studio)
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);
// ... fetch avec signal: controller.signal
```

### 2. Service d'évaluation (`server/services/assessmentService.ts`)
```typescript
// Amélioration de la détection de format
private isFrameworkV3Format(formData: any): boolean {
  const isV3 = formData.frameworkResponses !== undefined || 
               formData.organizationName !== undefined ||
               (formData.industrySector !== undefined && formData.sector === undefined) ||
               (formData.responses !== undefined && Object.keys(formData.responses).length > 0);
  return isV3;
}
```

```typescript
// Ajout de timeout spécifique pour l'évaluation
response = await llmService.generateResponse(prompt, userId, {
  systemPrompt,
  maxTokens: 2000,
  timeout: 90000 // 90 secondes pour l'évaluation
});
```

```typescript
// Ajout de fallback en cas d'échec LLM
try {
  aiAssessment = await this.generateAIAssessment(/*...*/);
} catch (error) {
  console.error('❌ AI assessment failed, using fallback:', error);
  aiAssessment = this.getFallbackAssessment(finalRiskLevel, formData);
}
```

### 3. Client React (`client/src/pages/assessment.tsx`)
```typescript
// Ajout de timeout côté client
const assessmentMutation = useMutation({
  mutationFn: async (data: AssessmentFormData) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Assessment timeout after 2 minutes'));
      }, 120000);
    });
    
    const apiPromise = (async () => {
      const response = await apiRequest('POST', '/api/assessments', data);
      return response.json();
    })();
    
    return await Promise.race([apiPromise, timeoutPromise]);
  },
  // ... gestion d'erreur améliorée
});
```

### 4. Logs de débogage
Ajout de logs détaillés pour tracer le processus :
- `🔍 Starting risk assessment`
- `📋 Step 1: EU AI Act Classification`
- `📊 Step 2: Framework v3.0 Assessment`
- `🤖 Calling LLM for assessment reasoning`
- `✅ Assessment completed successfully`

## Tests de validation

### Test automatique
```bash
node test-assessment-fix.js
```

### Test manuel
1. Démarrer le serveur : `npm run dev`
2. Aller sur la page d'évaluation
3. Remplir le formulaire
4. Cliquer sur "Lancer l'évaluation"
5. Vérifier :
   - Pas de déclenchement automatique
   - Évaluation terminée en < 2 minutes
   - Pas de boucle infinie
   - Logs visibles dans la console

## Logique métier EU AI Act respectée

### Classification EU AI Act (Tier 1)
- **Unacceptable** : Pratiques interdites (Article 5)
- **High Risk** : Domaines Annexe III + score ≥ 70
- **Limited Risk** : Obligations de transparence + score ≥ 40
- **Minimal Risk** : Reste des systèmes

### Framework Positive AI v3.0 (Tier 2)
- 7 dimensions évaluées
- Score pondéré 0-100
- Recommandations par dimension
- Plan d'action temporisé

### Combinaison des résultats
- EU AI Act prend la précédence pour la classification finale
- Framework v3.0 fournit les recommandations détaillées
- Score combiné = max(score EU AI Act, score Framework)

## Prochaines étapes recommandées

1. **Monitoring** : Surveiller les logs pour détecter d'éventuels timeouts
2. **Optimisation** : Réduire les timeouts si les performances s'améliorent
3. **Tests** : Ajouter des tests automatisés pour les scénarios de timeout
4. **Documentation** : Mettre à jour la documentation utilisateur

## Fichiers modifiés

- `server/services/llmService.ts` - Timeouts LLM
- `server/services/assessmentService.ts` - Détection format + fallbacks
- `client/src/pages/assessment.tsx` - Timeout client + logs
- `test-assessment-fix.js` - Script de test (nouveau)
- `CORRECTIONS_EVALUATION.md` - Documentation (nouveau)
