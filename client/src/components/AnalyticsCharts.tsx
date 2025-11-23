import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "recharts";

const sentimentTrendData = [
  { date: "Mon", positive: 45, neutral: 20, negative: 15 },
  { date: "Tue", positive: 52, neutral: 18, negative: 12 },
  { date: "Wed", positive: 38, neutral: 25, negative: 22 },
  { date: "Thu", positive: 60, neutral: 15, negative: 10 },
  { date: "Fri", positive: 55, neutral: 20, negative: 8 },
  { date: "Sat", positive: 48, neutral: 22, negative: 14 },
  { date: "Sun", positive: 42, neutral: 24, negative: 18 },
];

const categoryData = [
  { category: "Shipping", count: 45 },
  { category: "Defect", count: 32 },
  { category: "Service", count: 28 },
  { category: "Quality", count: 22 },
  { category: "Pricing", count: 15 },
];

const marketplaceData = [
  { name: "Amazon", value: 35 },
  { name: "eBay", value: 25 },
  { name: "Shopify", value: 20 },
  { name: "PayPal", value: 12 },
  { name: "Other", value: 8 },
];

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function SentimentTrendChart() {
  return (
    <Card data-testid="chart-sentiment-trend">
      <CardHeader>
        <CardTitle>Sentiment Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sentimentTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--popover))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px"
              }} 
            />
            <Legend />
            <Line type="monotone" dataKey="positive" stroke="hsl(var(--chart-2))" strokeWidth={2} />
            <Line type="monotone" dataKey="neutral" stroke="hsl(var(--chart-3))" strokeWidth={2} />
            <Line type="monotone" dataKey="negative" stroke="hsl(var(--destructive))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function CategoryDistributionChart() {
  return (
    <Card data-testid="chart-category-distribution">
      <CardHeader>
        <CardTitle>Issue Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--popover))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px"
              }} 
            />
            <Bar dataKey="count" fill="hsl(var(--chart-1))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function MarketplaceDistributionChart() {
  return (
    <Card data-testid="chart-marketplace-distribution">
      <CardHeader>
        <CardTitle>Reviews by Marketplace</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={marketplaceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="hsl(var(--chart-1))"
              dataKey="value"
            >
              {marketplaceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--popover))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px"
              }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
