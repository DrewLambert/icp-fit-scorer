import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ICPCriteria, ProspectScore, DEFAULT_CRITERIA, getTierFromScore, ScoringMode } from '@/types/icp';

interface ScoreHistoryEntry {
  totalScore: number;
  tier: string;
  scoredAt: string;
}

interface ICPStore {
  criteria: ICPCriteria[];
  prospects: ProspectScore[];
  scoringMode: ScoringMode;
  scoreHistory: Record<string, ScoreHistoryEntry[]>; // keyed by companyName (lowercased)
  setCriteria: (criteria: ICPCriteria[]) => void;
  updateCriteriaWeight: (id: string, weight: number) => void;
  setScoringMode: (mode: ScoringMode) => void;
  addProspect: (prospect: ProspectScore) => void;
  removeProspect: (id: string) => void;
  clearProspects: () => void;
}

// Migration function for legacy data
function migrateProspect(prospect: any): ProspectScore {
  if (prospect.tier && prospect.tierDefinition) {
    return prospect;
  }
  const tierDef = getTierFromScore(prospect.totalScore);
  return {
    ...prospect,
    tier: tierDef.tier,
    tierDefinition: tierDef,
  };
}

const STORE_VERSION = 2;

export const useICPStore = create<ICPStore>()(
  persist(
    (set) => ({
      criteria: DEFAULT_CRITERIA,
      prospects: [],
      scoringMode: 'standard' as ScoringMode,
      scoreHistory: {},
      setCriteria: (criteria) => set({ criteria }),
      updateCriteriaWeight: (id, weight) =>
        set((state) => ({
          criteria: state.criteria.map((c) =>
            c.id === id ? { ...c, weight } : c
          ),
        })),
      setScoringMode: (mode) => set({ scoringMode: mode }),
      addProspect: (prospect) =>
        set((state) => {
          const key = prospect.companyName.toLowerCase();
          const existing = state.scoreHistory[key] || [];
          // If there's already a prospect with this name, record the previous score
          const prev = state.prospects.find(
            (p) => p.companyName.toLowerCase() === key
          );
          const newHistory = prev
            ? [
                ...existing,
                {
                  totalScore: prev.totalScore,
                  tier: prev.tier,
                  scoredAt: prev.createdAt,
                },
              ]
            : existing;

          return {
            prospects: [
              prospect,
              ...state.prospects.filter(
                (p) => p.companyName.toLowerCase() !== key
              ),
            ],
            scoreHistory: { ...state.scoreHistory, [key]: newHistory },
          };
        }),
      removeProspect: (id) =>
        set((state) => ({
          prospects: state.prospects.filter((p) => p.id !== id),
        })),
      clearProspects: () => set({ prospects: [], scoreHistory: {} }),
    }),
    {
      name: 'fitcheck-storage',
      version: STORE_VERSION,
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          // v1 → v2: add scoreHistory field
          return { ...persisted, scoreHistory: {} };
        }
        return persisted as ICPStore;
      },
      // Migrate legacy prospects on load
      onRehydrateStorage: () => (state) => {
        if (state?.prospects) {
          state.prospects = state.prospects.map(migrateProspect);
        }
      },
    }
  )
);
