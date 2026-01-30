import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useICPStore } from '@/stores/icpStore';
import { ProspectRow } from '@/components/ProspectRow';
import { CompareView } from '@/components/CompareView';
import { TopEngagedLeads } from '@/components/engagement-scoring/TopEngagedLeads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search, GitCompare, Trash2, TrendingUp, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useEngagementSettings } from '@/hooks/useEngagementScoring';

type SortField = 'tier' | 'score' | 'date' | 'name';
type SortOrder = 'asc' | 'desc';

export default function ProspectsPage() {
  const { prospects, removeProspect, clearProspects } = useICPStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('tier');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [activeTab, setActiveTab] = useState('prospects');
  
  const { data: engagementSettings } = useEngagementSettings();

  const tierOrder = { A: 0, B: 1, C: 2, D: 3 };

  const filteredProspects = prospects
    .filter((p) =>
      p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.companyDescription.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'tier':
          comparison = tierOrder[a.tier] - tierOrder[b.tier];
          if (comparison === 0) comparison = b.totalScore - a.totalScore;
          break;
        case 'score':
          comparison = a.totalScore - b.totalScore;
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name':
          comparison = a.companyName.localeCompare(b.companyName);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 3) {
        toast({
          title: 'Compare Limit',
          description: 'You can compare up to 3 prospects at a time.',
          variant: 'destructive',
        });
        return prev;
      }
      return [...prev, id];
    });
  };

  const compareProspects = prospects.filter((p) => compareIds.includes(p.id));

  const handleDelete = (id: string) => {
    removeProspect(id);
    setCompareIds((prev) => prev.filter((i) => i !== id));
    toast({
      title: 'Prospect Removed',
      description: 'The prospect has been deleted.',
    });
  };

  const handleClearAll = () => {
    clearProspects();
    setCompareIds([]);
    toast({
      title: 'All Prospects Cleared',
      description: 'Your prospect list has been emptied.',
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16">
      {/* Hero section - flowing */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 pt-8"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
        </motion.div>
        <h1 className="text-5xl sm:text-6xl font-bold gradient-text leading-tight">
          Prospects
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
          View, compare, and manage all your scored companies.
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex justify-center gap-2 mb-12 bg-transparent p-0">
          <TabsTrigger value="prospects" className="gap-2 px-6 py-2.5 rounded-full bg-secondary/20 data-[state=active]:bg-primary/15 data-[state=active]:text-primary border-0">
            <Target className="h-4 w-4" />
            Prospects
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-2 px-6 py-2.5 rounded-full bg-secondary/20 data-[state=active]:bg-primary/15 data-[state=active]:text-primary border-0" disabled={!engagementSettings?.engagement_enabled}>
            <TrendingUp className="h-4 w-4" />
            Engagement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prospects">
          {prospects.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search prospects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-secondary/50 border-border"
                  />
                </div>

                <div className="flex gap-2">
                  <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                    <SelectTrigger className="w-32 bg-secondary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tier">Tier</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="score">Score</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
                    <SelectTrigger className="w-28 bg-secondary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Desc</SelectItem>
                      <SelectItem value="asc">Asc</SelectItem>
                    </SelectContent>
                  </Select>

                  {compareIds.length >= 2 && (
                    <Button
                      onClick={() => setShowCompare(true)}
                      className="gap-2 bg-primary hover:bg-primary/90"
                    >
                      <GitCompare className="h-4 w-4" />
                      Compare ({compareIds.length})
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={handleClearAll}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </motion.div>

              <div className="space-y-3 mt-4">
                <AnimatePresence mode="popLayout">
                  {filteredProspects.map((prospect) => (
                    <ProspectRow
                      key={prospect.id}
                      prospect={prospect}
                      onDelete={handleDelete}
                      isComparing={compareIds.includes(prospect.id)}
                      onToggleCompare={() => toggleCompare(prospect.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {filteredProspects.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-muted-foreground">No prospects match your search.</p>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center py-20"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/30 mx-auto mb-6">
                <Users className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">No Prospects Yet</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Start scoring companies to build your prospect list.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90 rounded-full px-8">
                <a href="/">Score Your First Prospect</a>
              </Button>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="engagement">
          {engagementSettings?.engagement_enabled ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6"
            >
              <TopEngagedLeads 
                limit={15}
                onLeadClick={(leadId) => {
                  toast({
                    title: 'Lead Selected',
                    description: `Viewing engagement for ${leadId}`,
                  });
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/30 mx-auto mb-6">
                <TrendingUp className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">Engagement Scoring Disabled</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Enable engagement scoring in Settings, then Engage to track lead activity.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90 rounded-full px-8">
                <a href="/setup">Go to Settings</a>
              </Button>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {showCompare && compareProspects.length >= 2 && (
          <CompareView
            prospects={compareProspects}
            onRemove={(id) => {
              toggleCompare(id);
              if (compareIds.length <= 2) setShowCompare(false);
            }}
            onClose={() => setShowCompare(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
