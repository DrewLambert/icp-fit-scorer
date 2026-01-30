import { useMemo } from 'react';
import { useICPStore } from '@/stores/icpStore';
import { BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area,
} from 'recharts';
import { Tier } from '@/types/icp';

const TIER_COLORS: Record<Tier, string> = {
  A: 'hsl(142, 69%, 58%)',
  B: 'hsl(187, 82%, 53%)',
  C: 'hsl(45, 93%, 56%)',
  D: 'hsl(0, 72%, 68%)',
};

export default function DashboardPage() {
  const { prospects } = useICPStore();

  const tierCounts = useMemo(() => {
    const counts: Record<Tier, number> = { A: 0, B: 0, C: 0, D: 0 };
    prospects.forEach((p) => { counts[p.tier]++; });
    return counts;
  }, [prospects]);

  const tierPieData = useMemo(() => {
    return (['A', 'B', 'C', 'D'] as Tier[])
      .filter((t) => tierCounts[t] > 0)
      .map((tier) => ({
        name: `Tier ${tier}`,
        value: tierCounts[tier],
        fill: TIER_COLORS[tier],
      }));
  }, [tierCounts]);

  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: '0-19', min: 0, max: 19, count: 0 },
      { range: '20-39', min: 20, max: 39, count: 0 },
      { range: '40-59', min: 40, max: 59, count: 0 },
      { range: '60-79', min: 60, max: 79, count: 0 },
      { range: '80-100', min: 80, max: 100, count: 0 },
    ];
    prospects.forEach((p) => {
      const bucket = buckets.find((b) => p.totalScore >= b.min && p.totalScore <= b.max);
      if (bucket) bucket.count++;
    });
    return buckets;
  }, [prospects]);

  const scoringTrends = useMemo(() => {
    if (prospects.length === 0) return [];
    const sorted = [...prospects].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let runningTotal = 0;
    return sorted.map((p, i) => {
      runningTotal += p.totalScore;
      return {
        name: p.companyName.length > 12 ? p.companyName.slice(0, 12) + '...' : p.companyName,
        score: p.totalScore,
        avg: Math.round(runningTotal / (i + 1)),
      };
    });
  }, [prospects]);

  const criteriaGaps = useMemo(() => {
    if (prospects.length === 0) return [];
    const criteriaMap: Record<string, { name: string; totalPct: number; count: number }> = {};
    prospects.forEach((p) => {
      p.criteriaBreakdown.forEach((c) => {
        if (!criteriaMap[c.criteriaId]) {
          criteriaMap[c.criteriaId] = { name: c.criteriaName, totalPct: 0, count: 0 };
        }
        const pct = c.maxScore > 0 ? (c.score / c.maxScore) * 100 : 0;
        criteriaMap[c.criteriaId].totalPct += pct;
        criteriaMap[c.criteriaId].count++;
      });
    });
    return Object.values(criteriaMap)
      .map((c) => ({ name: c.name, avgScore: Math.round(c.totalPct / c.count) }))
      .sort((a, b) => a.avgScore - b.avgScore);
  }, [prospects]);

  if (prospects.length === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-16">
        <div className="space-y-4 pt-8">
          <h1 className="text-h1 text-foreground">
            Dashboard
          </h1>
        </div>
        <div className="text-center py-20">
          <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-foreground mb-3">No Data Yet</h3>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Score some prospects first to see analytics and insights here.
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90 rounded px-8">
            <Link to="/">Score Your First Prospect</Link>
          </Button>
        </div>
      </div>
    );
  }

  const avgScore = Math.round(prospects.reduce((s, p) => s + p.totalScore, 0) / prospects.length);

  return (
    <div className="max-w-6xl mx-auto space-y-16">
      <div className="space-y-4 pt-8">
        <h1 className="text-h1 text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground max-w-xl text-body-lg">
          Analytics and insights across {prospects.length} scored prospect{prospects.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Prospects', value: prospects.length },
          { label: 'Avg Score', value: avgScore },
          { label: 'Tier A', value: tierCounts.A },
          { label: 'Needs Work', value: tierCounts.C + tierCounts.D },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg bg-card border border-border p-5 space-y-2">
            <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Score Distribution */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Score Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <XAxis dataKey="range" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <RechartsTooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tier Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Tier Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {tierPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scoring Trends */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Scoring Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoringTrends}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <RechartsTooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="avg" stroke="hsl(var(--muted-foreground))" fill="none" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Criteria Gaps */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Criteria Gaps</h3>
          {criteriaGaps.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={criteriaGaps} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Radar dataKey="avgScore" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No criteria data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
