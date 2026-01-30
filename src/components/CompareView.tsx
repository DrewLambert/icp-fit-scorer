import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ProspectScore, Tier } from '@/types/icp';
import { ScoreGauge } from './ScoreGauge';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend,
} from 'recharts';

interface CompareViewProps {
  prospects: ProspectScore[];
  onRemove: (id: string) => void;
  onClose: () => void;
}

const RADAR_COLORS = [
  'hsl(25, 85%, 55%)',
  'hsl(200, 55%, 55%)',
  'hsl(85, 45%, 50%)',
];

export function CompareView({ prospects, onRemove, onClose }: CompareViewProps) {
  if (prospects.length < 2) return null;

  const sorted = [...prospects].sort((a, b) => {
    const tierOrder: Record<Tier, number> = { A: 0, B: 1, C: 2, D: 3 };
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  // Build radar chart data
  const radarData = useMemo(() => {
    const criteriaNames = new Set<string>();
    sorted.forEach((p) =>
      p.criteriaBreakdown.forEach((c) => criteriaNames.add(c.criteriaName))
    );

    return Array.from(criteriaNames).map((name) => {
      const point: Record<string, string | number> = { criteria: name };
      sorted.forEach((p) => {
        const c = p.criteriaBreakdown.find((cb) => cb.criteriaName === name);
        point[p.companyName] = c && c.maxScore > 0
          ? Math.round((c.score / c.maxScore) * 100)
          : 0;
      });
      return point;
    });
  }, [sorted]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-card w-full max-w-6xl max-h-[90vh] overflow-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-card/95 backdrop-blur-sm px-6 py-4">
          <h2 className="text-xl font-bold">Compare Prospects</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close comparison">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {/* Radar Chart */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(25, 8%, 18%)" />
                <PolarAngleAxis dataKey="criteria" tick={{ fill: 'hsl(30, 10%, 55%)', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'hsl(30, 10%, 55%)', fontSize: 10 }} />
                {sorted.map((p, i) => (
                  <Radar
                    key={p.id}
                    name={p.companyName}
                    dataKey={p.companyName}
                    stroke={RADAR_COLORS[i]}
                    fill={RADAR_COLORS[i]}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                ))}
                <Legend wrapperStyle={{ color: 'hsl(30, 10%, 55%)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Side-by-side detail cards */}
          <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${sorted.length}, 1fr)` }}>
            {sorted.map((prospect) => (
              <div key={prospect.id} className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {prospect.companyName}
                  </h3>
                  <ScoreGauge score={prospect.totalScore} size={160} animate={false} />
                </div>

                <div className="space-y-3">
                  {prospect.criteriaBreakdown.map((criteria) => {
                    const percentage = criteria.maxScore > 0 ? Math.round((criteria.score / criteria.maxScore) * 100) : 0;

                    return (
                      <div key={criteria.criteriaId} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{criteria.criteriaName}</span>
                          <span className="font-medium">{criteria.score}/{criteria.maxScore}</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentage >= 80 ? 'bg-success' :
                              percentage >= 60 ? 'bg-primary' :
                              percentage >= 40 ? 'bg-warning' : 'bg-destructive'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onRemove(prospect.id)}
                >
                  Remove from comparison
                </Button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
