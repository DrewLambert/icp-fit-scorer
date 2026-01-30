import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from './OnboardingProvider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  PlayCircle, 
  Target, 
  Settings, 
  Users, 
  Zap, 
  Calculator, 
  Brain, 
  Activity,
  ShieldOff,
  HelpCircle,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Lightbulb
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  steps: string[];
}

const guides: GuideSection[] = [
  {
    id: 'scoring',
    title: 'Scoring Prospects',
    icon: <Target className="h-5 w-5" />,
    description: 'Learn how to analyze companies against your ICP',
    steps: [
      'Navigate to the Score page (home)',
      'Enter a company URL like "stripe.com" or paste company details',
      'Click "Enrich" to auto-fetch company data, or describe manually',
      'Select an outreach tone (casual, professional, bold)',
      'Click "Score Prospect" to run AI analysis',
      'Review the tier rating (A-D), score breakdown, and personalized outreach',
      'Click "Save to Prospects" to add to your database'
    ]
  },
  {
    id: 'batch',
    title: 'Batch Scoring',
    icon: <Users className="h-5 w-5" />,
    description: 'Score multiple companies at once',
    steps: [
      'Switch to the "Batch" tab on the Score page',
      'Enter one company per line (URLs or names)',
      'Click "Enrich All" to fetch data for all companies',
      'Click "Score All" to process the batch',
      'Review results and save individual or all prospects'
    ]
  },
  {
    id: 'ai-scoring',
    title: 'AI Scoring Configuration',
    icon: <Zap className="h-5 w-5" />,
    description: 'Customize AI-powered scoring criteria',
    steps: [
      'Go to Setup → AI tab',
      'Choose Standard (0-100) or GTM Partners (-5 to +5) scoring mode',
      'Adjust criteria weights (must total 100%)',
      'Higher weights = more influence on final score',
      'Save configuration to apply changes'
    ]
  },
  {
    id: 'rules',
    title: 'Rule-Based Scoring',
    icon: <Calculator className="h-5 w-5" />,
    description: 'Create deterministic scoring rules',
    steps: [
      'Go to Setup → Rules tab',
      'Enable rule-based scoring',
      'Create rules like "Job Title contains VP = +15 points"',
      'Set qualification threshold (e.g., 50 points)',
      'Rules run alongside AI scoring for hybrid approach'
    ]
  },
  {
    id: 'predictive',
    title: 'Predictive Scoring',
    icon: <Brain className="h-5 w-5" />,
    description: 'Train a model on your historical deals',
    steps: [
      'Go to Setup → Predictive tab',
      'Add historical closed-won and closed-lost deals',
      'Need minimum 50 deals for accurate predictions',
      'Click "Train Model" to analyze patterns',
      'Model predicts conversion probability for new leads'
    ]
  },
  {
    id: 'engagement',
    title: 'Engagement Scoring',
    icon: <Activity className="h-5 w-5" />,
    description: 'Track lead activity and engagement',
    steps: [
      'Go to Setup → Engage tab',
      'Enable engagement scoring',
      'Configure point values for actions (email opens, demos, etc.)',
      'Set hot/warm/cold thresholds',
      'Points decay over time to prioritize recent activity'
    ]
  },
  {
    id: 'negative',
    title: 'Negative Scoring',
    icon: <ShieldOff className="h-5 w-5" />,
    description: 'Auto-disqualify poor-fit leads',
    steps: [
      'Go to Setup → Negative tab',
      'Create disqualification rules (e.g., competitor domain = -50)',
      'Set auto-disqualify threshold',
      'Negative scores subtract from other models',
      'View disqualified leads with override option'
    ]
  },
  {
    id: 'compare',
    title: 'Comparing Prospects',
    icon: <Users className="h-5 w-5" />,
    description: 'Side-by-side prospect analysis',
    steps: [
      'Go to Prospects page',
      'Click the compare icon on up to 3 prospects',
      'Click "Compare" button when 2+ selected',
      'View side-by-side scores, criteria, and outreach',
      'Identify the best-fit prospect quickly'
    ]
  }
];

const faqs = [
  {
    q: 'What is ICP scoring?',
    a: 'ICP (Ideal Customer Profile) scoring analyzes how well a company matches your target customer characteristics. Higher scores indicate better fit and higher likelihood of conversion.'
  },
  {
    q: 'How accurate is the AI scoring?',
    a: 'AI scoring uses advanced language models to analyze company data against your criteria. Accuracy improves with better criteria definitions and enriched company data.'
  },
  {
    q: 'Can I use multiple scoring methods together?',
    a: 'Yes! Fitch supports a hybrid approach. AI scoring, rule-based scoring, predictive models, and engagement scores can all work together for comprehensive lead qualification.'
  },
  {
    q: 'What\'s the difference between tiers?',
    a: 'Tier A (80-100): Ideal fit, prioritize immediately. Tier B (60-79): Good fit, nurture actively. Tier C (40-59): Moderate fit, qualify further. Tier D (0-39): Poor fit, deprioritize.'
  },
  {
    q: 'How does engagement decay work?',
    a: 'Engagement points decrease over time based on your decay settings. This ensures recent activity is weighted more heavily than old interactions.'
  },
  {
    q: 'Can I export my prospects?',
    a: 'Prospects are saved locally and can be managed from the Prospects page. Export functionality can be extended based on your integration needs.'
  }
];

export function HelpCenter() {
  const { isHelpOpen, closeHelp, startTour, resetOnboarding } = useOnboarding();

  return (
    <AnimatePresence>
      {isHelpOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-end p-4"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={closeHelp}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-xl h-[90vh] fluid-card overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Help Center</h2>
                  <p className="text-sm text-muted-foreground">Guides, tutorials & FAQs</p>
                </div>
              </div>
              <button
                onClick={closeHelp}
                className="p-2 rounded-full hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b border-border/30 flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { closeHelp(); startTour(); }}
                className="gap-2 flex-1"
              >
                <PlayCircle className="h-4 w-4" />
                Take Tour
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetOnboarding}
                className="gap-2 flex-1"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Onboarding
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-8">
                {/* Guides */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Feature Guides</h3>
                  </div>
                  <div className="space-y-2">
                    {guides.map((guide) => (
                      <Accordion key={guide.id} type="single" collapsible>
                        <AccordionItem value={guide.id} className="border border-border/30 rounded-xl px-4 bg-secondary/20">
                          <AccordionTrigger className="hover:no-underline py-3">
                            <div className="flex items-center gap-3 text-left">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                                {guide.icon}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{guide.title}</p>
                                <p className="text-xs text-muted-foreground">{guide.description}</p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <ol className="space-y-2 ml-11">
                              {guide.steps.map((step, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium shrink-0">
                                    {index + 1}
                                  </span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ))}
                  </div>
                </section>

                {/* FAQs */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5 text-accent" />
                    <h3 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h3>
                  </div>
                  <Accordion type="single" collapsible className="space-y-2">
                    {faqs.map((faq, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`faq-${index}`}
                        className="border border-border/30 rounded-xl px-4 bg-secondary/20"
                      >
                        <AccordionTrigger className="hover:no-underline py-3 text-left">
                          <span className="font-medium text-foreground">{faq.q}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
