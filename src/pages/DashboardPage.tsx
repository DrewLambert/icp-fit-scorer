import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useICPStore } from '@/stores/icpStore';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area,
} from 'recharts';
import { Tier } from '@/types/icp';

const TIER_COLORS: Record<Tier, string> = {
  A: 'hsl(85, 45%, 50%)',
  B: 'hsl(25, 85%, 55%)',
  C: 'hsl(42, 90%, 55%)',
  D: 'hsl(0, 65%, 55%)',
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 pt-8"
        >
          <div className="inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold gradient-text leading-tight">
            Dashboard
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center py-20"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/30 mx-auto mb-6">
            <BarChart3 className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-2xl font-semibold text-foreground mb-3">No Data Yet</h3>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Score some prospects first to see analytics and insights here.
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90 rounded-full px-8">
            <Link to="/">Score Your First Prospect</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  const avgScore = Math.round(prospects.reduce((s, p) => s + p.totalScore, 0) / prospects.length);

  return (
    <div className="max-w-6xl mx-auto space-y-16">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 pt-8"
      >
        <div className="inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold gradient-text leading-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
          Analytics and insights across {prospects.length} scored prospect{prospects.length !== 1 ? 's' : ''}.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Prospects', value: prospects.length, icon: BarChart3 },
          { label: 'Avg Score', value: avgScore, icon: TrendingUp },
          { label: 'Tier A', value: tierCounts.A, icon: PieChartIcon },
          { label: 'Needs Work', value: tierCounts.C + tierCounts.D, icon: AlertTriangle },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl bg-secondary/20 p-5 text-center space-y-2">
            <kpi.icon className="h-5 w-5 text-primary mx-auto" />
            <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Score Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-foreground">Score Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <XAxis dataKey="range" tick={{ fill: 'hsl(30, 10%, 55%)', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(30, 10%, 55%)', fontSize: 12 }} />
                <RechartsTooltip
                  contentStyle={{
                    background: 'hsl(20, 12%, 9%)',
                    border: '1px solid hsl(25, 8%, 18%)',
                    borderRadius: '0.75rem',
                    color: 'hsl(35, 25%, 95%)',
                  }}
                />
                <Bar dataKey="count" fill="hsl(25, 85%, 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Tier Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
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
                    background: 'hsl(20, 12%, 9%)',
                    border: '1px solid hsl(25, 8%, 18%)',
                    borderRadius: '0.75rem',
                    color: 'hsl(35, 25%, 95%)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Scoring Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-foreground">Scoring Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoringTrends}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(30, 10%, 55%)', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'hsl(30, 10%, 55%)', fontSize: 12 }} />
                <RechartsTooltip
                  contentStyle={{
                    background: 'hsl(20, 12%, 9%)',
                    border: '1px solid hsl(25, 8%, 18%)',
                    borderRadius: '0.75rem',
                    color: 'hsl(35, 25%, 95%)',
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="hsl(25, 85%, 55%)" fill="hsl(25, 85%, 55%)" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="avg" stroke="hsl(38, 75%, 58%)" fill="none" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Criteria Gaps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-foreground">Criteria Gaps</h3>
          {criteriaGaps.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={criteriaGaps} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="hsl(25, 8%, 18%)" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(30, 10%, 55%)', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'hsl(30, 10%, 55%)', fontSize: 10 }} />
                  <Radar dataKey="avgScore" stroke="hsl(25, 85%, 55%)" fill="hsl(25, 85%, 55%)" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No criteria data available.</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
