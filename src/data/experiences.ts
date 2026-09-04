// Illustrative hyperlocal experiences — a concept showcase, not live/bookable
// inventory. See docs/SPEC.md §6.3. Shared by the Home preview strip and the
// full Sample Experiences page so there's one source of truth for the copy.

export interface Experience {
  slug: string;
  destinationType: 'Urban neighborhood' | 'Coastal town' | 'Rural & nature';
  location: string;
  title: string;
  blurb: string;
  whyHyperlocal: string;
}

export const experiences: Experience[] = [
  {
    slug: 'alfama-pastel-de-nata',
    destinationType: 'Urban neighborhood',
    location: 'Alfama, Lisbon',
    title: 'The Bakery Line the Neighborhood Actually Waits In',
    blurb:
      'Every guide names the famous pastelaria near the tram stop. Two streets uphill, a bakery with no sign and no menu in English sells the same pastry to the same regulars every morning at 7 — and it sells out by 9.',
    whyHyperlocal:
      'It’s not hidden because it’s secret — it’s hidden because it never needed a sign for people who already know where it is. That’s the gap between a review score and a habit.',
  },
  {
    slug: 'bywater-jazz-set',
    destinationType: 'Urban neighborhood',
    location: 'Bywater, New Orleans',
    title: 'Where the Musicians Play After Their Shift on Frenchmen St.',
    blurb:
      'After the tourist-facing sets wind down, a handful of working musicians walk a few blocks to a bar with a battered upright piano and play for whoever’s still out — no cover, no schedule posted anywhere.',
    whyHyperlocal:
      'You can’t book this. You can only know it happens, on which nights, and how to be there without getting in the way — which is exactly the kind of thing a local tells a friend, not a listicle.',
  },
  {
    slug: 'half-moon-bay-tide-pools',
    destinationType: 'Coastal town',
    location: 'Half Moon Bay, California',
    title: 'The Tide-Pool Trail Locals Time to the Moon',
    blurb:
      'A ten-minute walk past the beach everyone photographs leads to a rock shelf that only clears at low tide — and only on the days locals actually check the tide chart for.',
    whyHyperlocal:
      'The location isn’t the secret; the timing is. Knowing to check the tide chart before you go is the difference between an empty parking lot and an experience worth the trip.',
  },
  {
    slug: 'skagen-fisherman-breakfast',
    destinationType: 'Coastal town',
    location: 'Skagen, Denmark',
    title: 'Breakfast at the Table Reserved for Whoever Worked the Boats',
    blurb:
      'A harborside café keeps one long table unmarked and unbooked — first come, for whoever came in off a boat that morning. Guests who ask politely, and arrive early, are welcome too.',
    whyHyperlocal:
      'It’s a real social custom, not a tourist experience dressed up as one. Knowing the etiquette — ask, don’t assume — is the whole point.',
  },
  {
    slug: 'mad-river-valley-farmstand',
    destinationType: 'Rural & nature',
    location: 'Mad River Valley, Vermont',
    title: 'The Honesty-Box Farmstand With No Name Online',
    blurb:
      'Three generations of one family have run a self-serve farmstand off a dirt road — cash box, a chalkboard of what’s ready that week, and produce that never makes it to any market.',
    whyHyperlocal:
      'It has no listing, no reviews, and no reason to want either. The only way to find it is for someone who already knows to point the way — which is exactly what a good property guide can do.',
  },
];
