import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Filter, ChevronRight, Flame, Sun, Snowflake } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTopEngagedLeads } from '@/hooks/useEngagementScoring';
import { TEMPERATURE_CONFIG, LeadEngagementSummary } from '@/types/engagement-scoring';
import { formatDistanceToNow } from 'date-fns';

const TIME_PERIODS = [
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '60', label: 'Last 60 days' },
  { value: '90', label: 'Last 90 days' },
];

interface TopEngagedLeadsProps {
  limit?: number;
  onLeadClick?: (leadId: string) => void;
}

export function TopEngagedLeads({ limit = 10, onLeadClick }: TopEngagedLeadsProps) {
  const [timePeriod, setTimePeriod] = useState('30');
  const { data: leads, isLoading } = useTopEngagedLeads(parseInt(timePeriod), limit);

  const getTemperatureIcon = (temp: string) => {
    switch (temp) {
      case 'hot': return <Flame className="h-4 w-4" />;
      case 'warm': return <Sun className="h-4 w-4" />;
      default: return <Snowflake className="h-4 w-4" />;
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Top Engaged Leads</CardTitle>
              <CardDescription>Most active leads by engagement score</CardDescription>
            </div>
          </div>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : leads && leads.length > 0 ? (
          <div className="space-y-2">
            {leads.map((lead, index) => (
              <LeadRow 
                key={lead.leadId} 
                lead={lead} 
                rank={index + 1}
                getTemperatureIcon={getTemperatureIcon}
                onClick={() => onLeadClick?.(lead.leadId)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No engagement data in this period</p>
            <p className="text-sm">Log engagement events to see top leads</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface LeadRowProps {
  lead: LeadEngagementSummary;
  rank: number;
  getTemperatureIcon: (temp: string) => React.ReactNode;
  onClick?: () => void;
}

function LeadRow({ lead, rank, getTemperatureIcon, onClick }: LeadRowProps) {
  const tempConfig = TEMPERATURE_CONFIG[lead.score.temperature];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
        {rank}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{lead.leadId}</span>
          <Badge className={`${tempConfig.color} text-xs`}>
            {getTemperatureIcon(lead.score.temperature)}
            <span className="ml-1">{tempConfig.label}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span>{lead.score.eventCount} interactions</span>
          {lead.score.lastActivity && (
            <span>Last: {formatDistanceToNow(new Date(lead.score.lastActivity), { addSuffix: true })}</span>
          )}
        </div>
      </div>

      <div className="text-right">
        <div className="font-bold text-lg">{lead.score.decayedScore}</div>
        <div className="text-xs text-muted-foreground">points</div>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}
