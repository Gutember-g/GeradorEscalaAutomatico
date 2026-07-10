import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
    dismiss: vi.fn(),
  },
  Toaster: () => null // Componente mockado para evitar erros de render
}));
