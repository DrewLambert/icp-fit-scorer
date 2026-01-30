import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldOff, CheckCircle, AlertTriangle, ChevronDown, ChevronRight, Undo2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useDisqualifiedLeads,
  useOverrideDisqualification,
  useRemoveDisqualification,
} from '@/hooks/useNegativeScoring';
import { DisqualifiedLead } from '@/types/negative-scoring';
import { formatDistanceToNow, format } from 'date-fns';

export function DisqualifiedLeadsView() {
  const { data: leads, isLoading } = useDisqualifiedLeads();
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [overrideLead, setOverrideLead] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'overridden'>('all');

  const overrideDisqualification = useOverrideDisqualification();
  const removeDisqualification = useRemoveDisqualification();

  const handleOverride = () => {
    if (!overrideLead || !overrideReason.trim()) return;
    overrideDisqualification.mutate(
      { leadId: overrideLead, reason: overrideReason },
      {
        onSuccess: () => {
          setOverrideLead(null);
          setOverrideReason('');
        },
      }
    );
  };

  const handleRemove = (leadId: string) => {
    if (confirm('Remove this lead from the disqualified list?')) {
      removeDisqualification.mutate(leadId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const filteredLeads = leads?.filter(lead => {
    if (filter === 'active') return !lead.is_overridden;
    if (filter === 'overridden') return lead.is_overridden;
    return true;
  }) || [];

  const activeCount = leads?.filter(l => !l.is_overridden).length || 0;
  const overriddenCount = leads?.filter(l => l.is_overridden).length || 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`p-3 rounded-lg border text-center transition-colors ${
            filter === 'all' ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30'
          }`}
        >
          <div className="text-2xl font-bold">{leads?.length || 0}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`p-3 rounded-lg border text-center transition-colors ${
            filter === 'active' ? 'border-destructive bg-destructive/10' : 'border-border bg-secondary/30'
          }`}
        >
          <div className="text-2xl font-bold text-destructive">{activeCount}</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </button>
        <button
          onClick={() => setFilter('overridden')}
          className={`p-3 rounded-lg border text-center transition-colors ${
            filter === 'overridden' ? 'border-success bg-success/10' : 'border-border bg-secondary/30'
          }`}
        >
          <div className="text-2xl font-bold text-success">{overriddenCount}</div>
          <div className="text-xs text-muted-foreground">Overridden</div>
        </button>
      </div>

      {/* Lead List */}
      {filteredLeads.length > 0 ? (
        <div className="space-y-2">
          {filteredLeads.map((lead, index) => (
            <LeadRow
              key={lead.id}
              lead={lead}
              index={index}
              isExpanded={expandedLead === lead.id}
              onToggle={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
              onOverride={() => setOverrideLead(lead.lead_id)}
              onRemove={() => handleRemove(lead.lead_id)}
            />
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="py-8 text-center">
            <ShieldOff className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No disqualified leads</p>
            <p className="text-sm text-muted-foreground">
              Leads hitting the negative threshold will appear here
            </p>
          </CardContent>
        </Card>
      )}

      {/* Override Modal */}
      <Dialog open={!!overrideLead} onOpenChange={() => setOverrideLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Disqualification</DialogTitle>
            <DialogDescription>
              Explain why this lead should be requalified despite negative signals
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Override Reason</Label>
              <Textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Verified as legitimate enterprise buyer..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOverrideLead(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleOverride}
              disabled={!overrideReason.trim() || overrideDisqualification.isPending}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Confirm Override
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface LeadRowProps {
  lead: DisqualifiedLead;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onOverride: () => void;
  onRemove: () => void;
}

function LeadRow({ lead, index, isExpanded, onToggle, onOverride, onRemove }: LeadRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-lg border overflow-hidden ${
        lead.is_overridden
          ? 'bg-success/5 border-success/30'
          : 'bg-destructive/5 border-destructive/30'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{lead.lead_id}</span>
              {lead.is_overridden ? (
                <Badge className="bg-success/20 text-success border-success/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Overridden
                </Badge>
              ) : (
                <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                  <ShieldOff className="h-3 w-3 mr-1" />
                  Disqualified
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(lead.disqualified_at), { addSuffix: true })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-destructive border-destructive/30">
            {lead.total_negative_score} pts
          </Badge>
          <Badge variant="outline">
            {lead.triggered_rules.length} rules
          </Badge>
        </div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-4 pb-4 border-t border-border/50"
        >
          <div className="pt-4 space-y-3">
            <h4 className="text-sm font-medium">Triggered Rules:</h4>
            <div className="space-y-2">
              {lead.triggered_rules.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded bg-secondary/30"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm">{rule.rule_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{rule.reason}</span>
                    <Badge variant="outline" className="text-destructive text-xs">
                      {rule.points}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {lead.is_overridden && lead.override_reason && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                <div className="text-xs text-success font-medium mb-1">Override Reason:</div>
                <p className="text-sm">{lead.override_reason}</p>
                {lead.overridden_at && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Overridden {format(new Date(lead.overridden_at), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {!lead.is_overridden && (
                <Button size="sm" variant="outline" onClick={onOverride} className="gap-2">
                  <Undo2 className="h-4 w-4" />
                  Override
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="text-destructive hover:text-destructive"
              >
                Remove
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
