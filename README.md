# AI Act Assistant

Application de conformité pour le Règlement européen sur l'Intelligence Artificielle (EU AI Act).

## Fonctionnalités

- 🔐 Système d'authentification autonome avec email/mot de passe
- 📊 Évaluations de risque EU AI Act selon le Règlement (UE) 2024/1689
- 🎯 Classification automatique des systèmes d'IA (minimal, limité, haut risque, inacceptable)
- 📋 Framework technique v3.0 avec 7 dimensions d'évaluation
- 📈 Tableaux de bord de conformité et métriques temps réel
- 🤖 Intégration multi-LLM (OpenAI, Google Gemini, Anthropic Claude)

## Architecture Technique

**Stack technologique :**
- **Frontend :** React 18 + TypeScript + Vite
- **Backend :** Express.js + TypeScript
- **Base de données :** PostgreSQL avec Drizzle ORM
- **Authentification :** Système autonome avec sessions sécurisées
- **UI :** shadcn/ui + Tailwind CSS + Radix UI
- **État :** TanStack Query v5 pour le cache serveur
- **Formulaires :** React Hook Form + Zod validation

**Services métier :**
- `AssessmentService` - Évaluations de risque et classification EU AI Act
- `LLMService` - Gestion multi-fournisseurs d'IA avec fallback
- `ComplianceService` - Suivi de conformité et génération de matrices
- `RegulatoryService` - Surveillance des mises à jour réglementaires

## Installation et Développement

```bash
# Installation des dépendances
npm install

# Configuration de la base de données
npm run db:push

# Démarrage en développement
npm run dev
```

## Conformité EU AI Act

Cette application implémente une classification complète selon le Règlement (UE) 2024/1689 :

- **Article 5** - Pratiques interdites
- **Annexe III** - Systèmes à haut risque
- **Article 50** - Obligations de transparence
- **Articles 6-15** - Exigences pour systèmes haut risque

## Licence

Propriétaire - Développé avec ❤️ sur Replit
