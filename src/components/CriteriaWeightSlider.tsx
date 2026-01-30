import { Slider } from '@/components/ui/slider';
import { 
  Users, 
  Building2, 
  DollarSign, 
  Cpu, 
  TrendingUp, 
  Globe,
  LucideIcon 
} from 'lucide-react';
import { ICPCriteria } from '@/types/icp';

const iconMap: Record<string, LucideIcon> = {
  Users,
  Building2,
  DollarSign,
  Cpu,
  TrendingUp,
  Globe,
};

interface CriteriaWeightSliderProps {
  criteria: ICPCriteria;
  onWeightChange: (weight: number) => void;
  index: number;
}

export function CriteriaWeightSlider({ 
  criteria, 
  onWeightChange, 
  index 
}: CriteriaWeightSliderProps) {
  const Icon = iconMap[criteria.icon] || Building2;

  return (
    <div
      className="py-5 border-b border-border/30 last:border-0 hover-highlight rounded-xl"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{criteria.name}</h3>
            <span className="text-lg font-bold text-primary">{criteria.weight}%</span>
          </div>
          
          <p className="mt-1 text-sm text-muted-foreground">
            {criteria.description}
          </p>
          
          <div className="mt-4">
            <Slider
              value={[criteria.weight]}
              onValueChange={([value]) => onWeightChange(value)}
              max={50}
              min={0}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
