import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const reportQueryMock = vi.fn();
const downloadCsv = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${Object.values(values).join('|')}` : key,
}));
vi.mock('@/hooks/UseAttendanceReportQuery', () => ({
  default: (filters: unknown) => reportQueryMock(filters),
}));
vi.mock('@/utils/attendanceReportCsv', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/attendanceReportCsv')>()),
  downloadCsv: (...args: unknown[]) => downloadCsv(...args),
}));
// HeroUI Select is driven by react-aria portals that are impractical in jsdom;
// the selects are stubbed here and exercised end-to-end in Playwright.
vi.mock('@/components/attendance/report/ReportGroupSelect', () => ({
  ReportGroupSelect: ({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) => (
    <select aria-label="group" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">-</option>
      <option value="g1">G1</option>
      <option value="g2">G2</option>
    </select>
  ),
}));
vi.mock('@/components/attendance/report/ReportChildSelect', () => ({
  ReportChildSelect: ({
    groupId,
    value,
    onChange,
  }: {
    groupId: string | null;
    value: string | null;
    onChange: (child: { id: string; first_name: string; last_name: string } | null) => void;
  }) => (
    <button
      type="button"
      disabled={!groupId}
      data-selected={value ?? ''}
      onClick={() => onChange({ id: 'c1', first_name: 'Sofía', last_name: 'Gómez' })}
    >
      pick-child
    </button>
  ),
}));

const { AttendanceReport } = await import('./AttendanceReport');

const rows = [
  {
    attendance_id: 'a1',
    attendance_date: '2026-10-10',
    check_in: '07:05:00',
    check_out: null,
  },
];

function selectGroupAndChild() {
  fireEvent.change(screen.getByLabelText('group'), { target: { value: 'g1' } });
  fireEvent.click(screen.getByText('pick-child'));
}

beforeEach(() => {
  vi.clearAllMocks();
  reportQueryMock.mockReturnValue({ data: rows, isPending: false, isError: false });
});

describe('AttendanceReport', () => {
  it('defaults to the Last 7 days preset', () => {
    render(<AttendanceReport />);

    expect(screen.getByText('presets.last7').closest('button')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('presets.today').closest('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('enables Generate only when a group and child are selected', () => {
    render(<AttendanceReport />);
    const generate = screen.getByRole('button', { name: 'generate' });

    expect(generate).toBeDisabled();
    expect(screen.getByText('pick-child')).toBeDisabled();

    fireEvent.change(screen.getByLabelText('group'), { target: { value: 'g1' } });
    expect(generate).toBeDisabled();

    fireEvent.click(screen.getByText('pick-child'));
    expect(generate).toBeEnabled();
  });

  it('clears the selected child when the group changes', () => {
    render(<AttendanceReport />);
    selectGroupAndChild();
    expect(screen.getByText('pick-child')).toHaveAttribute('data-selected', 'c1');

    fireEvent.change(screen.getByLabelText('group'), { target: { value: 'g2' } });

    expect(screen.getByText('pick-child')).toHaveAttribute('data-selected', '');
    expect(screen.getByRole('button', { name: 'generate' })).toBeDisabled();
  });

  it('queries only after Generate, with the submitted snapshot', () => {
    render(<AttendanceReport />);
    selectGroupAndChild();
    expect(reportQueryMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'generate' }));

    expect(reportQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ childId: 'c1', childName: 'Sofía Gómez' })
    );
    expect(screen.getByText('Sofía Gómez')).toBeInTheDocument();
  });

  it('clears stale results when a filter changes after generating', () => {
    render(<AttendanceReport />);
    selectGroupAndChild();
    fireEvent.click(screen.getByRole('button', { name: 'generate' }));
    expect(screen.getByText('Sofía Gómez')).toBeInTheDocument();

    fireEvent.click(screen.getByText('presets.today'));

    expect(screen.queryByText('Sofía Gómez')).not.toBeInTheDocument();
  });

  it('shows the empty state without a Download action', () => {
    reportQueryMock.mockReturnValue({ data: [], isPending: false, isError: false });
    render(<AttendanceReport />);
    selectGroupAndChild();
    fireEvent.click(screen.getByRole('button', { name: 'generate' }));

    expect(screen.getByText('empty')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download/ })).not.toBeInTheDocument();
  });

  it('shows an error with a retry action', () => {
    const refetch = vi.fn();
    reportQueryMock.mockReturnValue({ data: undefined, isPending: false, isError: true, refetch });
    render(<AttendanceReport />);
    selectGroupAndChild();
    fireEvent.click(screen.getByRole('button', { name: 'generate' }));

    fireEvent.click(screen.getByRole('button', { name: 'retry' }));

    expect(refetch).toHaveBeenCalled();
  });

  it('shows the placeholder for a row without check-out', () => {
    render(<AttendanceReport />);
    selectGroupAndChild();
    fireEvent.click(screen.getByRole('button', { name: 'generate' }));

    expect(screen.getAllByText(/noCheckOut/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/07:05/).length).toBeGreaterThan(0);
  });

  it('downloads the CSV with a child-and-range filename', () => {
    render(<AttendanceReport />);
    selectGroupAndChild();
    fireEvent.click(screen.getByRole('button', { name: 'generate' }));

    fireEvent.click(screen.getByRole('button', { name: /download/ }));

    expect(downloadCsv).toHaveBeenCalledTimes(1);
    const [content, filename] = downloadCsv.mock.calls[0];
    expect(content).toContain('10/10/2026,07:05,noCheckOut');
    expect(filename).toMatch(/^asistencia_sofia-gomez_\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
