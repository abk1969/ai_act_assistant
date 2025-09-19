import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RiskDistributionProps {
  distribution?: {
    minimal: number;
    limited: number;
    high: number;
    unacceptable: number;
  };
}

export default function RiskDistribution({ distribution }: RiskDistributionProps) {
  if (!distribution) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribution des risques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-6 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const riskLevels = [
    {
      name: "Risque minimal",
      count: distribution.minimal,
      color: "bg-green-500",
      textColor: "text-green-700"
    },
    {
      name: "Risque limité",
      count: distribution.limited,
      color: "bg-yellow-500",
      textColor: "text-yellow-700"
    },
    {
      name: "Risque élevé",
      count: distribution.high,
      color: "bg-red-500",
      textColor: "text-red-700"
    },
    {
      name: "Inacceptable",
      count: distribution.unacceptable,
      color: "bg-purple-500",
      textColor: "text-purple-700"
    }
  ];

  return (
    <Card data-testid="risk-distribution">
      <CardHeader>
        <CardTitle>Distribution des risques</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {riskLevels.map((level, index) => (
            <div
              key={level.name}
              className="flex items-center justify-between"
              data-testid={`risk-level-${index}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 ${level.color} rounded-full`}></div>
                <span className="text-sm text-foreground">{level.name}</span>
              </div>
              <span className={`text-sm font-medium ${level.textColor}`}>
                {level.count} système{level.count !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
