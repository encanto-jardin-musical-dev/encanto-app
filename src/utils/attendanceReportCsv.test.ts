import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildAttendanceReportCsv,
  buildReportFilename,
  downloadCsv,
} from './attendanceReportCsv';

const headers = { date: 'Fecha', checkIn: 'Entrada', checkOut: 'Salida', noCheckOut: 'Sin salida' };

const row = (over: Partial<Parameters<typeof buildAttendanceReportCsv>[0][number]> = {}) => ({
  attendance_id: 'a1',
  attendance_date: '2026-10-10',
  check_in: '2026-10-10T12:05:00Z',
  check_out: '2026-10-10T21:30:00Z' as string | null,
  ...over,
});

describe('buildAttendanceReportCsv', () => {
  it('starts with a BOM, uses CRLF and school-timezone times', () => {
    const csv = buildAttendanceReportCsv([row()], headers);

    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv.slice(1)).toBe('Fecha,Entrada,Salida\r\n10/10/2026,07:05,16:30\r\n');
  });

  it('uses the placeholder for a missing check-out', () => {
    const csv = buildAttendanceReportCsv([row({ check_out: null })], headers);

    expect(csv).toContain('10/10/2026,07:05,Sin salida');
  });

  it('keeps accented headers intact', () => {
    const csv = buildAttendanceReportCsv([], { ...headers, checkIn: 'Hora de salida' , checkOut: 'Año' });

    expect(csv).toContain('Año');
  });

  it('quotes fields containing commas, quotes or newlines', () => {
    const csv = buildAttendanceReportCsv([row({ check_out: null })], {
      ...headers,
      noCheckOut: 'Sin "salida",\naún',
    });

    expect(csv).toContain('"Sin ""salida"",\naún"');
  });

  it.each(['=', '+', '-', '@'])('prefixes cells starting with %s', (char) => {
    const csv = buildAttendanceReportCsv([row({ check_out: null })], {
      ...headers,
      noCheckOut: `${char}CMD`,
    });

    expect(csv).toContain(`'${char}CMD`);
  });
});

describe('buildReportFilename', () => {
  it('slugifies and strips accents', () => {
    expect(buildReportFilename('Sofía Gómez', '2026-10-01', '2026-10-13')).toBe(
      'asistencia_sofia-gomez_2026-10-01_2026-10-13.csv'
    );
  });

  it('falls back when the name has no usable characters', () => {
    expect(buildReportFilename('???', '2026-10-01', '2026-10-13')).toBe(
      'asistencia_nino_2026-10-01_2026-10-13.csv'
    );
  });
});

describe('downloadCsv', () => {
  afterEach(() => vi.restoreAllMocks());

  it('creates an object URL, clicks a download link and revokes the URL', () => {
    const createObjectURL = vi.fn(() => 'blob:fake');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadCsv('a,b', 'file.csv');

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
    expect(document.querySelector('a[download]')).toBeNull();
  });
});
