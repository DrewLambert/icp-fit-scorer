import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { Search, GitCompare, Trash2, Download, SlidersHorizontal, X } from 'lucide-react';
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
      <div className="space-y-4 pt-8">
        <h1 className="text-h1 text-foreground">
          Prospects
        </h1>
        <p className="text-muted-foreground max-w-xl text-body-lg">
          View, compare, and manage all your scored companies.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex justify-start gap-2 mb-12 bg-transparent p-0">
          <TabsTrigger value="prospects" className="px-5 py-2 rounded text-sm bg-secondary data-[state=active]:bg-primary/15 data-[state=active]:text-primary border-0">
            Prospects
          </TabsTrigger>
          <TabsTrigger value="engagement" className="px-5 py-2 rounded text-sm bg-secondary data-[state=active]:bg-primary/15 data-[state=active]:text-primary border-0" disabled={!engagementSettings?.engagement_enabled}>
            Engagement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prospects">
          {prospects.length > 0 ? (
            <>
              <div className="space-y-3">
                {/* Search & Actions Row */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      data-search-input
                      placeholder="Search prospects... (Cmd+K)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-secondary border-border"
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                      <SelectTrigger className="w-32 bg-secondary">
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
                      <SelectTrigger className="w-28 bg-secondary">
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
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row gap-6 py-4 px-4 rounded-lg bg-secondary">
                        <div className="space-y-2 flex-1">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tier</label>
                          <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as Tier | 'all')}>
                            <SelectTrigger className="bg-background">
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
              </div>

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
                <div className="text-center py-12">
                  <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No prospects match your search or filters.</p>
                  {hasActiveFilters && (
                    <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">
                      Clear all filters
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-semibold text-foreground mb-3">No Prospects Yet</h3>
              <p className="text-muted-foreground mb-2 max-w-sm mx-auto">
                Score your first company to start building your prospect pipeline.
              </p>
              <p className="text-xs text-muted-foreground/60 mb-8 max-w-xs mx-auto">
                Each scored company gets a tier (A-D), criteria breakdown, and AI-generated outreach.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90 rounded px-8">
                <Link to="/">Score Your First Prospect</Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="engagement">
          {engagementSettings?.engagement_enabled ? (
            <div className="grid gap-6">
              <TopEngagedLeads
                limit={15}
                onLeadClick={(leadId) => {
                  toast({
                    title: 'Lead Selected',
                    description: `Viewing engagement for ${leadId}`,
                  });
                }}
              />
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-semibold text-foreground mb-3">Engagement Scoring Disabled</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Enable engagement scoring in Settings, then Engage to track lead activity.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90 rounded px-8">
                <Link to="/setup">Go to Settings</Link>
              </Button>
            </div>
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
