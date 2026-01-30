import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEngagementTypes, useLogEngagementEvent } from '@/hooks/useEngagementScoring';
import { CATEGORY_LABELS, EngagementCategory } from '@/types/engagement-scoring';
import * as Icons from 'lucide-react';

interface LogEngagementEventProps {
  leadId: string;
  trigger?: React.ReactNode;
}

export function LogEngagementEvent({ leadId, trigger }: LogEngagementEventProps) {
  const [open, setOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));

  const { data: types } = useEngagementTypes();
  const logEvent = useLogEngagementEvent();

  const enabledTypes = types?.filter(t => t.enabled) || [];
  const selectedType = types?.find(t => t.id === selectedTypeId);

  const categories = [...new Set(enabledTypes.map(t => t.category))] as EngagementCategory[];

  const handleSubmit = () => {
    if (!selectedTypeId || !selectedType) return;

    logEvent.mutate(
      {
        leadId,
        engagementTypeId: selectedTypeId,
        pointsEarned: selectedType.current_points,
        occurredAt: new Date(occurredAt).toISOString(),
      },
      {
        onSuccess: () => {
          setOpen(false);
          setSelectedTypeId('');
          setOccurredAt(new Date().toISOString().slice(0, 16));
        },
      }
    );
  };

  const getIcon = (iconName: string) => {
    const iconMap = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
    const Icon = iconMap[iconName] || Icons.Activity;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Log Engagement
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Engagement Event</DialogTitle>
          <DialogDescription>
            Record an interaction for lead: {leadId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Engagement Type</Label>
            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select interaction type" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {CATEGORY_LABELS[category]}
                    </div>
                    {enabledTypes
                      .filter(t => t.category === category)
                      .map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            {getIcon(type.icon)}
                            <span>{type.name}</span>
                            <span className="text-muted-foreground">({type.current_points} pts)</span>
                          </div>
                        </SelectItem>
                      ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedType && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-primary/10 border border-primary/30"
            >
              <div className="flex items-center gap-2">
                {getIcon(selectedType.icon)}
                <span className="font-medium">{selectedType.name}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedType.description || `Awards ${selectedType.current_points} points`}
              </p>
            </motion.div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              When did this occur?
            </Label>
            <Input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedTypeId || logEvent.isPending}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Log Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
