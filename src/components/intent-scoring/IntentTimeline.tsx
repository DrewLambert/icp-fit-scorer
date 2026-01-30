import { formatDistanceToNow, format } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  IntentSignal, 
  FIRST_PARTY_SIGNAL_LABELS, 
  THIRD_PARTY_SIGNAL_LABELS,
  CONFIDENCE_COLORS,
  FirstPartySignalType,
  ThirdPartySignalType,
} from '@/types/intent-scoring';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Play,
  Package,
  Mail,
  MousePointerClick,
  Reply,
  UserPlus,
  Search,
  Zap,
  GitCompare,
  Activity,
  Trash2,
  Eye,
  ExternalLink,
} from 'lucide-react';

interface IntentTimelineProps {
  signals: IntentSignal[];
  onDeleteFirstParty?: (id: string) => void;
  onDeleteThirdParty?: (id: string) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  pricing_page: DollarSign,
  demo_page: Play,
  product_page: Package,
  email_open: Mail,
  email_click: MousePointerClick,
  email_reply: Reply,
  trial_signup: UserPlus,
  comparison_page: GitCompare,
  g2_research: Search,
  trustradius_research: Search,
  competitor_comparison: GitCompare,
  intent_provider: Zap,
  capterra_research: Search,
  other: Activity,
};

export function IntentTimeline({ signals, onDeleteFirstParty, onDeleteThirdParty }: IntentTimelineProps) {
  if (signals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No intent signals recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {signals.map((signal, index) => {
        const isFirstParty = signal.source === 'first_party';
        const signalType = isFirstParty 
          ? (signal as IntentSignal & { source: 'first_party' }).signal_type as FirstPartySignalType
          : (signal as IntentSignal & { source: 'third_party' }).signal_type as ThirdPartySignalType;
        
        const label = isFirstParty 
          ? FIRST_PARTY_SIGNAL_LABELS[signalType as FirstPartySignalType]
          : THIRD_PARTY_SIGNAL_LABELS[signalType as ThirdPartySignalType];
        
        const Icon = iconMap[signalType] || Activity;

        return (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative pl-8"
          >
            {/* Timeline line */}
            {index < signals.length - 1 && (
              <div className="absolute left-3 top-8 bottom-0 w-px bg-border" />
            )}
            
            {/* Timeline dot */}
            <div className={`absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full ${
              isFirstParty 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-purple-500/20 text-purple-400'
            }`}>
              <Icon className="h-3 w-3" />
            </div>

            <div className="glass-card p-3 hover:bg-secondary/20 transition-colors group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{label}</span>
                    <Badge variant="outline" className="text-xs">
                      {isFirstParty ? 'First-Party' : 'Third-Party'}
                    </Badge>
                    {!isFirstParty && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${CONFIDENCE_COLORS[(signal as IntentSignal & { source: 'third_party' }).confidence_level]}`}
                      >
                        {(signal as IntentSignal & { source: 'third_party' }).confidence_level} confidence
                      </Badge>
                    )}
                  </div>

                  {/* Details */}
                  <div className="mt-1 space-y-1">
                    {isFirstParty ? (
                      <>
                        {(signal as IntentSignal & { source: 'first_party' }).page_url && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {(signal as IntentSignal & { source: 'first_party' }).page_url}
                          </p>
                        )}
                        {(signal as IntentSignal & { source: 'first_party' }).visit_count > 1 && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {(signal as IntentSignal & { source: 'first_party' }).visit_count} visits
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Source: {(signal as IntentSignal & { source: 'third_party' }).source_name}
                        </p>
                        {(signal as IntentSignal & { source: 'third_party' }).notes && (
                          <p className="text-xs text-muted-foreground italic">
                            "{(signal as IntentSignal & { source: 'third_party' }).notes}"
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                    <span>{formatDistanceToNow(new Date(signal.observed_at), { addSuffix: true })}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <span>{format(new Date(signal.observed_at), 'MMM d, yyyy h:mm a')}</span>
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    if (isFirstParty && onDeleteFirstParty) {
                      onDeleteFirstParty(signal.id);
                    } else if (!isFirstParty && onDeleteThirdParty) {
                      onDeleteThirdParty(signal.id);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
