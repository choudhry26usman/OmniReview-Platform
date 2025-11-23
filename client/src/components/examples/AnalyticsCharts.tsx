import { SentimentTrendChart, CategoryDistributionChart, MarketplaceDistributionChart } from '../AnalyticsCharts';

export default function AnalyticsChartsExample() {
  return (
    <div className="p-6 space-y-6">
      <SentimentTrendChart />
      <CategoryDistributionChart />
      <MarketplaceDistributionChart />
    </div>
  );
}
