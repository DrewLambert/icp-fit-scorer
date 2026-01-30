import { OutreachTone, TONE_DEFINITIONS } from '@/types/icp';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Smile, Briefcase, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToneSelectorProps {
  value: OutreachTone;
  onChange: (tone: OutreachTone) => void;
  disabled?: boolean;
}

const iconMap = {
  Smile: Smile,
  Briefcase: Briefcase,
  Zap: Zap,
};

export function ToneSelector({ value, onChange, disabled }: ToneSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">Outreach Tone</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as OutreachTone)}
        disabled={disabled}
        className="flex gap-3"
      >
        {TONE_DEFINITIONS.map((tone) => {
          const Icon = iconMap[tone.icon as keyof typeof iconMap];
          const isSelected = value === tone.id;
          
          return (
            <Label
              key={tone.id}
              htmlFor={tone.id}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full cursor-pointer transition-all",
                isSelected 
                  ? "bg-primary/15 text-primary ring-1 ring-primary/30" 
                  : "bg-secondary/30 hover:bg-secondary/50 text-muted-foreground hover:text-foreground",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <RadioGroupItem value={tone.id} id={tone.id} className="sr-only" />
              <Icon className={cn(
                "h-4 w-4",
                isSelected ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-sm font-medium",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {tone.name}
              </span>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
