import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useImagePicker } from './UseImagePicker';

function Picker({ existingUrl }: { existingUrl: string | null | undefined }) {
  const { file, preview, remove, inputProps } = useImagePicker(existingUrl);
  return (
    <div>
      <span data-testid="file">{file === undefined ? 'undefined' : file === null ? 'null' : file.name}</span>
      <span data-testid="preview">{preview ?? 'none'}</span>
      <button onClick={remove}>remove</button>
      <input data-testid="input" {...inputProps} />
    </div>
  );
}

describe('useImagePicker', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    // Unmount while the stubbed URL is still active so the effect cleanup's
    // revokeObjectURL call doesn't hit jsdom's real (unimplemented) URL.
    cleanup();
    vi.unstubAllGlobals();
  });

  it('starts with no file change and the existing url as preview', () => {
    render(<Picker existingUrl="https://example.com/avatar.png" />);

    expect(screen.getByTestId('file')).toHaveTextContent('undefined');
    expect(screen.getByTestId('preview')).toHaveTextContent('https://example.com/avatar.png');
  });

  it('sets the picked file and a blob preview on change', () => {
    render(<Picker existingUrl={null} />);
    const file = new File(['x'], 'avatar.png', { type: 'image/png' });

    fireEvent.change(screen.getByTestId('input'), { target: { files: [file] } });

    expect(screen.getByTestId('file')).toHaveTextContent('avatar.png');
    expect(screen.getByTestId('preview')).toHaveTextContent('blob:mock-url');
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
  });

  it('marks the image as removed and revokes any blob preview', () => {
    render(<Picker existingUrl={null} />);
    const file = new File(['x'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(screen.getByTestId('input'), { target: { files: [file] } });

    fireEvent.click(screen.getByText('remove'));

    expect(screen.getByTestId('file')).toHaveTextContent('null');
    expect(screen.getByTestId('preview')).toHaveTextContent('none');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
