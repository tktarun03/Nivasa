import { describe, it, expect } from 'vitest';
import { estimate, formatINR, formatINRShort, formatRange, WORK_CATEGORIES, sqftToSqm, sqmToSqft, FINISH_LEVELS } from '../../src/js/services/budgetModel.js';

describe('budget model', () => {
  it('work category shares sum to 1', () => {
    const sum = WORK_CATEGORIES.reduce((s, w) => s + w.share, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it('finish levels increase in cost', () => {
    for (let i = 1; i < FINISH_LEVELS.length; i++) {
      expect(FINISH_LEVELS[i].rate[0]).toBeGreaterThanOrEqual(FINISH_LEVELS[i - 1].rate[1]);
    }
  });

  it('estimates a range with low below high', () => {
    const e = estimate({ city: 'mumbai', property: '2bhk', finish: 'comfort', rooms: [{ type: 'living-room', areaSqft: 200 }] });
    expect(e.low).toBeGreaterThan(0);
    expect(e.high).toBeGreaterThan(e.low);
    expect(e.totalArea).toBe(200);
    expect(e.breakdown).toHaveLength(WORK_CATEGORIES.length);
  });

  it('scales with area and finish', () => {
    const a = estimate({ city: 'pune', finish: 'comfort', rooms: [{ type: 'master-bedroom', areaSqft: 100 }] });
    const b = estimate({ city: 'pune', finish: 'comfort', rooms: [{ type: 'master-bedroom', areaSqft: 200 }] });
    const c = estimate({ city: 'pune', finish: 'luxury', rooms: [{ type: 'master-bedroom', areaSqft: 100 }] });
    expect(b.high).toBeGreaterThan(a.high);
    expect(c.low).toBeGreaterThan(a.high);
  });

  it('only counts selected work categories', () => {
    const all = estimate({ city: 'chennai', finish: 'premium', rooms: [{ type: 'bathroom', areaSqft: 45 }] });
    const some = estimate({ city: 'chennai', finish: 'premium', rooms: [{ type: 'bathroom', areaSqft: 45 }], works: ['plumbing'] });
    expect(some.high).toBeLessThan(all.high);
    expect(some.breakdown).toHaveLength(1);
  });

  it('adds 10% contingency when asked', () => {
    const base = estimate({ city: 'goa', finish: 'comfort', rooms: [{ type: 'balcony', areaSqft: 50 }] });
    const withC = estimate({ city: 'goa', finish: 'comfort', rooms: [{ type: 'balcony', areaSqft: 50 }], contingency: true });
    expect(withC.high).toBeGreaterThan(base.high);
    expect(withC.contingency).not.toBeNull();
  });

  it('ignores rooms without area and returns zero for nothing', () => {
    const e = estimate({ city: 'mumbai', finish: 'comfort', rooms: [{ type: 'living-room', areaSqft: 0 }] });
    expect(e.low).toBe(0);
    expect(e.high).toBe(0);
  });

  it('formats rupees with Indian digit grouping', () => {
    expect(formatINR(12345678)).toBe('₹1,23,45,678');
    expect(formatINRShort(85000)).toBe('₹85,000');
    expect(formatINRShort(420000)).toBe('₹4.2 lakh');
    expect(formatINRShort(11500000)).toBe('₹1.15 crore');
    expect(formatRange(100000, 250000)).toBe('₹1 lakh – ₹2.5 lakh');
  });

  it('converts square feet and metres both ways', () => {
    expect(sqftToSqm(100)).toBeCloseTo(9.29, 2);
    expect(sqmToSqft(sqftToSqm(150))).toBeCloseTo(150, 6);
  });
});
