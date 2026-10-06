import { upcomingDates } from './questions.service.js';

describe('upcomingDates', () => {
  const dates = [
    { id: 'a', label: 'Anniversary', month: 10, day: 20 },
    { id: 'b', label: 'Birthday', month: 1, day: 5 },
    { id: 'c', label: 'Far', month: 3, day: 1 },
  ];

  it('finds dates within three weeks, including across the new year', () => {
    const fromOct = upcomingDates(dates, new Date('2026-10-06T12:00:00Z'));
    expect(fromOct.map((d) => [d.date.id, d.daysAway])).toEqual([['a', 14]]);

    const fromDec = upcomingDates(dates, new Date('2026-12-28T12:00:00Z'));
    expect(fromDec.map((d) => [d.date.id, d.daysAway])).toEqual([['b', 8]]);
  });

  it('counts today as zero days away', () => {
    expect(upcomingDates(dates, new Date('2026-10-20T23:00:00Z'))[0].daysAway).toBe(0);
  });
});
