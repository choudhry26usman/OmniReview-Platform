import { StatCard } from '../StatCard';
import { MessageSquare } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="p-6">
      <StatCard
        title="Total Reviews"
        value="142"
        icon={MessageSquare}
        trend={{ value: "12%", isPositive: true }}
        testId="stat-example"
      />
    </div>
  );
}
