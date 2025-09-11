import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Ban, AlertTriangle, Eye, Calendar, Book } from "lucide-react";

export default function Database() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: articles, isLoading } = useQuery({
    queryKey: ['/api/ai-act/articles', { search: searchQuery, category: selectedCategory }],
    enabled: true,
  });

  const quickAccessCards = [
    {
      title: "Pratiques interdites",
      description: "Article 5 - Systèmes d'IA prohibés",
      icon: Ban,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      articles: "8 articles",
      lastUpdate: "12/07/2024",
      riskLevel: "unacceptable"
    },
    {
      title: "Haut risque",
      description: "Chapitres III - Obligations renforcées",
      icon: AlertTriangle,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      articles: "24 articles",
      lastUpdate: "Annexe III mise à jour",
      riskLevel: "high"
    },
    {
      title: "Transparence",
      description: "Article 50 - Obligations d'information",
      icon: Eye,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      articles: "6 articles",
      lastUpdate: "Modèles génératifs",
      riskLevel: "limited"
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
    // Search is handled automatically by the query when searchQuery changes
  };

  return (
    <div className="p-8" data-testid="page-database">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Base réglementaire EU AI Act
        </h2>
        <p className="text-muted-foreground">
          Règlement (UE) 2024/1689 avec recherche avancée
        </p>
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
                  <SelectItem value="">Tous les chapitres</SelectItem>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickAccessCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              data-testid={`quick-access-${index}`}
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
                  <span>{card.articles} • Dernière mise à jour: {card.lastUpdate}</span>
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
            <div className="divide-y divide-border">
              {articles.map((article: any, index: number) => (
                <div 
                  key={article.id} 
                  className="p-6 hover:bg-muted/30 cursor-pointer"
                  data-testid={`article-${index}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-foreground">
                        {article.articleNumber} - {article.title}
                      </h4>
                      {article.riskCategory && (
                        <Badge className={getRiskBadgeColor(article.riskCategory)}>
                          {article.riskCategory === 'unacceptable' && 'Risque inacceptable'}
                          {article.riskCategory === 'high' && 'Haut risque'}
                          {article.riskCategory === 'limited' && 'Risque limité'}
                          {article.riskCategory === 'minimal' && 'Risque minimal'}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline">{article.chapter}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {article.content}
                  </p>
                  <div className="flex items-center gap-4">
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
              ))}
            </div>
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
