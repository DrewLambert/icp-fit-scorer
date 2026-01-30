import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useICPStore } from '@/stores/icpStore';
import { ProspectRow } from '@/components/ProspectRow';
import { CompareView } from '@/components/CompareView';
import { TopEngagedLeads } from '@/components/engagement-scoring/TopEngagedLeads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search, GitCompare, Trash2, TrendingUp, Target, Download, SlidersHorizontal, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useEngagementSettings } from '@/hooks/useEngagementScoring';
import { exportProspectsToCSV } from '@/lib/csv-export';
import { Tier } from '@/types/icp';
import { Link } from 'react-router-dom';

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
  const [showFilters, setShowFilters] = useState(false);
  const [tierFilter, setTierFilter] = useState<Tier | 'all'>('all');
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);

  const { data: engagementSettings } = useEngagementSettings();

  const tierOrder = { A: 0, B: 1, C: 2, D: 3 };

  const filteredProspects = prospects
    .filter((p) => {
      const matchesSearch =
        p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.companyDescription.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = tierFilter === 'all' || p.tier === tierFilter;
      const matchesScore = p.totalScore >= scoreRange[0] && p.totalScore <= scoreRange[1];
      return matchesSearch && matchesTier && matchesScore;
    })
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

  const handleExport = useCallback(() => {
    if (prospects.length === 0) {
      toast({
        title: 'No Data',
        description: 'There are no prospects to export.',
        variant: 'destructive',
      });
      return;
    }
    exportProspectsToCSV(filteredProspects.length > 0 ? filteredProspects : prospects);
    toast({
      title: 'Export Complete',
      description: `Exported ${filteredProspects.length || prospects.length} prospects to CSV.`,
    });
  }, [prospects, filteredProspects]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }
      if (mod && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('[data-search-input]');
        input?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExport]);

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

  const hasActiveFilters = tierFilter !== 'all' || scoreRange[0] > 0 || scoreRange[1] < 100;

  const clearFilters = () => {
    setTierFilter('all');
    setScoreRange([0, 100]);
    setSearchQuery('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16">
      {/* Hero section */}
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
                className="space-y-3"
              >
                {/* Search & Actions Row */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      data-search-input
                      placeholder="Search prospects... (Cmd+K)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-secondary/50 border-border"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
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

                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className={`gap-2 ${hasActiveFilters ? 'text-primary border-primary/30' : ''}`}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filter
                      {hasActiveFilters && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                          !
                        </span>
                      )}
                    </Button>

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
                      onClick={handleExport}
                      className="gap-2"
                      title="Export to CSV (Cmd+E)"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleClearAll}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Clear All</span>
                    </Button>
                  </div>
                </div>

                {/* Filter Panel */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row gap-6 py-4 px-4 rounded-2xl bg-secondary/10">
                        <div className="space-y-2 flex-1">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tier</label>
                          <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as Tier | 'all')}>
                            <SelectTrigger className="bg-secondary/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Tiers</SelectItem>
                              <SelectItem value="A">Tier A</SelectItem>
                              <SelectItem value="B">Tier B</SelectItem>
                              <SelectItem value="C">Tier C</SelectItem>
                              <SelectItem value="D">Tier D</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 flex-1">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Score Range: {scoreRange[0]} - {scoreRange[1]}
                          </label>
                          <Slider
                            value={scoreRange}
                            onValueChange={(v) => setScoreRange(v as [number, number])}
                            min={0}
                            max={100}
                            step={5}
                            className="mt-3"
                          />
                        </div>

                        {hasActiveFilters && (
                          <div className="flex items-end">
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                              <X className="h-3 w-3" />
                              Clear
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                  <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No prospects match your search or filters.</p>
                  {hasActiveFilters && (
                    <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">
                      Clear all filters
                    </Button>
                  )}
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
              <div className="relative mx-auto mb-8 w-40 h-40">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-accent/5 animate-pulse" />
                <div className="absolute inset-4 rounded-full bg-secondary/20 flex items-center justify-center">
                  <div className="space-y-2">
                    <Users className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                    <div className="flex gap-1 justify-center">
                      {['A', 'B', 'C'].map((tier) => (
                        <span
                          key={tier}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary/40"
                        >
                          {tier}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">No Prospects Yet</h3>
              <p className="text-muted-foreground mb-2 max-w-sm mx-auto">
                Score your first company to start building your prospect pipeline.
              </p>
              <p className="text-xs text-muted-foreground/60 mb-8 max-w-xs mx-auto">
                Each scored company gets a tier (A-D), criteria breakdown, and AI-generated outreach.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90 rounded-full px-8">
                <Link to="/">Score Your First Prospect</Link>
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
                <Link to="/setup">Go to Settings</Link>
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
              const remaining = compareIds.filter((i) => i !== id);
              setCompareIds(remaining);
              if (remaining.length < 2) setShowCompare(false);
            }}
            onClose={() => setShowCompare(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
