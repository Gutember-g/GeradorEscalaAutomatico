import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AppContent from '../App';
import { AuthProvider } from '../context/AuthContext';

// Mocking useAuth inside context
const mockUseAuth = vi.fn();

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: any) => <div>{children}</div>,
  useAuth: () => mockUseAuth()
}));

// Mocks of pages to avoid deep rendering issues
vi.mock('../pages/Login', () => ({ default: () => <div>Login Page Mock</div> }));
vi.mock('../pages/Cadastro', () => ({ default: () => <div>Cadastro Page Mock</div> }));
vi.mock('../pages/AdminDashboard', () => ({ default: () => <div>Admin Dashboard Mock</div> }));
vi.mock('../pages/Colaboradores', () => ({ default: () => <div>Colaboradores Page Mock</div> }));

describe('App Routing Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve redirecionar para a tela de login se o usuario nao estiver logado', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      logout: vi.fn()
    });

    render(<AppContent />);

    await waitFor(() => {
      expect(screen.getByText('Login Page Mock')).toBeInTheDocument();
    });
  });

  it('deve redirecionar para o painel de administrador se o usuario for SUPER_ADMIN', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, nome: "Super Admin", role: "SUPER_ADMIN" },
      loading: false,
      logout: vi.fn()
    });

    render(<AppContent />);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard Mock')).toBeInTheDocument();
    });
  });

  it('deve permitir acesso normal e renderizar a barra de navegacao para ROLE_USER', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, nome: "Gestor Paróquia", role: "ROLE_USER", nomeOrganizacao: "São José" },
      loading: false,
      logout: vi.fn()
    });

    render(<AppContent />);

    await waitFor(() => {
      expect(screen.getByText('Colaboradores Page Mock')).toBeInTheDocument();
      expect(screen.getByText('Colaboradores')).toBeInTheDocument();
      expect(screen.getByText('Eventos')).toBeInTheDocument();
    });
  });
});
