/**
 * AI Act Indexing Service
 * Intelligent indexing and enrichment of EU AI Act regulatory database
 */

import { storage } from "../storage";
import { aiActArticlesData } from "../data/aiActArticlesData";

interface ArticleEnrichment {
  articleNumber: string;
  title: string;
  content: string;
  chapter: string;
  riskCategory: string | null;
  effectiveDate: Date;
  keywords: string[];
  relatedArticles?: string[];
  practicalExamples?: string[];
  complianceChecklist?: string[];
  sanctions?: string;
}

class AIActIndexingService {
  /**
   * Complete reindexing of the AI Act database
   */
  async reindexDatabase(): Promise<{
    indexed: number;
    updated: number;
    errors: string[];
  }> {
    console.log('🔄 Starting complete AI Act database reindexing...');
    
    const result = {
      indexed: 0,
      updated: 0,
      errors: [] as string[]
    };

    try {
      // Get existing articles
      const existingArticles = await storage.getAiActArticles();
      const existingArticleNumbers = new Set(existingArticles.map(a => a.articleNumber));

      // Index all articles from data source
      for (const articleData of aiActArticlesData) {
        try {
          const enrichedArticle = await this.enrichArticle(articleData);
          
          if (existingArticleNumbers.has(articleData.articleNumber)) {
            // Update existing article
            await this.updateArticle(enrichedArticle);
            result.updated++;
          } else {
            // Create new article
            await storage.createAiActArticle(enrichedArticle);
            result.indexed++;
          }
        } catch (error) {
          const errorMsg = `Failed to index article ${articleData.articleNumber}: ${error}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      console.log(`✅ Reindexing complete: ${result.indexed} new, ${result.updated} updated`);
      
    } catch (error) {
      console.error('❌ Reindexing failed:', error);
      result.errors.push(`Global error: ${error}`);
    }

    return result;
  }

  /**
   * Enrich article with intelligent metadata
   */
  private async enrichArticle(article: any): Promise<any> {
    const enriched = {
      ...article,
      relatedArticles: this.findRelatedArticles(article),
      practicalExamples: this.generatePracticalExamples(article),
      complianceChecklist: this.generateComplianceChecklist(article),
      sanctions: this.determineSanctions(article)
    };

    return enriched;
  }

  /**
   * Find related articles based on content and keywords
   */
  private findRelatedArticles(article: any): string[] {
    const related: string[] = [];

    // Logic to find related articles
    if (article.riskCategory === 'high') {
      related.push('Article 9', 'Article 10', 'Article 11', 'Article 14');
    }
    
    if (article.keywords.includes('transparence')) {
      related.push('Article 50', 'Article 52', 'Article 13');
    }

    if (article.keywords.includes('données')) {
      related.push('Article 10', 'RGPD Article 5');
    }

    if (article.keywords.includes('biométrie')) {
      related.push('Article 5.1.f', 'Article 52');
    }

    return Array.from(new Set(related)).filter(r => r !== article.articleNumber);
  }

  /**
   * Generate practical examples for each article
   */
  private generatePracticalExamples(article: any): string[] {
    const examples: string[] = [];

    switch (article.articleNumber) {
      case 'Article 5':
        examples.push(
          "❌ Interdit: Application de notation sociale généralisée par une municipalité",
          "❌ Interdit: Système de manipulation subliminale dans la publicité ciblée",
          "❌ Interdit: Exploitation de vulnérabilités d'enfants pour influencer leurs achats"
        );
        break;

      case 'Article 6':
        examples.push(
          "✅ Haut risque: Système de recrutement automatisé pour sélection de candidats",
          "✅ Haut risque: IA de diagnostic médical pour détection de maladies",
          "✅ Haut risque: Système de notation de crédit automatisé"
        );
        break;

      case 'Article 9':
        examples.push(
          "📋 Documenter tous les risques identifiés dans un registre",
          "📋 Mettre en place des mesures de mitigation pour chaque risque",
          "📋 Réviser le système de gestion des risques à chaque mise à jour majeure"
        );
        break;

      case 'Article 10':
        examples.push(
          "📊 Vérifier la représentativité des données d'entraînement",
          "📊 Documenter les sources et la qualité des datasets",
          "📊 Tester les biais potentiels sur des groupes sous-représentés"
        );
        break;

      case 'Article 14':
        examples.push(
          "👤 Prévoir un bouton d'arrêt d'urgence accessible",
          "👤 Former les superviseurs humains aux limites du système",
          "👤 Définir des seuils de confiance pour intervention humaine"
        );
        break;

      case 'Article 50':
        examples.push(
          "💬 Chatbot: Afficher clairement 'Vous parlez avec une IA'",
          "💬 Assistant virtuel: Indiquer les capacités et limites du système",
          "💬 Deepfake: Marquer tout contenu généré par IA"
        );
        break;

      default:
        examples.push(
          `Consulter la documentation officielle pour l'article ${article.articleNumber}`,
          "Contacter votre autorité nationale compétente pour guidance",
          "Réaliser une évaluation de conformité avec un expert certifié"
        );
    }

    return examples;
  }

  /**
   * Generate compliance checklist for each article
   */
  private generateComplianceChecklist(article: any): string[] {
    const checklist: string[] = [];

    if (article.riskCategory === 'high') {
      checklist.push(
        "☐ Système de gestion des risques documenté (Art. 9)",
        "☐ Gouvernance des données conforme (Art. 10)",
        "☐ Documentation technique complète (Art. 11)",
        "☐ Capacités de logging automatique (Art. 12)",
        "☐ Instructions d'utilisation claires (Art. 13)",
        "☐ Mesures de surveillance humaine (Art. 14)",
        "☐ Tests d'exactitude et robustesse (Art. 15)",
        "☐ Évaluation de conformité réalisée",
        "☐ Déclaration UE de conformité signée",
        "☐ Marquage CE apposé"
      );
    }

    if (article.riskCategory === 'unacceptable') {
      checklist.push(
        "☐ Vérifier que le système ne tombe pas sous pratiques interdites",
        "☐ Documenter l'analyse de conformité à l'Article 5",
        "☐ Obtenir validation juridique avant déploiement",
        "☐ Prévoir plan de retrait si non-conformité détectée"
      );
    }

    if (article.keywords.includes('transparence')) {
      checklist.push(
        "☐ Informations claires fournies aux utilisateurs",
        "☐ Mécanismes de transparence implémentés",
        "☐ Documentation utilisateur accessible",
        "☐ Formation des utilisateurs déployeurs"
      );
    }

    if (article.keywords.includes('données')) {
      checklist.push(
        "☐ Conformité RGPD vérifiée",
        "☐ Analyse d'impact RGPD (DPIA) réalisée si nécessaire",
        "☐ Registre des traitements à jour",
        "☐ Mesures de sécurité des données en place"
      );
    }

    return checklist.length > 0 ? checklist : [
      "☐ Lire attentivement l'article et ses implications",
      "☐ Identifier les obligations applicables à votre système",
      "☐ Documenter les mesures de conformité mises en place",
      "☐ Prévoir des audits réguliers de conformité"
    ];
  }

  /**
   * Determine applicable sanctions for non-compliance
   */
  private determineSanctions(article: any): string {
    if (article.riskCategory === 'unacceptable') {
      return "⚠️ SANCTIONS MAXIMALES: Jusqu'à 35 000 000 EUR ou 7% du CA mondial annuel (montant le plus élevé). Interdiction de mise sur le marché.";
    }

    if (article.riskCategory === 'high') {
      return "⚠️ SANCTIONS ÉLEVÉES: Jusqu'à 15 000 000 EUR ou 3% du CA mondial annuel pour non-conformité aux obligations. Retrait du marché possible.";
    }

    if (article.keywords.includes('transparence') || article.riskCategory === 'limited') {
      return "⚠️ SANCTIONS MODÉRÉES: Jusqu'à 7 500 000 EUR ou 1,5% du CA mondial annuel pour manquement aux obligations de transparence.";
    }

    return "⚠️ SANCTIONS: Amendes administratives proportionnées et dissuasives selon la gravité de l'infraction (Article 99).";
  }

  /**
   * Update existing article with enriched data
   */
  private async updateArticle(enrichedArticle: any): Promise<void> {
    // In a real implementation, this would update the database
    // For now, we'll use the create method which handles upserts
    await storage.createAiActArticle(enrichedArticle);
  }

  /**
   * Search articles with advanced filtering
   */
  async advancedSearch(params: {
    query?: string;
    category?: string;
    riskLevel?: string;
    chapter?: string;
    keywords?: string[];
  }): Promise<any[]> {
    let articles = await storage.getAiActArticles();

    // Filter by search query
    if (params.query) {
      const query = params.query.toLowerCase();
      articles = articles.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.articleNumber.toLowerCase().includes(query)
      );
    }

    // Filter by category/risk level
    if (params.category && params.category !== 'all') {
      const categoryMap: Record<string, string | null> = {
        'prohibited': 'unacceptable',
        'high_risk': 'high',
        'transparency': 'limited',
        'minimal': 'minimal'
      };
      
      const riskCategory = categoryMap[params.category];
      articles = articles.filter(article => article.riskCategory === riskCategory);
    }

    // Filter by chapter
    if (params.chapter) {
      articles = articles.filter(article =>
        article.chapter?.toLowerCase().includes(params.chapter!.toLowerCase())
      );
    }

    return articles;
  }

  /**
   * Get statistics about the regulatory database
   */
  async getDatabaseStatistics(): Promise<{
    totalArticles: number;
    byRiskCategory: Record<string, number>;
    byChapter: Record<string, number>;
    lastUpdated: Date;
  }> {
    const articles = await storage.getAiActArticles();

    const stats = {
      totalArticles: articles.length,
      byRiskCategory: {} as Record<string, number>,
      byChapter: {} as Record<string, number>,
      lastUpdated: new Date()
    };

    // Count by risk category
    articles.forEach(article => {
      const category = article.riskCategory || 'other';
      stats.byRiskCategory[category] = (stats.byRiskCategory[category] || 0) + 1;
    });

    // Count by chapter
    articles.forEach(article => {
      const chapter = article.chapter || 'other';
      stats.byChapter[chapter] = (stats.byChapter[chapter] || 0) + 1;
    });

    return stats;
  }
}

export const aiActIndexingService = new AIActIndexingService();

