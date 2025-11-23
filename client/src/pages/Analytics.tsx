import { StatCard } from "@/components/StatCard";
import { SentimentTrendChart, CategoryDistributionChart, MarketplaceDistributionChart } from "@/components/AnalyticsCharts";
import { TrendingUp, TrendingDown, Percent, Target } from "lucide-react";

export default function Analytics() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Insights and trends from your marketplace reviews
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Positive Rate"
          value="68%"
          icon={TrendingUp}
          trend={{ value: "5%", isPositive: true }}
          testId="stat-positive-rate"
        />
        <StatCard
          title="Negative Rate"
          value="18%"
          icon={TrendingDown}
          trend={{ value: "3%", isPositive: false }}
          testId="stat-negative-rate"
        />
        <StatCard
          title="Resolution Rate"
          value="84%"
          icon={Target}
          trend={{ value: "7%", isPositive: true }}
          testId="stat-resolution-rate"
        />
        <StatCard
          title="Avg Response Time"
          value="4.2h"
          icon={Percent}
          trend={{ value: "0.5h", isPositive: true }}
          testId="stat-response-time"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SentimentTrendChart />
        <CategoryDistributionChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MarketplaceDistributionChart />
        <div className="flex items-center justify-center p-6 border border-dashed rounded-lg">
          <p className="text-muted-foreground text-sm">Additional chart placeholder</p>
        </div>
      </div>
    </div>
  );
}
