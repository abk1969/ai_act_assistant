import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileText, Users } from "lucide-react";

export default function ActionItems() {
  const actions = [
    {
      type: "critical",
      icon: AlertTriangle,
      title: "Évaluation DPIA requise",
      description: "Système de reconnaissance faciale",
      bgColor: "bg-red-50",
      textColor: "text-red-800",
      iconColor: "text-red-600"
    },
    {
      type: "important",
      icon: FileText,
      title: "Documentation technique",
      description: "Système de recommandation",
      bgColor: "bg-orange-50",
      textColor: "text-orange-800",
      iconColor: "text-orange-600"
    },
    {
      type: "training",
      icon: Users,
      title: "Formation équipe",
      description: "Module de transparence",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-800",
      iconColor: "text-yellow-600"
    }
  ];

  return (
    <Card data-testid="action-items">
      <CardHeader>
        <CardTitle>Actions prioritaires</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 ${action.bgColor} rounded-lg`}
                data-testid={`action-item-${index}`}
              >
                <Icon className={`${action.iconColor} mt-1 h-4 w-4`} />
                <div>
                  <p className={`text-sm font-medium ${action.textColor}`}>
                    {action.title}
                  </p>
                  <p className={`text-xs ${action.textColor.replace('800', '600')}`}>
                    {action.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
