import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Ban, AlertTriangle, Eye, Calendar, Book, FileText, Shield, Users,
  CheckCircle2, XCircle, Lightbulb, Scale, TrendingUp
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Database() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/ai-act/statistics'],
    queryFn: async () => {
      const response = await fetch('/api/ai-act/statistics');
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      return response.json();
    },
  });

  // Build query URL properly
  const buildQueryUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery && searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }
    if (selectedCategory && selectedCategory !== 'all') {
      params.append('category', selectedCategory);
    }
    const queryString = params.toString();
    return `/api/ai-act/articles${queryString ? `?${queryString}` : ''}`;
  };

  const { data: articles, isLoading, refetch } = useQuery({
    queryKey: ['/api/ai-act/articles', searchQuery, selectedCategory],
    queryFn: async () => {
      const url = buildQueryUrl();
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      return response.json();
    },
    enabled: true,
  });

  // Get article counts from stats
  const getArticleCount = (category: string) => {
    if (!stats?.byRiskCategory) return 0;
    const categoryMap: Record<string, string> = {
      'prohibited': 'unacceptable',
      'high_risk': 'high',
      'transparency': 'limited',
      'minimal': 'minimal'
    };
    const riskCategory = categoryMap[category] || category;
    return stats.byRiskCategory[riskCategory] || 0;
  };

  const quickAccessCards = [
    {
      title: "Pratiques interdites",
      description: "Article 5 - Systèmes d'IA prohibés",
      icon: Ban,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      count: getArticleCount('prohibited'),
      lastUpdate: "12/07/2024",
      riskLevel: "unacceptable",
      category: "prohibited"
    },
    {
      title: "Haut risque",
      description: "Chapitres III - Obligations renforcées",
      icon: AlertTriangle,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      count: getArticleCount('high_risk'),
      lastUpdate: "Annexe III mise à jour",
      riskLevel: "high",
      category: "high_risk"
    },
    {
      title: "Transparence",
      description: "Article 50 - Obligations d'information",
      icon: Eye,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      count: getArticleCount('transparency'),
      lastUpdate: "Modèles génératifs",
      riskLevel: "limited",
      category: "transparency"
    },
    {
      title: "Gouvernance",
      description: "Chapitres V-VII - Cadre institutionnel",
      icon: Shield,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      count: getArticleCount('governance'),
      lastUpdate: "Comité européen IA",
      riskLevel: "governance",
      category: "governance"
    },
    {
      title: "Documentation",
      description: "Articles 11-13 - Exigences techniques",
      icon: FileText,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      count: getArticleCount('documentation'),
      lastUpdate: "Templates conformité",
      riskLevel: "documentation",
      category: "documentation"
    },
    {
      title: "Droits fondamentaux",
      description: "Article 27 - Évaluation d'impact",
      icon: Users,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      count: getArticleCount('fundamental_rights'),
      lastUpdate: "Guides pratiques",
      riskLevel: "rights",
      category: "fundamental_rights"
    }
  ];

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'unacceptable':
        return 'bg-purple-100 text-purple-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'limited':
        return 'bg-yellow-100 text-yellow-800';
      case 'minimal':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSearch = () => {
    refetch();
  };

  const handleQuickAccess = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery("");
  };

  return (
    <div className="p-8" data-testid="page-database">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Base réglementaire EU AI Act
            </h2>
            <p className="text-muted-foreground">
              Règlement (UE) 2024/1689 • {stats?.totalArticles || 0} Articles • Recherche Intelligente
            </p>
          </div>
          {stats && (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.totalArticles}</div>
                <div className="text-xs text-muted-foreground">Articles totaux</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.byRiskCategory?.unacceptable || 0}</div>
                <div className="text-xs text-muted-foreground">Pratiques interdites</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.byRiskCategory?.high || 0}</div>
                <div className="text-xs text-muted-foreground">Systèmes haut risque</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Rechercher dans les articles, définitions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12"
                  data-testid="input-search-articles"
                />
                <Search className="absolute left-4 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48" data-testid="select-category">
                  <SelectValue placeholder="Tous les chapitres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les chapitres</SelectItem>
                  <SelectItem value="prohibited">Chapitre II - Pratiques interdites</SelectItem>
                  <SelectItem value="high_risk">Chapitre III - Systèmes à haut risque</SelectItem>
                  <SelectItem value="transparency">Chapitre IV - Transparence</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} data-testid="button-search">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {quickAccessCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              data-testid={`quick-access-${index}`}
              onClick={() => handleQuickAccess(card.category)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 ${card.bgColor} rounded-lg`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-foreground">{card.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{card.description}</p>
                <div className="text-xs text-muted-foreground">
                  <span>{card.count} article{card.count > 1 ? 's' : ''} • Dernière mise à jour: {card.lastUpdate}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Articles List */}
      <Card>
        <CardHeader>
          <CardTitle>Articles du règlement</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {articles.map((article: any, index: number) => (
                <AccordionItem
                  key={article.id}
                  value={`article-${index}`}
                  data-testid={`article-${index}`}
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-start justify-between w-full pr-4">
                      <div className="text-left">
                        <h4 className="font-medium text-foreground mb-1">
                          {article.articleNumber} - {article.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          {article.riskCategory && (
                            <Badge className={getRiskBadgeColor(article.riskCategory)}>
                              {article.riskCategory === 'unacceptable' && 'Risque inacceptable'}
                              {article.riskCategory === 'high' && 'Haut risque'}
                              {article.riskCategory === 'limited' && 'Risque limité'}
                              {article.riskCategory === 'minimal' && 'Risque minimal'}
                            </Badge>
                          )}
                          <Badge variant="outline">{article.chapter}</Badge>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {/* Article Content */}
                      <div>
                        <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Texte officiel
                        </h5>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {article.content}
                        </p>
                      </div>

                      {/* Practical Examples */}
                      {article.practicalExamples && article.practicalExamples.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-600" />
                            Exemples pratiques
                          </h5>
                          <ul className="space-y-1">
                            {article.practicalExamples.map((example: string, i: number) => (
                              <li key={i} className="text-sm text-muted-foreground">
                                {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Compliance Checklist */}
                      {article.complianceChecklist && article.complianceChecklist.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Checklist de conformité
                          </h5>
                          <ul className="space-y-1">
                            {article.complianceChecklist.map((item: string, i: number) => (
                              <li key={i} className="text-sm text-muted-foreground font-mono">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Sanctions */}
                      {article.sanctions && (
                        <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                          <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-red-700 dark:text-red-400">
                            <Scale className="h-4 w-4" />
                            Sanctions applicables
                          </h5>
                          <p className="text-sm text-red-600 dark:text-red-300">
                            {article.sanctions}
                          </p>
                        </div>
                      )}

                      {/* Related Articles */}
                      {article.relatedArticles && article.relatedArticles.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            Articles connexes
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {article.relatedArticles.map((related: string, i: number) => (
                              <Badge key={i} variant="secondary">
                                {related}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 pt-2 border-t">
                        {article.effectiveDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Entrée en vigueur: {new Date(article.effectiveDate).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Book className="h-3 w-3" />
                          Dernière mise à jour: {new Date(article.lastUpdated).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory 
                  ? "Aucun article trouvé pour votre recherche"
                  : "Aucun article disponible"
                }
              </p>
            </div>
          )}

          {articles && articles.length > 0 && (
            <div className="p-4 border-t border-border text-center">
              <Button variant="ghost" className="text-primary hover:text-primary/80">
                Voir tous les articles <span className="ml-1">→</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
