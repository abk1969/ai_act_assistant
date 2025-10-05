import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Target,
  Users,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  FileText
} from "lucide-react";

interface TimelineAction {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  deadline: string;
  estimatedHours: number;
  category: 'compliance' | 'documentation' | 'technical' | 'governance' | 'training';
  impactLevel: 'critical' | 'high' | 'medium' | 'low';
  assignee?: string;
  systemName?: string;
}

interface ActionTimelineProps {
  timeline?: {
    immediate: TimelineAction[];
    short_term: TimelineAction[];
    medium_term: TimelineAction[];
    long_term: TimelineAction[];
  };
  isLoading?: boolean;
  onActionClick?: (actionId: string) => void;
}

export function ActionTimeline({ timeline, isLoading, onActionClick }: ActionTimelineProps) {
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'compliance': return <CheckCircle className="h-4 w-4" />;
      case 'documentation': return <FileText className="h-4 w-4" />;
      case 'technical': return <Target className="h-4 w-4" />;
      case 'governance': return <Users className="h-4 w-4" />;
      case 'training': return <Clock className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Échéance dépassée';
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Demain';
    if (diffDays <= 7) return `${diffDays} jour(s)`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} semaine(s)`;
    return `${Math.ceil(diffDays / 30)} mois`;
  };

  const renderTimelineSection = (
    title: string,
    actions: TimelineAction[],
    borderColor: string,
    bgColor: string,
    textColor: string
  ) => (
    <div className={`border-l-4 ${borderColor} pl-4`}>
      <h4 className={`font-semibold ${textColor} mb-3 flex items-center gap-2`}>
        <Calendar className="h-4 w-4" />
        {title}
        <Badge variant="outline" className="text-xs">
          {actions.length} action(s)
        </Badge>
      </h4>
      <div className="space-y-3">
        {actions.length > 0 ? (
          actions.map((action) => (
            <div 
              key={action.id} 
              className={`p-3 ${bgColor} rounded-lg border hover:shadow-sm transition-shadow cursor-pointer`}
              onClick={() => onActionClick?.(action.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(action.category)}
                  <h5 className="font-medium text-foreground">{action.title}</h5>
                </div>
                <Badge className={getPriorityColor(action.priority)} size="sm">
                  {action.priority}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {action.description}
              </p>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {action.estimatedHours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDeadline(action.deadline)}
                  </span>
                  {action.systemName && (
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {action.systemName}
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className={`p-4 ${bgColor} rounded-lg border text-center`}>
            <p className="text-sm text-muted-foreground">
              Aucune action planifiée pour cette période
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline des actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-16 bg-muted rounded"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Données par défaut si pas de timeline fournie
  const defaultTimeline = {
    immediate: [
      {
        id: '1',
        title: 'Audit de conformité système critique',
        description: 'Effectuer un audit complet du système IA à risque élevé selon les nouvelles exigences',
        priority: 'urgent' as const,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 24,
        category: 'compliance' as const,
        impactLevel: 'critical' as const,
        systemName: 'Système de recommandation'
      },
      {
        id: '2',
        title: 'Mise à jour documentation technique',
        description: 'Réviser et mettre à jour la documentation technique selon les nouvelles directives',
        priority: 'high' as const,
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 16,
        category: 'documentation' as const,
        impactLevel: 'high' as const,
        systemName: 'Système de classification'
      }
    ],
    short_term: [
      {
        id: '3',
        title: 'Formation équipe sur nouvelles exigences',
        description: 'Organiser une formation complète sur les nouvelles exigences réglementaires',
        priority: 'high' as const,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 32,
        category: 'training' as const,
        impactLevel: 'medium' as const
      },
      {
        id: '4',
        title: 'Révision processus de gouvernance',
        description: 'Revoir et adapter les processus de gouvernance IA aux nouvelles réglementations',
        priority: 'medium' as const,
        deadline: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 40,
        category: 'governance' as const,
        impactLevel: 'medium' as const
      }
    ],
    medium_term: [
      {
        id: '5',
        title: 'Implémentation nouveau framework',
        description: 'Déployer le nouveau framework de conformité sur tous les systèmes',
        priority: 'medium' as const,
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 80,
        category: 'technical' as const,
        impactLevel: 'high' as const
      }
    ],
    long_term: [
      {
        id: '6',
        title: 'Certification conformité complète',
        description: 'Obtenir la certification de conformité complète pour tous les systèmes IA',
        priority: 'medium' as const,
        deadline: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 120,
        category: 'compliance' as const,
        impactLevel: 'high' as const
      }
    ]
  };

  const activeTimeline = timeline || defaultTimeline;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Timeline des actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {renderTimelineSection(
            'Actions immédiates (0-30 jours)',
            activeTimeline.immediate,
            'border-red-500',
            'bg-red-50',
            'text-red-600'
          )}
          
          {renderTimelineSection(
            'Court terme (1-3 mois)',
            activeTimeline.short_term,
            'border-orange-500',
            'bg-orange-50',
            'text-orange-600'
          )}
          
          {renderTimelineSection(
            'Moyen terme (3-6 mois)',
            activeTimeline.medium_term,
            'border-yellow-500',
            'bg-yellow-50',
            'text-yellow-600'
          )}
          
          {renderTimelineSection(
            'Long terme (6+ mois)',
            activeTimeline.long_term,
            'border-green-500',
            'bg-green-50',
            'text-green-600'
          )}
        </div>
      </CardContent>
    </Card>
  );
}
