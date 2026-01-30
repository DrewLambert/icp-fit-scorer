import { motion } from 'framer-motion';
import { 
  Users, 
  Building2, 
  DollarSign, 
  Cpu, 
  TrendingUp, 
  Globe,
  LucideIcon 
} from 'lucide-react';
import { CriteriaScore } from '@/types/icp';

const iconMap: Record<string, LucideIcon> = {
  Users,
  Building2,
  DollarSign,
  Cpu,
  TrendingUp,
  Globe,
};

interface CriteriaCardProps {
  criteria: CriteriaScore;
  index: number;
}

export function CriteriaCard({ criteria, index }: CriteriaCardProps) {
  const Icon = iconMap[criteria.icon] || Building2;
  const percentage = Math.round((criteria.score / criteria.maxScore) * 100);
  
  const getBarColor = () => {
    if (percentage <= 40) return 'bg-score-poor';
    if (percentage <= 70) return 'bg-score-moderate';
    return 'bg-score-strong';
  };

  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.4 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-foreground truncate">
              {criteria.criteriaName}
            </h4>
            <span className="text-sm font-semibold text-muted-foreground shrink-0">
              {criteria.score}/{criteria.maxScore}
            </span>
          </div>
          
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <motion.div
              className={`h-full rounded-full ${getBarColor()}`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ delay: 0.2 + 0.1 * index, duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {criteria.reasoning}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
