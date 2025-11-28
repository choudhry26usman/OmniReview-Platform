import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const COLORS = ["#06b6d4", "#a855f7", "#f59e0b", "#ec4899", "#22c55e"];
const MARKETPLACE_COLORS: Record<string, string> = {
  "Amazon": "#FF9900",
  "Shopify": "#7AB55C", 
  "Walmart": "#0071DC",
  "Mailbox": "#0078D4",
};

interface SentimentTrendChartProps {
  data: Record<string, { positive: number; neutral: number; negative: number }>;
}

export function SentimentTrendChart({ data }: SentimentTrendChartProps) {
  const chartData = Object.entries(data).map(([week, counts]) => ({
    week,
    positive: Math.round(counts.positive),
    neutral: Math.round(counts.neutral),
    negative: Math.round(counts.negative),
  }));

  if (chartData.length === 0) {
    return (
      <Card data-testid="chart-sentiment-trend" className="rounded-2xl">
        <CardHeader>
          <CardTitle>Sentiment Trend</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-slate-400 text-sm">No review data available for trends</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="chart-sentiment-trend" className="rounded-2xl">
      <CardHeader>
        <CardTitle>Sentiment Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis 
              dataKey="week" 
              stroke="#94a3b8" 
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              angle={-30}
              textAnchor="end"
              height={50}
            />
            <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} allowDecimals={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#1e293b", 
                border: "1px solid #475569",
                borderRadius: "8px",
                color: "#f1f5f9"
              }}
              formatter={(value: number) => [Math.round(value), '']}
            />
            <Legend />
            <Line type="monotone" dataKey="positive" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: "#22c55e" }} />
            <Line type="monotone" dataKey="neutral" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: "#f59e0b" }} />
            <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ef4444" }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface CategoryDistributionChartProps {
  data: Record<string, number>;
}

export function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  const chartData = Object.entries(data).map(([category, count]) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    shortCategory: category.length > 12 ? category.substring(0, 10) + '...' : category,
    count,
  })).sort((a, b) => b.count - a.count).slice(0, 8);

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card data-testid="chart-category-distribution" className="rounded-2xl">
      <CardHeader>
        <CardTitle>Category Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <ResponsiveContainer width="55%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                fill="#06b6d4"
                dataKey="count"
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#1e293b", 
                  border: "1px solid #475569",
                  borderRadius: "8px",
                  color: "#f1f5f9"
                }}
                formatter={(value: number, name: string, props: any) => [value, props.payload.category]}
              />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold" fill="#f1f5f9">
                {total}
              </text>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 flex-1 pt-4">
            {chartData.map((item, index) => (
              <div key={item.category} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground truncate">{item.category}</span>
                </div>
                <span className="text-sm font-medium flex-shrink-0">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MarketplaceDistributionChartProps {
  data: Record<string, number>;
}

export function MarketplaceDistributionChart({ data }: MarketplaceDistributionChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));

  return (
    <Card data-testid="chart-marketplace-distribution" className="rounded-2xl">
      <CardHeader>
        <CardTitle>Marketplace Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#06b6d4"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#1e293b", 
                border: "1px solid #475569",
                borderRadius: "8px",
                color: "#f1f5f9"
              }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface RatingDistributionChartProps {
  data: Record<number, number>;
}

export function RatingDistributionChart({ data }: RatingDistributionChartProps) {
  const chartData = [1, 2, 3, 4, 5].map(rating => ({
    rating: rating.toString(),
    count: Math.round(data[rating] || 0),
  }));

  return (
    <Card data-testid="chart-rating-distribution" className="rounded-2xl">
      <CardHeader>
        <CardTitle>Rating Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="rating" stroke="#94a3b8" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} allowDecimals={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#1e293b", 
                border: "1px solid #475569",
                borderRadius: "8px",
                color: "#f1f5f9"
              }}
              formatter={(value: number) => [Math.round(value), 'Reviews']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index < 2 ? "#f59e0b" : "#a855f7"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface StatusDistributionChartProps {
  data: Record<string, number>;
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name: name.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value,
  }));

  return (
    <Card data-testid="chart-status-distribution" className="rounded-2xl">
      <CardHeader>
        <CardTitle>Review Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#06b6d4"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#1e293b", 
                border: "1px solid #475569",
                borderRadius: "8px",
                color: "#f1f5f9"
              }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Dashboard-specific compact charts

interface DashboardSentimentChartProps {
  data: Record<string, { positive: number; neutral: number; negative: number }>;
}

export function DashboardSentimentChart({ data }: DashboardSentimentChartProps) {
  const chartData = Object.entries(data).map(([week, counts]) => ({
    week: week.split(' ')[0],
    positive: Math.round(counts.positive),
    neutral: Math.round(counts.neutral),
    negative: Math.round(counts.negative),
  })).slice(-8);

  const totals = chartData.reduce((acc, item) => ({
    positive: acc.positive + item.positive,
    neutral: acc.neutral + item.neutral,
    negative: acc.negative + item.negative,
  }), { positive: 0, neutral: 0, negative: 0 });

  const total = totals.positive + totals.neutral + totals.negative;

  if (chartData.length === 0) {
    return (
      <Card data-testid="dashboard-sentiment-chart" className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sentiment Trend</CardTitle>
          <CardDescription>Weekly sentiment over time</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="dashboard-sentiment-chart" className="rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div>
            <CardTitle className="text-base">Sentiment Trend</CardTitle>
            <CardDescription>Weekly sentiment over time</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              {total > 0 ? Math.round((totals.positive / total) * 100) : 0}% Positive
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="neutralGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
            <XAxis 
              dataKey="week" 
              stroke="#94a3b8" 
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="#94a3b8" 
              tick={{ fontSize: 10, fill: "#94a3b8" }} 
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))"
              }}
            />
            <Area type="monotone" dataKey="positive" stroke="#22c55e" strokeWidth={2} fill="url(#positiveGradient)" />
            <Area type="monotone" dataKey="neutral" stroke="#f59e0b" strokeWidth={2} fill="url(#neutralGradient)" />
            <Area type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} fill="url(#negativeGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface DashboardSourceChartProps {
  data: Record<string, number>;
}

export function DashboardSourceChart({ data }: DashboardSourceChartProps) {
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ 
      name, 
      value,
      color: MARKETPLACE_COLORS[name] || COLORS[0]
    }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <Card data-testid="dashboard-source-chart" className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Review Sources</CardTitle>
          <CardDescription>Distribution by marketplace</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="dashboard-source-chart" className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Review Sources</CardTitle>
        <CardDescription>Distribution by marketplace</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={180}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))"
                }}
              />
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-xl font-bold" 
                fill="hsl(var(--foreground))"
              >
                {total}
              </text>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 flex-1">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SeverityStatusMatrixProps {
  data: {
    severity: Record<string, Record<string, number>>;
    totals: { bySeverity: Record<string, number>; byStatus: Record<string, number> };
  };
}

export function SeverityStatusMatrix({ data }: SeverityStatusMatrixProps) {
  const severities = ["critical", "high", "medium", "low"];
  const statuses = ["open", "in_progress", "resolved"];
  const statusLabels: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress", 
    resolved: "Resolved"
  };
  const severityColors: Record<string, string> = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-green-500"
  };

  const hasData = Object.values(data.totals.bySeverity).some(v => v > 0);

  if (!hasData) {
    return (
      <Card data-testid="dashboard-severity-matrix" className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Severity & Status</CardTitle>
          <CardDescription>Review priority matrix</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="dashboard-severity-matrix" className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Severity & Status</CardTitle>
        <CardDescription>Review priority matrix</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium"></th>
                {statuses.map(status => (
                  <th key={status} className="text-center py-2 px-2 text-muted-foreground font-medium">
                    {statusLabels[status]}
                  </th>
                ))}
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {severities.map(severity => {
                const rowTotal = data.totals.bySeverity[severity] || 0;
                if (rowTotal === 0) return null;
                return (
                  <tr key={severity} className="border-t border-border/50">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${severityColors[severity]}`} />
                        <span className="capitalize">{severity}</span>
                      </div>
                    </td>
                    {statuses.map(status => {
                      const count = data.severity[severity]?.[status] || 0;
                      return (
                        <td key={status} className="text-center py-2 px-2">
                          {count > 0 ? (
                            <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded text-xs font-medium ${
                              status === 'open' && severity === 'critical' 
                                ? 'bg-red-500/20 text-red-400'
                                : status === 'open' && severity === 'high'
                                ? 'bg-orange-500/20 text-orange-400'
                                : status === 'resolved'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {count}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center py-2 px-2 font-medium">{rowTotal}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border">
                <td className="py-2 px-2 font-medium">Total</td>
                {statuses.map(status => (
                  <td key={status} className="text-center py-2 px-2 font-medium">
                    {data.totals.byStatus[status] || 0}
                  </td>
                ))}
                <td className="text-center py-2 px-2 font-bold">
                  {Object.values(data.totals.bySeverity).reduce((a, b) => a + b, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

interface ResponseMetricsProps {
  avgTimeToProgress: number;
  resolvedWithin48h: number;
  totalResolved: number;
}

export function ResponseMetricsCard({ avgTimeToProgress, resolvedWithin48h, totalResolved }: ResponseMetricsProps) {
  const resolvedPercentage = totalResolved > 0 ? Math.round((resolvedWithin48h / totalResolved) * 100) : 0;
  
  const formatTime = (hours: number) => {
    if (hours < 1) return "< 1 hour";
    if (hours < 24) return `${Math.round(hours)} hours`;
    return `${Math.round(hours / 24)} days`;
  };

  return (
    <Card data-testid="response-metrics-card" className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Response Metrics</CardTitle>
        <CardDescription>Team performance indicators</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Avg. Time to In-Progress</p>
            <p className="text-2xl font-bold">{formatTime(avgTimeToProgress)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Resolved within 48h</p>
            <p className="text-2xl font-bold">{resolvedPercentage}%</p>
            <p className="text-xs text-muted-foreground">{resolvedWithin48h} of {totalResolved}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
