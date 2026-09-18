import type { LucideIcon } from "lucide-react";
import { Card } from "../../components/ui/Card";
export function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="metric-card">
      <div className="metric-top">
        <span>{title}</span>
        <Icon size={20} />
      </div>
      <strong className="metric-value">{value}</strong>
    </Card>
  );
}
