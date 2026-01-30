import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ThirdPartySignalType, ConfidenceLevel, THIRD_PARTY_SIGNAL_LABELS } from '@/types/intent-scoring';
import { Plus } from 'lucide-react';

interface AddThirdPartySignalProps {
  leadId: string;
  onAdd: (signal: {
    lead_id: string;
    source_name: string;
    signal_type: ThirdPartySignalType;
    confidence_level: ConfidenceLevel;
    notes?: string;
    observed_at?: string;
  }) => Promise<unknown>;
}

export function AddThirdPartySignal({ leadId, onAdd }: AddThirdPartySignalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    source_name: '',
    signal_type: 'g2_research' as ThirdPartySignalType,
    confidence_level: 'medium' as ConfidenceLevel,
    notes: '',
    observed_at: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onAdd({
        lead_id: leadId,
        source_name: formData.source_name,
        signal_type: formData.signal_type,
        confidence_level: formData.confidence_level,
        notes: formData.notes || undefined,
        observed_at: new Date(formData.observed_at).toISOString(),
      });
      
      setOpen(false);
      setFormData({
        source_name: '',
        signal_type: 'g2_research',
        confidence_level: 'medium',
        notes: '',
        observed_at: new Date().toISOString().split('T')[0],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Third-Party Signal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Third-Party Intent Signal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source_name">Source Name</Label>
            <Input
              id="source_name"
              placeholder="e.g., G2, Bombora, TrustRadius"
              value={formData.source_name}
              onChange={(e) => setFormData(prev => ({ ...prev, source_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signal_type">Signal Type</Label>
            <Select
              value={formData.signal_type}
              onValueChange={(v) => setFormData(prev => ({ ...prev, signal_type: v as ThirdPartySignalType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(THIRD_PARTY_SIGNAL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidence_level">Confidence Level</Label>
            <Select
              value={formData.confidence_level}
              onValueChange={(v) => setFormData(prev => ({ ...prev, confidence_level: v as ConfidenceLevel }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observed_at">Date Observed</Label>
            <Input
              id="observed_at"
              type="date"
              value={formData.observed_at}
              onChange={(e) => setFormData(prev => ({ ...prev, observed_at: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., Viewed competitor comparison page"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.source_name}>
              {isSubmitting ? 'Adding...' : 'Add Signal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
