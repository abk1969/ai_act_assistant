# 🧪 Guide de test - Évaluation des risques IA

## 📌 Objectif
Vérifier que le bouton "Lancer l'évaluation" fonctionne correctement et ne se déclenche plus automatiquement.

## 🔍 Étapes de test détaillées

### Étape 1 : Accéder à l'application
1. Ouvrez votre navigateur (Chrome, Firefox, Edge)
2. Allez sur **http://localhost:5000**
3. Vous devriez voir la page d'accueil de l'application

### Étape 2 : Se connecter
1. Si vous n'avez pas de compte :
   - Cliquez sur "S'inscrire"
   - Remplissez le formulaire
   - Créez votre compte
2. Si vous avez déjà un compte :
   - Entrez vos identifiants
   - Cliquez sur "Se connecter"

### Étape 3 : Accéder à l'évaluation des risques
1. Dans le menu de navigation, cliquez sur **"Évaluation des risques"**
2. Vous devriez voir le formulaire d'évaluation avec plusieurs onglets :
   - Justice et équité
   - Transparence et explicabilité
   - Interaction humaine-IA
   - Impact social et environnemental
   - Responsabilité
   - Confidentialité et protection des données
   - Robustesse technique et sécurité

### Étape 4 : Remplir le formulaire

#### Informations générales (en haut)
- **Nom du système IA** : Ex: "Système de recommandation produits"
- **Secteur d'activité** : Choisissez dans la liste (ex: "Technologie et logiciels")
- **Cas d'usage principal** : Choisissez dans la liste (ex: "Systèmes de recommandation")

#### Pour chaque dimension (onglets)
1. Cliquez sur l'onglet de la dimension
2. Répondez à toutes les questions en sélectionnant une option
3. Observez la barre de progression qui se remplit
4. Passez à la dimension suivante

**⚠️ POINT DE VÉRIFICATION 1** :
- Le bouton "Lancer l'évaluation" ne doit **PAS** apparaître tant que vous n'avez pas répondu à toutes les questions
- Le bouton ne doit **PAS** se déclencher automatiquement

### Étape 5 : Lancer l'évaluation

Une fois toutes les questions répondues :
1. Le bouton **"Lancer l'évaluation"** devient actif (non grisé)
2. **IMPORTANT** : Le bouton ne doit **PAS** se cliquer tout seul
3. **VOUS** devez cliquer manuellement sur le bouton

**⚠️ POINT DE VÉRIFICATION 2** :
- Le bouton reste inactif jusqu'à ce que VOUS cliquiez dessus
- Aucun déclenchement automatique ne se produit

### Étape 6 : Observer le processus d'évaluation

Après avoir cliqué sur "Lancer l'évaluation" :

1. **Le bouton change** :
   - Texte : "Évaluation en cours..."
   - Le bouton devient grisé (désactivé)
   - Un indicateur de chargement peut apparaître

2. **Ouvrez la console du navigateur** (F12) :
   - Vous devriez voir des logs comme :
   ```
   🚀 Starting assessment for system: [Nom du système]
   ```

3. **Attendez la fin de l'évaluation** :
   - Durée normale : **30 secondes à 2 minutes**
   - Maximum : **2 minutes** (timeout automatique)

**⚠️ POINT DE VÉRIFICATION 3** :
- L'évaluation ne doit **PAS** tourner en boucle
- L'évaluation doit se terminer en **moins de 2 minutes**
- Vous devez voir un résultat ou un message d'erreur

### Étape 7 : Vérifier les résultats

Si l'évaluation réussit :
1. La page affiche les résultats :
   - **Niveau de risque** : Minimal / Limited / High / Unacceptable
   - **Score de risque** : 0-100
   - **Explication détaillée**
   - **Recommandations**
   - **Plan d'action**

2. Dans la console (F12), vous devriez voir :
   ```
   ✅ Assessment completed successfully
   ```

Si l'évaluation échoue :
1. Un message d'erreur s'affiche
2. Dans la console (F12), vous verrez le détail de l'erreur

**⚠️ POINT DE VÉRIFICATION 4** :
- Les résultats s'affichent correctement
- Pas de boucle infinie
- Pas de blocage de l'interface

## 🐛 Scénarios de test spécifiques

### Test 1 : Évaluation complète normale
**Objectif** : Vérifier le parcours complet

1. Remplissez toutes les questions avec des valeurs moyennes (50-75)
2. Cliquez sur "Lancer l'évaluation"
3. **Résultat attendu** : 
   - Évaluation terminée en < 1 minute
   - Niveau de risque : Limited ou High
   - Résultats affichés correctement

### Test 2 : Évaluation risque minimal
**Objectif** : Tester la classification "Minimal"

1. Remplissez toutes les questions avec des valeurs basses (0-25)
2. Cliquez sur "Lancer l'évaluation"
3. **Résultat attendu** :
   - Niveau de risque : Minimal
   - Score < 40

### Test 3 : Évaluation risque élevé
**Objectif** : Tester la classification "High"

1. Remplissez toutes les questions avec des valeurs élevées (75-100)
2. Cliquez sur "Lancer l'évaluation"
3. **Résultat attendu** :
   - Niveau de risque : High ou Unacceptable
   - Score ≥ 70

### Test 4 : Interruption et nouvelle évaluation
**Objectif** : Vérifier qu'on peut relancer une évaluation

1. Complétez une première évaluation
2. Cliquez sur "Nouvelle évaluation"
3. Remplissez à nouveau le formulaire
4. Cliquez sur "Lancer l'évaluation"
5. **Résultat attendu** :
   - Le formulaire se réinitialise
   - La nouvelle évaluation fonctionne normalement

## 📊 Logs à surveiller

### Console navigateur (F12 → Console)
```
🚀 Starting assessment for system: [Nom]
✅ Assessment completed successfully: {riskLevel: "high", ...}
```

### Logs Docker (dans le terminal)
```bash
docker logs [container-id] --tail 50 -f
```

Vous devriez voir :
```
🔍 Starting risk assessment for user: [userId]
📊 Assessment data: {...}
🆕 Using Framework v3.0 assessment
🔄 Starting combined assessment (EU AI Act + Framework v3.0)
📋 Step 1: EU AI Act Classification
✅ EU AI Act classification completed: high
📊 Step 2: Framework v3.0 Assessment
✅ Framework v3.0 assessment completed, score: 75
🔗 Step 3: Combining results
✅ Combined risk level: high score: 85
💭 Step 4: Generating reasoning (LLM call)
🤖 Calling LLM for assessment reasoning...
✅ LLM response received successfully
✅ Reasoning generated successfully
✅ AI assessment completed successfully
```

## ❌ Problèmes possibles et solutions

### Problème 1 : Le bouton reste grisé
**Symptôme** : Le bouton "Lancer l'évaluation" reste désactivé même après avoir rempli toutes les questions

**Solutions** :
1. Vérifiez que TOUTES les questions ont une réponse
2. Vérifiez la barre de progression (doit être à 100%)
3. Rafraîchissez la page (F5) et recommencez

### Problème 2 : Timeout après 2 minutes
**Symptôme** : Message "L'évaluation a pris trop de temps"

**Solutions** :
1. Vérifiez votre connexion internet
2. Vérifiez la configuration LLM dans "Paramètres"
3. Réessayez avec des données plus simples
4. Consultez les logs Docker pour voir l'erreur exacte

### Problème 3 : Erreur "Session expirée"
**Symptôme** : Message "Session expirée. Veuillez vous reconnecter"

**Solutions** :
1. Reconnectez-vous
2. Relancez l'évaluation

### Problème 4 : Erreur serveur (500)
**Symptôme** : Message "Erreur serveur"

**Solutions** :
1. Consultez les logs Docker : `docker logs [container-id]`
2. Vérifiez que le serveur est bien démarré
3. Vérifiez la configuration des variables d'environnement
4. Redémarrez le conteneur Docker si nécessaire

## ✅ Checklist de validation

Cochez chaque point après vérification :

- [ ] Le bouton ne se déclenche PAS automatiquement
- [ ] Le bouton reste inactif tant que le formulaire n'est pas complet
- [ ] L'évaluation se lance uniquement quand JE clique sur le bouton
- [ ] L'évaluation se termine en moins de 2 minutes
- [ ] Aucune boucle infinie n'est détectée
- [ ] Les résultats s'affichent correctement
- [ ] Les logs montrent la progression
- [ ] Je peux lancer plusieurs évaluations successives
- [ ] Les erreurs sont gérées proprement (pas de crash)
- [ ] L'interface reste réactive pendant l'évaluation

## 📞 Rapport de bug

Si vous rencontrez un problème, notez :
1. **Étape où le problème survient**
2. **Message d'erreur exact**
3. **Logs de la console navigateur** (F12)
4. **Logs Docker** (si accessible)
5. **Données du formulaire** (pour reproduire)

Partagez ces informations pour un diagnostic rapide.
