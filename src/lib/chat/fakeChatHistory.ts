// Fake chat-history sidebar data — this demo has no real persisted chat
// history, so the list of past conversations below is synthetic. The DATE
// BUCKETING logic, however, is written to the spec a real implementation
// would need, so it's a faithful stand-in rather than a throwaway mock.
//
// ── Bucketing spec (pseudocode) ────────────────────────────────────────────
//
//   for each item, sorted by date descending:
//     bucket = classify(item.date, now)
//     if bucket != previousBucket:
//       emit sectionHeader(bucket)
//       previousBucket = bucket
//     emit item
//
//   classify(date, now):
//     # Buckets are evaluated TOP TO BOTTOM — the first match wins. This
//     # ordering is what makes the year-boundary case (below) work: a late-
//     # December item is still "Previous 7 Days" from an early-January
//     # `now`, even though .getFullYear() differs, because the day-diff
//     # checks below run before the year check ever gets a chance to fire.
//     diffDays = daysBetween(startOfLocalDay(date), startOfLocalDay(now))
//     if diffDays == 0:            return "Today"
//     if diffDays == 1:            return "Yesterday"
//     if 2 <= diffDays <= 7:       return "Previous 7 Days"
//     if 8 <= diffDays <= 30:      return "Previous 30 Days"
//     if date.year == now.year:    return monthName(date)     # "August"
//     else:                        return String(date.year)   # "2024"
//
// ── Edge cases ──────────────────────────────────────────────────────────────
//
//  Timezone
//    All comparisons use Date's LOCAL getters (getFullYear / getMonth /
//    getDate), never the UTC ones and never raw epoch millis. Two events six
//    hours apart can straddle midnight in one timezone and not in another —
//    bucketing has to follow the viewer's local calendar, not a fixed offset
//    or the server's timezone.
//
//  Midnight rollover
//    Diffing whole calendar days (via startOfLocalDay, which zeroes the
//    time-of-day before subtracting) rather than raw timestamps means
//    "11:58pm yesterday" and "12:02am today" correctly land in different
//    buckets — Yesterday and Today — even though only 4 minutes separate
//    them. A rolling `now - date < 24h` window would get this wrong: it
//    would call 11:58pm-yesterday "Today" as long as it's within the last 24
//    hours, which is a different (and for this UI, wrong) definition of
//    "today".
//
//  Year-boundary transition
//    See the classify() ordering note above — Previous 7/30 Days must be
//    checked before the same-year/prior-year branches, or every item from
//    "last year" would incorrectly skip Previous 7/30 Days and jump straight
//    to a bare-year bucket the moment the calendar flips to January, even
//    for something from three days ago.
//
//  Localization
//    monthName() below hardcodes the 'en-US' locale for this demo; a real
//    implementation would pass the viewer's locale (e.g. from
//    `navigator.language` or an i18n context) into `toLocaleString` instead
//    of hardcoding one.
//
// ────────────────────────────────────────────────────────────────────────────

export interface ChatHistoryItem {
  id: string;
  title: string;
  date: Date;
}

export type ChatHistoryRow =
  | { type: 'header'; label: string }
  | { type: 'item'; item: ChatHistoryItem };

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Classify a single date into its sidebar bucket label, relative to `now`. */
export function classifyHistoryDate(date: Date, now: Date): string {
  const diffDays = Math.round(
    (startOfLocalDay(now).getTime() - startOfLocalDay(date).getTime()) / MS_PER_DAY
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays >= 2 && diffDays <= 7) return 'Previous 7 Days';
  if (diffDays >= 8 && diffDays <= 30) return 'Previous 30 Days';
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleString('en-US', { month: 'long' });
  }
  return String(date.getFullYear());
}

/** Walks a date-descending-sorted list and emits a header row only when the
 *  bucket changes from the previous item — never once per item, and never
 *  a repeat of a bucket already shown (sorted + descending makes that
 *  impossible: bucket order only ever moves forward). */
export function groupHistoryByDate(items: ChatHistoryItem[], now: Date): ChatHistoryRow[] {
  const rows: ChatHistoryRow[] = [];
  let previousBucket: string | null = null;
  for (const item of items) {
    const bucket = classifyHistoryDate(item.date, now);
    if (bucket !== previousBucket) {
      rows.push({ type: 'header', label: bucket });
      previousBucket = bucket;
    }
    rows.push({ type: 'item', item });
  }
  return rows;
}

// ── Fake data generator ──────────────────────────────────────────────────────
// No real chat persistence exists in this demo, so conversations are
// synthesized on demand. getFakeChatHistoryPage(offset, count, now) reads
// from a single, infinitely-extending, strictly date-descending fake
// timeline — so "Load more" always continues cleanly from where the
// previous page left off, and the combined list stays sorted (a
// prerequisite for groupHistoryByDate's change-detection above).

const FAKE_TITLES = [
  'Why is my bill high',
  'Average EV charging cost',
  'Improve home energy efficiency',
  'Solar panel installation cost',
  'How much am I spending on AC',
  'Best rate plan for my usage',
  'Pool pump running costs',
  'Time-of-use rate savings',
  'Compare last two bills',
  'Water heater efficiency tips',
  'Is an EV worth it for me',
  'Lower my energy costs',
];

/** Maps a fake conversation's position in the timeline (0 = most recent) to
 *  a plausible descending date. Density tapers off the further back it
 *  goes — a handful of items today/yesterday, then roughly every couple of
 *  days, then roughly weekly — so the list realistically stretches from
 *  "Today" out to several years back without needing thousands of rows to
 *  get there. */
function fakeDateForIndex(index: number, now: Date): Date {
  let daysAgo: number;
  if (index < 3) daysAgo = 0;
  else if (index < 6) daysAgo = 1;
  else if (index < 13) daysAgo = 2 + (index - 6);
  else if (index < 26) daysAgo = 9 + (index - 13) * 2;
  else daysAgo = 35 + (index - 26) * 9;

  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(9 + (index % 8), (index * 7) % 60, 0, 0);
  return d;
}

export function getFakeChatHistoryPage(
  offset: number,
  count: number,
  now: Date = new Date()
): ChatHistoryItem[] {
  const items: ChatHistoryItem[] = [];
  for (let i = 0; i < count; i++) {
    const index = offset + i;
    items.push({
      id: `fake-chat-${index}`,
      title: FAKE_TITLES[index % FAKE_TITLES.length],
      date: fakeDateForIndex(index, now),
    });
  }
  return items;
}
