/**
 * Professional Regulatory Database Interface
 * Inspired by artificialintelligenceact.eu and enterprise compliance platforms
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Download, BookOpen, AlertTriangle, Shield, Eye, Sparkles, Calendar, Tag, ChevronRight, ExternalLink, Star, BookmarkPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CompleteArticle {
  articleNumber: string;
  title: string;
  content: string;
  titleNumber: string;
  titleName: string;
  chapterNumber: string;
  chapterName: string;
  sectionNumber?: string;
  sectionName?: string;
  riskCategory: 'unacceptable' | 'high' | 'limited' | 'minimal' | null;
  applicableTo: string[];
  obligations: string[];
  effectiveDate: string;
  keywords: string[];
  relatedArticles: string[];
  annexReferences: string[];
  eurLexUrl: string;
  officialReference: string;
}

interface SearchResult {
  article: CompleteArticle;
  relevanceScore: number;
  matchedFields: string[];
  highlightedContent?: string;
}

interface ArticleStats {
  totalArticles: number;
  byRiskCategory: Record<string, number>;
  byTitle: Record<string, number>;
  byApplicability: Record<string, number>;
  upcomingDeadlines: Array<{ date: string; articleCount: number; description: string }>;
}

export default function RegulatoryDatabase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskCategory, setSelectedRiskCategory] = useState<string>('all');
  const [selectedTitle, setSelectedTitle] = useState<string>('all');
  const [selectedApplicability, setSelectedApplicability] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<CompleteArticle | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Ref for scrolling to results section
  const resultsRef = useRef<HTMLDivElement>(null);

  // Function to scroll to results
  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Fetch statistics
  const { data: stats } = useQuery<ArticleStats>({
    queryKey: ['/api/regulatory-database/stats'],
  });

  // Fetch search results with custom queryFn
  const { data: searchResults, isLoading } = useQuery<SearchResult[]>({
    queryKey: ['/api/regulatory-database/search', {
      query: searchQuery || undefined,
      riskCategory: selectedRiskCategory !== 'all' ? selectedRiskCategory : undefined,
      titleNumber: selectedTitle !== 'all' ? selectedTitle : undefined,
      applicableTo: selectedApplicability !== 'all' ? [selectedApplicability] : undefined,
    }],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (searchQuery) params.append('query', searchQuery);
      if (selectedRiskCategory !== 'all') params.append('riskCategory', selectedRiskCategory);
      if (selectedTitle !== 'all') params.append('titleNumber', selectedTitle);
      if (selectedApplicability !== 'all') params.append('applicableTo', selectedApplicability);

      const url = `/api/regulatory-database/search?${params.toString()}`;
      const res = await fetch(url, { credentials: 'include' });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      return res.json();
    },
  });

  // Risk category colors and icons
  const riskConfig = {
    unacceptable: { color: 'bg-red-500', icon: AlertTriangle, label: 'Inacceptable', textColor: 'text-red-700' },
    high: { color: 'bg-orange-500', icon: Shield, label: 'Haut risque', textColor: 'text-orange-700' },
    limited: { color: 'bg-yellow-500', icon: Eye, label: 'Risque limité', textColor: 'text-yellow-700' },
    minimal: { color: 'bg-green-500', icon: Sparkles, label: 'Risque minimal', textColor: 'text-green-700' },
    null: { color: 'bg-gray-400', icon: BookOpen, label: 'Général', textColor: 'text-gray-700' }
  };

  const toggleFavorite = (articleNumber: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(articleNumber)) {
        newFavorites.delete(articleNumber);
      } else {
        newFavorites.add(articleNumber);
      }
      return newFavorites;
    });
  };

  const exportResults = async (format: 'json' | 'csv' | 'markdown') => {
    const response = await fetch(`/api/regulatory-database/export?format=${format}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: searchQuery || undefined,
        riskCategory: selectedRiskCategory !== 'all' ? selectedRiskCategory : undefined,
        titleNumber: selectedTitle !== 'all' ? selectedTitle : undefined,
      })
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-act-articles.${format}`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header avec animation */}
      <div className="bg-white border-b shadow-lg">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Base Réglementaire EU AI Act
                  </h1>
                  <p className="text-gray-600 text-lg mt-1 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Règlement (UE) 2024/1689 • 113 Articles • Recherche Intelligente
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportResults('json')} className="hover:bg-blue-50 transition-all">
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
              <Button variant="outline" onClick={() => exportResults('csv')} className="hover:bg-green-50 transition-all">
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => exportResults('markdown')} className="hover:bg-purple-50 transition-all">
                <Download className="w-4 h-4 mr-2" />
                Markdown
              </Button>
            </div>
          </div>

          {/* Statistics Cards avec animations et cliquables */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Click on Articles totaux card');
                  setSearchQuery('');
                  setSelectedRiskCategory('all');
                  setSelectedTitle('all');
                  scrollToResults();
                }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 hover:scale-105 h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-4xl font-extrabold text-blue-600 mb-1">{stats.totalArticles}</div>
                        <div className="text-sm font-medium text-gray-600">Articles totaux</div>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-blue-600 font-semibold">✓ Cliquez pour voir tous</div>
                  </CardContent>
                </Card>
              </div>
              <div
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Click on Pratiques interdites card');
                  setSearchQuery('');
                  setSelectedRiskCategory('unacceptable');
                  setSelectedTitle('all');
                  scrollToResults();
                }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-red-500 hover:scale-105 h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-4xl font-extrabold text-red-600 mb-1">{stats.byRiskCategory.unacceptable || 0}</div>
                        <div className="text-sm font-medium text-gray-600">Pratiques interdites</div>
                      </div>
                      <div className="p-3 bg-red-100 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-red-600 font-semibold">✓ Cliquez pour filtrer</div>
                  </CardContent>
                </Card>
              </div>
              <div
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Click on Systèmes haut risque card');
                  setSearchQuery('');
                  setSelectedRiskCategory('high');
                  setSelectedTitle('all');
                  scrollToResults();
                }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-orange-500 hover:scale-105 h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-4xl font-extrabold text-orange-600 mb-1">{stats.byRiskCategory.high || 0}</div>
                        <div className="text-sm font-medium text-gray-600">Systèmes haut risque</div>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-full">
                        <Shield className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-orange-600 font-semibold">✓ Cliquez pour filtrer</div>
                  </CardContent>
                </Card>
              </div>
              <div
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Click on Échéances à venir card');
                  setSearchQuery('échéance');
                  setSelectedRiskCategory('all');
                  setSelectedTitle('all');
                  scrollToResults();
                }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-purple-500 hover:scale-105 h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-4xl font-extrabold text-purple-600 mb-1">
                          {stats.upcomingDeadlines.length}
                        </div>
                        <div className="text-sm font-medium text-gray-600">Échéances à venir</div>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <Calendar className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-purple-600 font-semibold">✓ Cliquez pour voir</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Search and Filters avec design amélioré */}
          <div className="space-y-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 group-hover:text-blue-500 transition-colors" />
              <Input
                type="text"
                placeholder="🔍 Recherche intelligente : articles, obligations, mots-clés, définitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 h-16 text-lg border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 rounded-xl shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Select value={selectedRiskCategory} onValueChange={setSelectedRiskCategory}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Catégorie de risque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="unacceptable">Inacceptable</SelectItem>
                  <SelectItem value="high">Haut risque</SelectItem>
                  <SelectItem value="limited">Risque limité</SelectItem>
                  <SelectItem value="minimal">Risque minimal</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedTitle} onValueChange={setSelectedTitle}>
                <SelectTrigger className="w-[200px]">
                  <BookOpen className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Titre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les titres</SelectItem>
                  <SelectItem value="TITRE I">Titre I - Dispositions générales</SelectItem>
                  <SelectItem value="TITRE II">Titre II - Pratiques interdites</SelectItem>
                  <SelectItem value="TITRE III">Titre III - Systèmes haut risque</SelectItem>
                  <SelectItem value="TITRE IV">Titre IV - Transparence</SelectItem>
                  <SelectItem value="TITRE V">Titre V - Modèles IA usage général</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedApplicability} onValueChange={setSelectedApplicability}>
                <SelectTrigger className="w-[200px]">
                  <Tag className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Applicable à" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les acteurs</SelectItem>
                  <SelectItem value="providers">Fournisseurs</SelectItem>
                  <SelectItem value="deployers">Déployeurs</SelectItem>
                  <SelectItem value="distributors">Distributeurs</SelectItem>
                  <SelectItem value="importers">Importateurs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div ref={resultsRef} className="container mx-auto px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {searchResults?.length || 0} article(s) trouvé(s)
            {searchQuery && ` pour "${searchQuery}"`}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Recherche en cours...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {searchResults?.map((result) => {
              const article = result.article;
              const riskInfo = riskConfig[article.riskCategory || 'null'];
              const RiskIcon = riskInfo.icon;
              const isFavorite = favorites.has(article.articleNumber);

              return (
                <Card
                  key={article.articleNumber}
                  className="hover:shadow-lg transition-all cursor-pointer border-l-4"
                  style={{ borderLeftColor: riskInfo.color.replace('bg-', '#') }}
                  onClick={() => setSelectedArticle(article)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="font-mono">
                            {article.articleNumber}
                          </Badge>
                          <Badge className={`${riskInfo.color} text-white`}>
                            <RiskIcon className="w-3 h-3 mr-1" />
                            {riskInfo.label}
                          </Badge>
                          {result.relevanceScore > 50 && (
                            <Badge variant="secondary">
                              <Star className="w-3 h-3 mr-1" />
                              Très pertinent
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl mb-2">{article.title}</CardTitle>
                        <CardDescription>
                          {article.titleName} • {article.chapterName}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(article.articleNumber);
                        }}
                      >
                        <BookmarkPlus className={`w-5 h-5 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-sm text-gray-700 mb-4 line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html: result.highlightedContent || article.content.substring(0, 300) + '...'
                      }}
                    />
                    <div className="flex flex-wrap gap-2 mb-3">
                      {article.keywords.slice(0, 5).map((keyword) => (
                        <Badge key={keyword} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Effectif: {new Date(article.effectiveDate).toLocaleDateString('fr-FR')}
                        </span>
                        <span>
                          Applicable à: {article.applicableTo.join(', ')}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Article Detail Dialog */}
      {selectedArticle && (
        <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="font-mono text-lg">
                  {selectedArticle.articleNumber}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(selectedArticle.eurLexUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  EUR-Lex
                </Button>
              </div>
              <DialogTitle className="text-2xl">{selectedArticle.title}</DialogTitle>
              <DialogDescription>
                {selectedArticle.titleName} • {selectedArticle.chapterName}
                {selectedArticle.sectionName && ` • ${selectedArticle.sectionName}`}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="content" className="mt-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Contenu</TabsTrigger>
                <TabsTrigger value="obligations">Obligations</TabsTrigger>
                <TabsTrigger value="related">Articles liés</TabsTrigger>
                <TabsTrigger value="metadata">Métadonnées</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">{selectedArticle.content}</p>
                </div>
              </TabsContent>

              <TabsContent value="obligations" className="space-y-2">
                {selectedArticle.obligations.map((obligation, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-sm text-gray-700">{obligation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="related">
                <div className="space-y-2">
                  {selectedArticle.relatedArticles.map((relatedNum) => (
                    <Button
                      key={relatedNum}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        // Fetch and display related article
                      }}
                    >
                      <ChevronRight className="w-4 h-4 mr-2" />
                      {relatedNum}
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-1">Catégorie de risque</div>
                    <Badge className={riskConfig[selectedArticle.riskCategory || 'null'].color}>
                      {riskConfig[selectedArticle.riskCategory || 'null'].label}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-1">Date d'effet</div>
                    <div className="text-sm">{new Date(selectedArticle.effectiveDate).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-semibold text-gray-600 mb-2">Mots-clés</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedArticle.keywords.map((kw) => (
                        <Badge key={kw} variant="secondary">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-semibold text-gray-600 mb-1">Référence officielle</div>
                    <div className="text-sm font-mono bg-gray-100 p-2 rounded">{selectedArticle.officialReference}</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

