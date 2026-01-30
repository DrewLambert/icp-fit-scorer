import { motion } from 'framer-motion';
import { Mail, MessageSquare, Sparkles, MousePointer, Copy, Check, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { OutreachBlock as OutreachBlockType, OutreachTone, TONE_DEFINITIONS } from '@/types/icp';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface OutreachBlockProps {
  outreach: OutreachBlockType;
  companyName: string;
  companyDescription?: string;
  currentTone?: OutreachTone;
  onRegenerate?: (tone: OutreachTone) => Promise<OutreachBlockType | null>;
  // Legacy fallback
  legacyOpeningLine?: string;
}

export function OutreachBlock({ outreach: initialOutreach, companyName, companyDescription, currentTone, onRegenerate, legacyOpeningLine }: OutreachBlockProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [outreach, setOutreach] = useState(initialOutreach);
  const [activeTone, setActiveTone] = useState<OutreachTone | undefined>(currentTone);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = async () => {
    const fullEmail = `Subject: ${outreach.subjectLine}

${outreach.openingLine}

${outreach.valueHook}

${outreach.cta}`;
    await navigator.clipboard.writeText(fullEmail);
    setCopiedField('all');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRegenerate = async (tone: OutreachTone) => {
    if (!onRegenerate || isRegenerating) return;
    
    setIsRegenerating(true);
    try {
      const newOutreach = await onRegenerate(tone);
      if (newOutreach) {
        setOutreach(newOutreach);
        setActiveTone(tone);
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  // If no outreach block, fall back to legacy opening line
  if (!outreach && legacyOpeningLine) {
    return (
      <motion.div
        className="glass-card overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="border-b border-border/50 bg-primary/5 px-5 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Opening Line</h3>
          </div>
        </div>
        <div className="p-5">
          <p className="text-foreground leading-relaxed italic">"{legacyOpeningLine}"</p>
        </div>
      </motion.div>
    );
  }

  const sections = [
    { 
      id: 'subject', 
      icon: Mail, 
      label: 'Subject Line', 
      content: outreach.subjectLine,
      color: 'text-primary'
    },
    { 
      id: 'opening', 
      icon: MessageSquare, 
      label: 'Opening Hook', 
      content: outreach.openingLine,
      color: 'text-success'
    },
    { 
      id: 'value', 
      icon: Sparkles, 
      label: 'Value Hook', 
      content: outreach.valueHook,
      color: 'text-warning'
    },
    { 
      id: 'cta', 
      icon: MousePointer, 
      label: 'Call to Action', 
      content: outreach.cta,
      color: 'text-primary'
    },
  ];

  return (
    <motion.div
      className="fluid-section"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Header - minimal, flowing */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground">Outreach Block</h3>
            {activeTone && (
              <span className="text-xs text-muted-foreground capitalize">{activeTone} tone</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isRegenerating}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3" />
                      Regenerate
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {TONE_DEFINITIONS.map((tone) => (
                  <DropdownMenuItem
                    key={tone.id}
                    onClick={() => handleRegenerate(tone.id)}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="font-medium">{tone.name}</span>
                    <span className="text-xs text-muted-foreground">{tone.description}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyAll}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            {copiedField === 'all' ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy All
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Sections - flowing inline rows */}
      <div className="space-y-0">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className="inline-row group"
            >
              <div className={`shrink-0 ${section.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  {section.label}
                </p>
                <p className="text-foreground leading-relaxed">
                  {section.content}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(section.content, section.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 shrink-0"
              >
                {copiedField === section.id ? (
                  <Check className="h-3 w-3 text-success" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          );
        })}
      </div>
      
      {/* Footer - subtle, no box */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          Personalized for <span className="font-medium text-foreground">{companyName}</span>
        </p>
      </div>
    </motion.div>
  );
}
