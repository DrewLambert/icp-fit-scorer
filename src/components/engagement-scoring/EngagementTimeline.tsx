import { motion } from 'framer-motion';
import { Clock, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeadEngagementEvents, useEngagementSettings } from '@/hooks/useEngagementScoring';
import { calculateDecayMultiplier, CATEGORY_LABELS, EngagementCategory } from '@/types/engagement-scoring';
import { format, formatDistanceToNow } from 'date-fns';
import * as Icons from 'lucide-react';

interface EngagementTimelineProps {
  leadId: string;
  limit?: number;
}

export function EngagementTimeline({ leadId, limit = 20 }: EngagementTimelineProps) {
  const { data: events, isLoading: eventsLoading } = useLeadEngagementEvents(leadId);
  const { data: settings } = useEngagementSettings();

  const getIcon = (iconName: string) => {
    const iconMap = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
    const Icon = iconMap[iconName] || Icons.Activity;
    return <Icon className="h-4 w-4" />;
  };

  const getCategoryColor = (category: EngagementCategory) => {
    const colors: Record<EngagementCategory, string> = {
      email: 'bg-info/20 text-info border-info/30',
      content: 'bg-success/20 text-success border-success/30',
      web: 'bg-primary/20 text-primary border-primary/30',
      social: 'bg-accent/20 text-accent border-accent/30',
      event: 'bg-warning/20 text-warning border-warning/30',
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  if (eventsLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayEvents = events?.slice(0, limit) || [];

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Engagement Timeline</CardTitle>
            <CardDescription>
              {events?.length || 0} interactions recorded
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {displayEvents.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {displayEvents.map((event, index) => {
                const type = event.engagement_type;
                const category = (type?.category || 'web') as EngagementCategory;
                const decayMultiplier = settings 
                  ? calculateDecayMultiplier(event.occurred_at, settings.decay_period_days) 
                  : 1;
                const decayedPoints = Math.round(event.points_earned * decayMultiplier);

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative pl-10"
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-2 top-3 h-4 w-4 rounded-full border-2 bg-background ${getCategoryColor(category)}`}>
                      <div className="absolute inset-1 rounded-full bg-current opacity-50" />
                    </div>

                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {type && getIcon(type.icon)}
                          <span className="font-medium">{type?.name || 'Unknown'}</span>
                          <Badge className={`${getCategoryColor(category)} text-xs`}>
                            {CATEGORY_LABELS[category]}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{event.points_earned} pts</div>
                          {decayedPoints < event.points_earned && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <TrendingDown className="h-3 w-3" />
                              <span>Now {decayedPoints}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{format(new Date(event.occurred_at), 'MMM d, yyyy h:mm a')}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                        <span>{formatDistanceToNow(new Date(event.occurred_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {events && events.length > limit && (
              <div className="mt-4 text-center">
                <Badge variant="outline">
                  +{events.length - limit} more events
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No engagement events recorded</p>
            <p className="text-sm">Log interactions to build the timeline</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
