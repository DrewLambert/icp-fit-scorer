import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ICPCriteria, ProspectScore, DEFAULT_CRITERIA, getTierFromScore, ScoringMode } from '@/types/icp';

interface ICPStore {
  criteria: ICPCriteria[];
  prospects: ProspectScore[];
  scoringMode: ScoringMode;
  setCriteria: (criteria: ICPCriteria[]) => void;
  updateCriteriaWeight: (id: string, weight: number) => void;
  setScoringMode: (mode: ScoringMode) => void;
  addProspect: (prospect: ProspectScore) => void;
  removeProspect: (id: string) => void;
  clearProspects: () => void;
}

// Migration function for legacy data
function migrateProspect(prospect: any): ProspectScore {
  // If it already has tier info, return as-is
  if (prospect.tier && prospect.tierDefinition) {
    return prospect;
  }
  
  // Migrate from old scoreCategory format
  const tierDef = getTierFromScore(prospect.totalScore);
  return {
    ...prospect,
    tier: tierDef.tier,
    tierDefinition: tierDef,
  };
}

export const useICPStore = create<ICPStore>()(
  persist(
    (set) => ({
      criteria: DEFAULT_CRITERIA,
      prospects: [],
      scoringMode: 'standard' as ScoringMode,
      setCriteria: (criteria) => set({ criteria }),
      updateCriteriaWeight: (id, weight) =>
        set((state) => ({
          criteria: state.criteria.map((c) =>
            c.id === id ? { ...c, weight } : c
          ),
        })),
      setScoringMode: (mode) => set({ scoringMode: mode }),
      addProspect: (prospect) =>
        set((state) => ({
          prospects: [prospect, ...state.prospects],
        })),
      removeProspect: (id) =>
        set((state) => ({
          prospects: state.prospects.filter((p) => p.id !== id),
        })),
      clearProspects: () => set({ prospects: [] }),
    }),
    {
      name: 'fitcheck-storage',
      // Migrate legacy prospects on load
      onRehydrateStorage: () => (state) => {
        if (state?.prospects) {
          state.prospects = state.prospects.map(migrateProspect);
        }
      },
    }
  )
);
