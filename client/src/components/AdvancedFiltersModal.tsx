import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useLocation } from "wouter";

interface AdvancedFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdvancedFiltersModal({ open, onOpenChange }: AdvancedFiltersModalProps) {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  
  const sentiment = searchParams.get('sentiment') || 'all';
  const severity = searchParams.get('severity') || 'all';
  const status = searchParams.get('status') || 'all';
  const dateRange = searchParams.get('date') || 'all';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const newSearch = params.toString();
    setLocation(newSearch ? `/?${newSearch}` : '/');
  };

  const clearAllFilters = () => {
    setLocation('/');
    onOpenChange(false);
  };

  const hasActiveFilters = sentiment !== 'all' || severity !== 'all' || status !== 'all' || dateRange !== 'all';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="modal-advanced-filters">
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
          <DialogDescription>
            Refine your review search with advanced filtering options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="sentiment-filter">Sentiment</Label>
            <Select value={sentiment} onValueChange={(value) => updateFilter('sentiment', value)}>
              <SelectTrigger id="sentiment-filter" data-testid="select-sentiment">
                <SelectValue placeholder="All sentiments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity-filter">Severity</Label>
            <Select value={severity} onValueChange={(value) => updateFilter('severity', value)}>
              <SelectTrigger id="severity-filter" data-testid="select-severity">
                <SelectValue placeholder="All severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger id="status-filter" data-testid="select-status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-filter">Date Range</Label>
            <Select value={dateRange} onValueChange={(value) => updateFilter('date', value)}>
              <SelectTrigger id="date-filter" data-testid="select-date">
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
            data-testid="button-clear-filters"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            data-testid="button-apply-filters"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
