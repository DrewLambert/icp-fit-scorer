import { ProspectScore } from '@/types/icp';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportProspectsToCSV(prospects: ProspectScore[]): void {
  if (prospects.length === 0) return;

  // Collect all unique criteria names across prospects
  const criteriaNames = new Set<string>();
  prospects.forEach((p) =>
    p.criteriaBreakdown.forEach((c) => criteriaNames.add(c.criteriaName))
  );
  const criteriaList = Array.from(criteriaNames);

  const headers = [
    'Company Name',
    'Total Score',
    'Tier',
    'Action',
    'Scoring Mode',
    'Outreach Tone',
    ...criteriaList.map((name) => `${name} Score`),
    ...criteriaList.map((name) => `${name} Reasoning`),
    'Subject Line',
    'Opening Line',
    'Value Hook',
    'CTA',
    'Scored At',
  ];

  const rows = prospects.map((p) => {
    const criteriaScores = criteriaList.map((name) => {
      const c = p.criteriaBreakdown.find((cb) => cb.criteriaName === name);
      return c ? `${c.score}/${c.maxScore}` : '';
    });
    const criteriaReasons = criteriaList.map((name) => {
      const c = p.criteriaBreakdown.find((cb) => cb.criteriaName === name);
      return c ? c.reasoning : '';
    });

    return [
      p.companyName,
      String(p.totalScore),
      p.tier,
      p.tierDefinition?.action || '',
      p.scoringMode || 'standard',
      p.outreachTone || '',
      ...criteriaScores,
      ...criteriaReasons,
      p.outreach?.subjectLine || '',
      p.outreach?.openingLine || p.openingLine || '',
      p.outreach?.valueHook || '',
      p.outreach?.cta || '',
      p.createdAt,
    ];
  });

  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fitcheck-prospects-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
