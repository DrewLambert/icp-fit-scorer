import { useState } from 'react';
import { motion } from 'framer-motion';
import { useIntentScoring } from '@/hooks/useIntentScoring';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Target,
  ChevronDown,
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
} from 'lucide-react';

export function IntentSettings() {
  const {
    settings,
    isLoading,
    toggleIntentScoring,
    updateSettings,
  } = useIntentScoring();

  const [firstPartyOpen, setFirstPartyOpen] = useState(true);
  const [thirdPartyOpen, setThirdPartyOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20">
              <Target className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Intent-Based Lead Scoring
                {settings?.intent_enabled && (
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                    Active
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                Score leads based on buying intent signals
              </p>
            </div>
          </div>

          <Switch
            checked={settings?.intent_enabled || false}
            onCheckedChange={toggleIntentScoring}
          />
        </div>

        {/* In-Market Threshold */}
        <div className="p-4 rounded-lg bg-secondary/30 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">In-Market Threshold</Label>
              <p className="text-xs text-muted-foreground">
                Leads scoring above this are marked as "In-Market"
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings?.in_market_threshold || 50}
                onChange={(e) => updateSettings({ in_market_threshold: parseInt(e.target.value) || 50 })}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">points</span>
            </div>
          </div>

          {/* Category Weights */}
          <div className="pt-4 border-t border-border">
            <Label className="text-sm font-medium mb-3 block">Category Weights</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>First-Party Signals</span>
                  <span className="font-mono">{Math.round((settings?.first_party_weight || 0.7) * 100)}%</span>
                </div>
                <Slider
                  value={[(settings?.first_party_weight || 0.7) * 100]}
                  onValueChange={([v]) => updateSettings({ 
                    first_party_weight: v / 100,
                    third_party_weight: (100 - v) / 100 
                  })}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Third-Party Signals</span>
                  <span className="font-mono">{Math.round((settings?.third_party_weight || 0.3) * 100)}%</span>
                </div>
                <Slider
                  value={[(settings?.third_party_weight || 0.3) * 100]}
                  onValueChange={([v]) => updateSettings({ 
                    third_party_weight: v / 100,
                    first_party_weight: (100 - v) / 100 
                  })}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* First-Party Signal Weights */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Collapsible open={firstPartyOpen} onOpenChange={setFirstPartyOpen}>
          <div className="glass-card overflow-hidden">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-secondary/20 transition-colors">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">First-Party Signal Weights</h4>
                <Badge variant="outline" className="text-xs">Your Data</Badge>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${firstPartyOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-3">
                <SignalWeightRow
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Pricing Page Visit"
                  value={settings?.pricing_page_weight || 25}
                  onChange={(v) => updateSettings({ pricing_page_weight: v })}
                />
                <SignalWeightRow
                  icon={<Play className="h-4 w-4" />}
                  label="Demo Page Visit"
                  value={settings?.demo_page_weight || 30}
                  onChange={(v) => updateSettings({ demo_page_weight: v })}
                />
                <SignalWeightRow
                  icon={<Package className="h-4 w-4" />}
                  label="Product Page Visit"
                  value={settings?.product_page_weight || 15}
                  onChange={(v) => updateSettings({ product_page_weight: v })}
                />
                <SignalWeightRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Email Open"
                  value={settings?.email_open_weight || 5}
                  onChange={(v) => updateSettings({ email_open_weight: v })}
                />
                <SignalWeightRow
                  icon={<MousePointerClick className="h-4 w-4" />}
                  label="Email Click"
                  value={settings?.email_click_weight || 10}
                  onChange={(v) => updateSettings({ email_click_weight: v })}
                />
                <SignalWeightRow
                  icon={<Reply className="h-4 w-4" />}
                  label="Email Reply"
                  value={settings?.email_reply_weight || 20}
                  onChange={(v) => updateSettings({ email_reply_weight: v })}
                />
                <SignalWeightRow
                  icon={<UserPlus className="h-4 w-4" />}
                  label="Trial/Demo Signup"
                  value={settings?.trial_signup_weight || 35}
                  onChange={(v) => updateSettings({ trial_signup_weight: v })}
                />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </motion.div>

      {/* Third-Party Signal Weights */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Collapsible open={thirdPartyOpen} onOpenChange={setThirdPartyOpen}>
          <div className="glass-card overflow-hidden">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-secondary/20 transition-colors">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">Third-Party Signal Weights</h4>
                <Badge variant="outline" className="text-xs">External Data</Badge>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${thirdPartyOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-3">
                <SignalWeightRow
                  icon={<Search className="h-4 w-4" />}
                  label="G2 Research"
                  value={settings?.g2_research_weight || 20}
                  onChange={(v) => updateSettings({ g2_research_weight: v })}
                />
                <SignalWeightRow
                  icon={<Search className="h-4 w-4" />}
                  label="TrustRadius Research"
                  value={settings?.trustradius_weight || 20}
                  onChange={(v) => updateSettings({ trustradius_weight: v })}
                />
                <SignalWeightRow
                  icon={<GitCompare className="h-4 w-4" />}
                  label="Competitor Research"
                  value={settings?.competitor_research_weight || 15}
                  onChange={(v) => updateSettings({ competitor_research_weight: v })}
                />
                <SignalWeightRow
                  icon={<Zap className="h-4 w-4" />}
                  label="Intent Provider (Bombora, etc.)"
                  value={settings?.intent_provider_weight || 25}
                  onChange={(v) => updateSettings({ intent_provider_weight: v })}
                />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-5"
      >
        <h4 className="font-semibold text-foreground mb-3">How It Works</h4>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Intent scoring identifies leads actively researching solutions like yours by tracking 
            buying signals from your website (first-party) and external sources (third-party).
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
              <p className="font-medium text-foreground mb-1">First-Party Signals</p>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary/60" />Pricing/demo page visits</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary/60" />Email engagement</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary/60" />Trial signups</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-primary/60" />Product comparisons</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
              <p className="font-medium text-foreground mb-1">Third-Party Signals</p>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-accent/60" />G2/TrustRadius research</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-accent/60" />Competitor comparisons</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-accent/60" />Intent provider data</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-accent/60" />Manual observations</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SignalWeightRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/50">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="w-16 h-8 text-sm"
        />
        <span className="text-xs text-muted-foreground">pts</span>
      </div>
    </div>
  );
}
