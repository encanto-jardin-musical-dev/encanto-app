import { describe, expect, it } from 'vitest';
import {
  formatReportDate,
  formatReportTime,
  getReportDateRange,
  getReportRangeError,
  isValidReportRange,
} from './dates';

describe('getReportDateRange', () => {
  it('today', () => {
    expect(getReportDateRange('today', '2026-10-13')).toEqual({ from: '2026-10-13', to: '2026-10-13' });
  });

  it('last7 is inclusive of 7 days', () => {
    expect(getReportDateRange('last7', '2026-10-13')).toEqual({ from: '2026-10-07', to: '2026-10-13' });
  });

  it('last7 crosses a month boundary', () => {
    expect(getReportDateRange('last7', '2026-03-03')).toEqual({ from: '2026-02-25', to: '2026-03-03' });
  });

  it('thisMonth', () => {
    expect(getReportDateRange('thisMonth', '2026-10-13')).toEqual({ from: '2026-10-01', to: '2026-10-13' });
  });

  it('lastMonth', () => {
    expect(getReportDateRange('lastMonth', '2026-10-13')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
  });

  it('lastMonth rolls January back to December', () => {
    expect(getReportDateRange('lastMonth', '2026-01-15')).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });

  it('lastMonth handles leap-year February', () => {
    expect(getReportDateRange('lastMonth', '2028-03-10')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(getReportDateRange('lastMonth', '2027-03-10')).toEqual({ from: '2027-02-01', to: '2027-02-28' });
  });

  it('throws on an invalid today', () => {
    expect(() => getReportDateRange('today', 'nope')).toThrow();
  });
});

describe('isValidReportRange / getReportRangeError', () => {
  it('accepts a single day', () => {
    expect(isValidReportRange('2026-10-01', '2026-10-01')).toBe(true);
  });

  it('accepts exactly 90 days inclusive', () => {
    expect(isValidReportRange('2026-01-01', '2026-03-31')).toBe(true);
  });

  it('rejects 91 days inclusive', () => {
    expect(getReportRangeError('2026-01-01', '2026-04-01')).toBe('tooLong');
  });

  it('rejects end before start', () => {
    expect(getReportRangeError('2026-10-02', '2026-10-01')).toBe('order');
  });

  it('rejects malformed or impossible dates', () => {
    expect(getReportRangeError('2026-02-31', '2026-03-01')).toBe('invalid');
    expect(getReportRangeError('', '2026-03-01')).toBe('invalid');
  });
});

describe('report formatters', () => {
  it('converts UTC timestamps to Bogotá 24h time', () => {
    expect(formatReportTime('2026-10-10T12:05:00Z')).toBe('07:05');
    expect(formatReportTime('2026-10-10T21:30:00Z')).toBe('16:30');
  });

  it('uses the school day across the UTC midnight boundary', () => {
    expect(formatReportTime('2026-10-11T02:30:00Z')).toBe('21:30');
  });

  it('returns empty string for null or invalid values', () => {
    expect(formatReportTime(null)).toBe('');
    expect(formatReportTime('garbage')).toBe('');
  });

  it('formats a plain date without timezone shift', () => {
    expect(formatReportDate('2026-10-10')).toBe('10/10/2026');
    expect(formatReportDate('2026-01-05')).toBe('05/01/2026');
  });
});
