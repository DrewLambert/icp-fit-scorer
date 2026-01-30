import { motion } from 'framer-motion';
import { Flame, Sun, Snowflake, Activity, Clock, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EngagementScore, TEMPERATURE_CONFIG } from '@/types/engagement-scoring';
import { formatDistanceToNow } from 'date-fns';

interface EngagementScoreDisplayProps {
  score: EngagementScore;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function EngagementScoreDisplay({ score, showDetails = false, size = 'md' }: EngagementScoreDisplayProps) {
  const tempConfig = TEMPERATURE_CONFIG[score.temperature];
  
  const TemperatureIcon = score.temperature === 'hot' 
    ? Flame 
    : score.temperature === 'warm' 
      ? Sun 
      : Snowflake;

  const sizeClasses = {
    sm: { container: 'p-2', icon: 'h-4 w-4', text: 'text-sm', badge: 'text-xs' },
    md: { container: 'p-3', icon: 'h-5 w-5', text: 'text-base', badge: 'text-xs' },
    lg: { container: 'p-4', icon: 'h-6 w-6', text: 'text-lg', badge: 'text-sm' },
  };

  const classes = sizeClasses[size];
  const decayPercent = score.rawScore > 0 
    ? Math.round((score.decayedScore / score.rawScore) * 100) 
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-lg border ${tempConfig.color} ${classes.container}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TemperatureIcon className={`${classes.icon} animate-pulse`} />
          <div>
            <div className={`font-bold ${classes.text}`}>
              {score.decayedScore}
              <span className="text-muted-foreground font-normal ml-1">pts</span>
            </div>
            {showDetails && score.rawScore !== score.decayedScore && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingDown className="h-3 w-3" />
                      <span>{decayPercent}% of {score.rawScore}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Raw score before recency decay</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <Badge className={`${tempConfig.color} ${classes.badge}`}>
          {tempConfig.label}
        </Badge>
      </div>

      {showDetails && (
        <div className="mt-3 space-y-2">
          <Progress 
            value={Math.min(score.decayedScore, 100)} 
            className="h-2"
          />
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>{score.eventCount} interactions</span>
            </div>
            {score.lastActivity && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(score.lastActivity), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
