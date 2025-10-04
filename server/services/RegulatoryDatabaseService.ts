/**
 * Professional Regulatory Database Service
 * Inspired by artificialintelligenceact.eu and enterprise AI compliance platforms
 */

import { completeAiActArticles, aiActStructure, type CompleteArticle } from '../data/completeAiActDatabase.js';
import { additionalArticles } from '../data/additionalAiActArticles.js';

export interface SearchFilters {
  query?: string;
  riskCategory?: 'unacceptable' | 'high' | 'limited' | 'minimal' | null;
  applicableTo?: string[];
  titleNumber?: string;
  chapterNumber?: string;
  keywords?: string[];
  effectiveDateFrom?: Date;
  effectiveDateTo?: Date;
}

export interface SearchResult {
  article: CompleteArticle;
  relevanceScore: number;
  matchedFields: string[];
  highlightedContent?: string;
}

export interface ArticleStats {
  totalArticles: number;
  byRiskCategory: Record<string, number>;
  byTitle: Record<string, number>;
  byApplicability: Record<string, number>;
  upcomingDeadlines: Array<{ date: Date; articleCount: number; description: string }>;
}

class RegulatoryDatabaseService {
  private articles: CompleteArticle[];
  private searchIndex: Map<string, Set<string>>; // keyword -> article numbers

  constructor() {
    // Combiner tous les articles (base + additionnels)
    this.articles = [...completeAiActArticles, ...additionalArticles];
    this.searchIndex = this.buildSearchIndex();
  }

  /**
   * Build inverted index for fast full-text search
   */
  private buildSearchIndex(): Map<string, Set<string>> {
    const index = new Map<string, Set<string>>();

    this.articles.forEach(article => {
      const tokens = this.tokenize([
        article.title,
        article.content,
        ...article.keywords,
        ...article.obligations
      ].join(' '));

      tokens.forEach(token => {
        if (!index.has(token)) {
          index.set(token, new Set());
        }
        index.get(token)!.add(article.articleNumber);
      });
    });

    return index;
  }

  /**
   * Tokenize text for search indexing
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .split(/\W+/)
      .filter(token => token.length > 2); // Ignore very short words
  }

  /**
   * Advanced search with multiple filters and ranking
   */
  async search(filters: SearchFilters): Promise<SearchResult[]> {
    let results = [...this.articles];
    console.log('🔍 Search filters received:', JSON.stringify(filters, null, 2));
    console.log('📊 Total articles before filtering:', results.length);

    // Apply filters
    if (filters.riskCategory) {
      console.log('🎯 Filtering by riskCategory:', filters.riskCategory);
      console.log('📋 Sample article riskCategories:', results.slice(0, 5).map(a => ({
        article: a.articleNumber,
        riskCategory: a.riskCategory
      })));
      results = results.filter(a => a.riskCategory === filters.riskCategory);
      console.log('✅ Articles after riskCategory filter:', results.length);
    }

    if (filters.titleNumber) {
      results = results.filter(a => a.titleNumber === filters.titleNumber);
    }

    if (filters.chapterNumber) {
      results = results.filter(a => a.chapterNumber === filters.chapterNumber);
    }

    if (filters.applicableTo && filters.applicableTo.length > 0) {
      results = results.filter(a =>
        filters.applicableTo!.some(role => a.applicableTo.includes(role))
      );
    }

    if (filters.keywords && filters.keywords.length > 0) {
      results = results.filter(a =>
        filters.keywords!.some(kw =>
          a.keywords.some(articleKw =>
            articleKw.toLowerCase().includes(kw.toLowerCase())
          )
        )
      );
    }

    if (filters.effectiveDateFrom) {
      results = results.filter(a => a.effectiveDate >= filters.effectiveDateFrom!);
    }

    if (filters.effectiveDateTo) {
      results = results.filter(a => a.effectiveDate <= filters.effectiveDateTo!);
    }

    // Full-text search with ranking
    if (filters.query) {
      const queryTokens = this.tokenize(filters.query);
      const scoredResults = results.map(article => {
        const score = this.calculateRelevanceScore(article, queryTokens, filters.query!);
        const matchedFields = this.getMatchedFields(article, queryTokens);
        const highlightedContent = this.highlightMatches(article.content, filters.query!);

        return {
          article,
          relevanceScore: score,
          matchedFields,
          highlightedContent
        };
      });

      // Filter out zero-score results and sort by relevance
      return scoredResults
        .filter(r => r.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    // Return all filtered results with default score
    return results.map(article => ({
      article,
      relevanceScore: 1,
      matchedFields: [],
      highlightedContent: article.content.substring(0, 300) + '...'
    }));
  }

  /**
   * Calculate relevance score for search ranking
   */
  private calculateRelevanceScore(article: CompleteArticle, queryTokens: string[], originalQuery: string): number {
    let score = 0;

    // Exact match in title (highest weight)
    if (article.title.toLowerCase().includes(originalQuery.toLowerCase())) {
      score += 100;
    }

    // Exact match in article number
    if (article.articleNumber.toLowerCase().includes(originalQuery.toLowerCase())) {
      score += 80;
    }

    // Token matches in different fields (weighted)
    queryTokens.forEach(token => {
      if (article.title.toLowerCase().includes(token)) score += 10;
      if (article.content.toLowerCase().includes(token)) score += 5;
      if (article.keywords.some(kw => kw.toLowerCase().includes(token))) score += 8;
      if (article.obligations.some(ob => ob.toLowerCase().includes(token))) score += 7;
    });

    // Boost for high-risk articles (often more important)
    if (article.riskCategory === 'high') score *= 1.2;
    if (article.riskCategory === 'unacceptable') score *= 1.3;

    return score;
  }

  /**
   * Identify which fields matched the search query
   */
  private getMatchedFields(article: CompleteArticle, queryTokens: string[]): string[] {
    const matched: string[] = [];

    queryTokens.forEach(token => {
      if (article.title.toLowerCase().includes(token) && !matched.includes('title')) {
        matched.push('title');
      }
      if (article.content.toLowerCase().includes(token) && !matched.includes('content')) {
        matched.push('content');
      }
      if (article.keywords.some(kw => kw.toLowerCase().includes(token)) && !matched.includes('keywords')) {
        matched.push('keywords');
      }
      if (article.obligations.some(ob => ob.toLowerCase().includes(token)) && !matched.includes('obligations')) {
        matched.push('obligations');
      }
    });

    return matched;
  }

  /**
   * Highlight search terms in content
   */
  private highlightMatches(content: string, query: string): string {
    const maxLength = 500;
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();

    // Find first occurrence
    const index = contentLower.indexOf(queryLower);

    if (index === -1) {
      return content.substring(0, maxLength) + '...';
    }

    // Extract context around match
    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + query.length + 400);

    let excerpt = content.substring(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';

    // Highlight the match (using markers that frontend can style)
    const regex = new RegExp(`(${query})`, 'gi');
    return excerpt.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Get article by number
   */
  async getArticleByNumber(articleNumber: string): Promise<CompleteArticle | null> {
    return this.articles.find(a => a.articleNumber === articleNumber) || null;
  }

  /**
   * Get related articles
   */
  async getRelatedArticles(articleNumber: string): Promise<CompleteArticle[]> {
    const article = await this.getArticleByNumber(articleNumber);
    if (!article) return [];

    const relatedNumbers = article.relatedArticles;
    return this.articles.filter(a => relatedNumbers.includes(a.articleNumber));
  }

  /**
   * Get articles by risk category
   */
  async getArticlesByRiskCategory(category: 'unacceptable' | 'high' | 'limited' | 'minimal'): Promise<CompleteArticle[]> {
    return this.articles.filter(a => a.riskCategory === category);
  }

  /**
   * Get articles by title
   */
  async getArticlesByTitle(titleNumber: string): Promise<CompleteArticle[]> {
    return this.articles.filter(a => a.titleNumber === titleNumber);
  }

  /**
   * Get articles by chapter
   */
  async getArticlesByChapter(titleNumber: string, chapterNumber: string): Promise<CompleteArticle[]> {
    return this.articles.filter(a =>
      a.titleNumber === titleNumber && a.chapterNumber === chapterNumber
    );
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<ArticleStats> {
    const byRiskCategory: Record<string, number> = {
      unacceptable: 0,
      high: 0,
      limited: 0,
      minimal: 0,
      null: 0
    };

    const byTitle: Record<string, number> = {};
    const byApplicability: Record<string, number> = {};

    this.articles.forEach(article => {
      // Risk category stats
      const risk = article.riskCategory || 'null';
      byRiskCategory[risk] = (byRiskCategory[risk] || 0) + 1;

      // Title stats
      byTitle[article.titleNumber] = (byTitle[article.titleNumber] || 0) + 1;

      // Applicability stats
      article.applicableTo.forEach(role => {
        byApplicability[role] = (byApplicability[role] || 0) + 1;
      });
    });

    // Calculate upcoming deadlines
    const now = new Date();
    const upcomingDeadlines = [
      {
        date: new Date('2025-02-02'),
        articleCount: this.articles.filter(a => a.effectiveDate <= new Date('2025-02-02')).length,
        description: 'Pratiques interdites (Article 5)'
      },
      {
        date: new Date('2026-08-02'),
        articleCount: this.articles.filter(a => a.effectiveDate <= new Date('2026-08-02')).length,
        description: 'Systèmes IA à haut risque'
      },
      {
        date: new Date('2027-08-02'),
        articleCount: this.articles.length,
        description: 'Application complète du règlement'
      }
    ].filter(d => d.date > now);

    return {
      totalArticles: this.articles.length,
      byRiskCategory,
      byTitle,
      byApplicability,
      upcomingDeadlines
    };
  }

  /**
   * Get navigation structure
   */
  getStructure() {
    return aiActStructure;
  }

  /**
   * Export articles to various formats
   */
  async exportArticles(format: 'json' | 'csv' | 'markdown', filters?: SearchFilters): Promise<string> {
    const results = filters ? await this.search(filters) : this.articles.map(a => ({ article: a, relevanceScore: 1, matchedFields: [] }));
    const articles = results.map(r => r.article);

    switch (format) {
      case 'json':
        return JSON.stringify(articles, null, 2);

      case 'csv':
        const headers = ['Article Number', 'Title', 'Risk Category', 'Applicable To', 'Effective Date'];
        const rows = articles.map(a => [
          a.articleNumber,
          a.title,
          a.riskCategory || 'N/A',
          a.applicableTo.join('; '),
          a.effectiveDate.toISOString().split('T')[0]
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');

      case 'markdown':
        return articles.map(a => `
## ${a.articleNumber}: ${a.title}

**Titre:** ${a.titleName}  
**Chapitre:** ${a.chapterName}  
**Catégorie de risque:** ${a.riskCategory || 'N/A'}  
**Applicable à:** ${a.applicableTo.join(', ')}  
**Date d'effet:** ${a.effectiveDate.toISOString().split('T')[0]}

### Contenu
${a.content}

### Obligations
${a.obligations.map(o => `- ${o}`).join('\n')}

### Mots-clés
${a.keywords.join(', ')}

---
        `).join('\n');

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

export const regulatoryDatabaseService = new RegulatoryDatabaseService();

