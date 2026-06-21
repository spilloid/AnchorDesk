import { SlaPolicy } from '@prisma/client';
import { pickPolicy } from './sla';

// Minimal SlaPolicy factory — only the fields pickPolicy reads matter.
function policy(p: Partial<SlaPolicy> & { id: number }): SlaPolicy {
  return {
    name: `p${p.id}`,
    priority: null,
    companyId: null,
    responseMinutes: 60,
    resolutionMinutes: 480,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...p,
  } as SlaPolicy;
}

describe('pickPolicy precedence', () => {
  const def = policy({ id: 1 }); // global default
  const byPriority = policy({ id: 2, priority: 'High' });
  const byCompany = policy({ id: 3, companyId: 7 });
  const byBoth = policy({ id: 4, priority: 'High', companyId: 7 });
  const all = [def, byPriority, byCompany, byBoth];

  it('prefers company + priority over all', () => {
    expect(pickPolicy(all, 'High', 7)?.id).toBe(4);
  });

  it('prefers company over priority-only and default', () => {
    expect(pickPolicy(all, 'Low', 7)?.id).toBe(3);
  });

  it('prefers priority over the global default', () => {
    expect(pickPolicy(all, 'High', 99)?.id).toBe(2);
  });

  it('falls back to the global default', () => {
    expect(pickPolicy(all, 'Low', 99)?.id).toBe(1);
  });

  it('returns null when nothing matches and there is no default', () => {
    expect(pickPolicy([byPriority, byCompany], 'Low', 99)).toBeNull();
  });

  it('ignores disabled policies', () => {
    const disabledBoth = policy({ id: 5, priority: 'High', companyId: 7, enabled: false });
    expect(pickPolicy([def, disabledBoth], 'High', 7)?.id).toBe(1);
  });

  it('does not match a policy whose company differs', () => {
    expect(pickPolicy([byCompany], 'High', 8)).toBeNull();
  });
});
