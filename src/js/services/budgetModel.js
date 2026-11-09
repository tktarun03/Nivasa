/**
 * Indicative budget model.
 *
 * IMPORTANT: these are illustrative planning rates written for this app, not
 * market quotations. They were last reviewed on MODEL_REVIEWED and should be
 * replaced with verified local rates before being presented as current costs.
 * Pure functions only — used by the budget page, design records and tests.
 */

export const MODEL_REVIEWED = '2026-11-08';

/** ₹ per sq ft of carpet area for a typical room, by finish level [low, high]. */
export const FINISH_LEVELS = [
  { id: 'essential', name: 'Essential', description: 'Laminate finishes, standard hardware, basic lighting', rate: [900, 1500] },
  { id: 'comfort', name: 'Comfort', description: 'Better boards and hardware, some veneer, layered lighting', rate: [1500, 2500] },
  { id: 'premium', name: 'Premium', description: 'Veneer, acrylic or PU, quartz, branded fittings', rate: [2500, 4200] },
  { id: 'luxury', name: 'Luxury', description: 'Stone, solid wood, bespoke joinery, designer lighting', rate: [4200, 8000] },
];

/** Relative cost intensity by space type (cabinet-heavy rooms cost more per sq ft). */
export const ROOM_FACTORS = {
  'living-room': 1.0, 'master-bedroom': 1.15, 'guest-bedroom': 1.0, 'kids-bedroom': 1.05, nursery: 0.9,
  'senior-bedroom': 1.1, 'modular-kitchen': 2.3, 'open-kitchen': 2.4, 'dining-room': 0.9, bathroom: 2.0,
  'powder-room': 1.7, 'pooja-room': 1.6, 'home-office': 1.0, 'study-room': 1.0, library: 1.3,
  'walk-in-wardrobe': 2.0, 'dressing-room': 1.6, foyer: 1.2, corridor: 0.5, staircase: 0.9, utility: 1.1,
  balcony: 0.6, terrace: 0.5, verandah: 0.6, 'home-theatre': 1.8, 'home-gym': 0.9,
  'multipurpose-room': 1.0, 'storage-room': 0.8,
  office: 1.0, coworking: 1.1, retail: 1.4, restaurant: 1.6, cafe: 1.4, salon: 1.5, clinic: 1.5,
  'boutique-hotel': 1.6, hospitality: 1.5, reception: 1.2, education: 0.9,
};

/** Default carpet areas (sq ft) used when the person does not enter one. */
export const DEFAULT_AREAS = {
  'living-room': 220, 'master-bedroom': 160, 'guest-bedroom': 130, 'kids-bedroom': 120, nursery: 100,
  'senior-bedroom': 140, 'modular-kitchen': 90, 'open-kitchen': 120, 'dining-room': 110, bathroom: 45,
  'powder-room': 25, 'pooja-room': 25, 'home-office': 90, 'study-room': 90, library: 110,
  'walk-in-wardrobe': 60, 'dressing-room': 50, foyer: 50, corridor: 60, staircase: 80, utility: 35,
  balcony: 50, terrace: 300, verandah: 120, 'home-theatre': 200, 'home-gym': 120,
  'multipurpose-room': 130, 'storage-room': 40,
  office: 1200, coworking: 2500, retail: 600, restaurant: 1500, cafe: 600, salon: 500, clinic: 500,
  'boutique-hotel': 350, hospitality: 1500, reception: 300, education: 900,
};

/** Relative city cost factors (illustrative). */
export const CITY_FACTORS = {
  mumbai: 1.15, 'delhi-ncr': 1.1, bengaluru: 1.1, chennai: 1.0, hyderabad: 1.0, kolkata: 0.95, pune: 1.0,
  ahmedabad: 0.92, jaipur: 0.9, kochi: 0.95, goa: 1.0, chandigarh: 0.95, lucknow: 0.88, coimbatore: 0.9,
};

/** Property-type adjustment (access, logistics, finish expectations). */
export const PROPERTY_FACTORS = {
  studio: 0.95, '1bhk': 0.97, '2bhk': 1.0, '3bhk': 1.0, '4bhk': 1.05, 'compact-urban': 1.0, rental: 0.85,
  'independent-house': 1.05, duplex: 1.08, villa: 1.12, 'row-house': 1.02, 'heritage-home': 1.2,
};

/** Work categories and their typical share of a room budget. Shares sum to 1. */
export const WORK_CATEGORIES = [
  { id: 'furniture', name: 'Built-in furniture and storage', share: 0.38 },
  { id: 'flooring', name: 'Flooring and tiling', share: 0.12 },
  { id: 'electrical', name: 'Electrical and lighting', share: 0.1 },
  { id: 'soft', name: 'Soft furnishings and decor', share: 0.1 },
  { id: 'walls', name: 'Painting and wall finishes', share: 0.09 },
  { id: 'plumbing', name: 'Plumbing and bath fittings', share: 0.08 },
  { id: 'ceiling', name: 'False ceiling', share: 0.07 },
  { id: 'civil', name: 'Minor civil changes', share: 0.06 },
];

export const INCLUSIONS = [
  'Materials and labour for the selected work categories',
  'Typical contractor overheads within the rate',
  'Standard branded hardware for the chosen finish level',
];

export const EXCLUSIONS = [
  'Appliances (chimney, hob, AC, TV, washing machine)',
  'Taxes such as GST — rates and applicability vary by contract',
  'Designer or architect fees',
  'Structural work, waterproofing failures or rewiring of the whole home',
  'Society deposits, permissions and approvals',
  'Loose furniture, art and décor beyond basic soft furnishings',
];

export const ASSUMPTIONS = [
  'Rates are per square foot of carpet area and illustrative only.',
  'City and property factors are approximate relative adjustments, not surveyed indices.',
  'Work category shares are typical splits; your project may differ widely.',
  'Ranges assume the existing shell (walls, floors, wiring) is in serviceable condition.',
];

const round = (n, to = 1000) => Math.round(n / to) * to;

export function sqftToSqm(sqft) {
  return sqft * 0.09290304;
}
export function sqmToSqft(sqm) {
  return sqm / 0.09290304;
}

/**
 * @param {object} input
 * @param {string} input.city
 * @param {string} [input.property]
 * @param {string} input.finish   one of FINISH_LEVELS ids
 * @param {{type:string, areaSqft:number}[]} input.rooms
 * @param {string[]} [input.works] work category ids (defaults to all)
 * @param {boolean} [input.contingency] add 10% contingency
 */
export function estimate({ city, property, finish, rooms = [], works, contingency = false }) {
  const level = FINISH_LEVELS.find((f) => f.id === finish) ?? FINISH_LEVELS[1];
  const cityF = CITY_FACTORS[city] ?? 1;
  const propF = PROPERTY_FACTORS[property] ?? 1;
  const selected = WORK_CATEGORIES.filter((w) => !works || works.includes(w.id));
  const shareSum = selected.reduce((s, w) => s + w.share, 0);

  const roomLines = rooms
    .filter((r) => r && r.type && Number(r.areaSqft) > 0)
    .map((r) => {
      const f = ROOM_FACTORS[r.type] ?? 1;
      const area = Number(r.areaSqft);
      const base = [level.rate[0] * f * area * cityF * propF, level.rate[1] * f * area * cityF * propF];
      return { type: r.type, areaSqft: area, low: base[0] * shareSum, high: base[1] * shareSum };
    });

  let low = roomLines.reduce((s, r) => s + r.low, 0);
  let high = roomLines.reduce((s, r) => s + r.high, 0);

  const breakdown = selected.map((w) => ({
    id: w.id,
    name: w.name,
    low: round((low * w.share) / (shareSum || 1)),
    high: round((high * w.share) / (shareSum || 1)),
  }));

  let contingencyLine = null;
  if (contingency && high > 0) {
    contingencyLine = { low: round(low * 0.1), high: round(high * 0.1) };
    low += low * 0.1;
    high += high * 0.1;
  }

  const totalArea = roomLines.reduce((s, r) => s + r.areaSqft, 0);
  return {
    low: round(low),
    high: round(high),
    perSqft: totalArea ? [Math.round(low / totalArea), Math.round(high / totalArea)] : [0, 0],
    totalArea,
    rooms: roomLines.map((r) => ({ ...r, low: round(r.low), high: round(r.high) })),
    breakdown,
    contingency: contingencyLine,
    finish: level.id,
    reviewed: MODEL_REVIEWED,
  };
}

/** ₹1,23,45,678 — Indian digit grouping. */
export function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

/** Short form for ranges: ₹85,000 · ₹4.2 lakh · ₹1.15 crore. */
export function formatINRShort(value) {
  const v = Math.round(value || 0);
  if (v >= 1e7) return `₹${trim(v / 1e7)} crore`;
  if (v >= 1e5) return `₹${trim(v / 1e5)} lakh`;
  return formatINR(v);
}
function trim(n) {
  return (Math.round(n * 100) / 100).toString();
}
export function formatRange(low, high) {
  return `${formatINRShort(low)} – ${formatINRShort(high)}`;
}
