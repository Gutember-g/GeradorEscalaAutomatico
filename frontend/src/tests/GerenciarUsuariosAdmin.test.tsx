import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import GerenciarUsuariosAdmin from '../pages/GerenciarUsuariosAdmin';
import api from '../services/api';
import toast from 'react-hot-toast';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('GerenciarUsuariosAdmin Component', () => {
  const mockOrgs = [
    {
      id: 10,
      nome: 'Paróquia Santo Antônio',
      dataCriacao: '2026-07-01',
      ativo: true,
      emailResponsavel: 'antonio@paroquia.com',
      nomeResponsavel: 'Padre Antônio',
      totalColaboradores: 12,
      totalEventos: 8,
      totalEscalas: 3,
      plano: 'PRO',
      observacoes: 'Test org'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockResolvedValue({ data: mockOrgs });
    (api.post as any).mockResolvedValue({ data: { senhaTemporaria: 'temp123' } });
    (api.put as any).mockResolvedValue({ data: {} });
    (api.delete as any).mockResolvedValue({ data: {} });
  });

  it('deve renderizar a listagem de organizacoes com dados corretos', async () => {
    render(<GerenciarUsuariosAdmin />);

    const item = await screen.findByText('Paróquia Santo Antônio');
    expect(item).toBeInTheDocument();
    expect(screen.getByText('PRO')).toBeInTheDocument();
    expect(screen.getByText('antonio@paroquia.com')).toBeInTheDocument();
  });

  it('deve abrir modal de cadastro e criar uma organizacao manualmente', async () => {
    render(<GerenciarUsuariosAdmin />);

    // Esperar carregar dados iniciais
    await screen.findByText('Paróquia Santo Antônio');

    // Clicar em Nova Organização
    const btnNovo = screen.getByRole('button', { name: /Nova Organização/i });
    fireEvent.click(btnNovo);

    // Preencher campos com placeholders exatos
    fireEvent.change(screen.getByPlaceholderText('Ex: Paróquia São José'), {
      target: { value: 'Paróquia São João' }
    });
    fireEvent.change(screen.getByPlaceholderText('Ex: João Silva'), {
      target: { value: 'Padre João' }
    });

    const emailField = screen.getByPlaceholderText('exemplo@email.com') as HTMLInputElement;
    fireEvent.change(emailField, { target: { value: 'joao@paroquia.com' } });

    const passwordField = screen.getByPlaceholderText('Defina a senha') as HTMLInputElement;
    fireEvent.change(passwordField, { target: { value: 'secret123' } });

    // Salvar
    const btnSalvar = screen.getByRole('button', { name: 'Criar Cadastro' });
    fireEvent.click(btnSalvar);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/admin/organizacoes', {
        nomeOrganizacao: 'Paróquia São João',
        nomeResponsavel: 'Padre João',
        emailResponsavel: 'joao@paroquia.com',
        senhaResponsavel: 'secret123',
        plano: 'GRATUITO',
        observacoes: ''
      });
    });
  });

  it('deve exigir confirmacao dupla digitando o nome exato antes de excluir', async () => {
    render(<GerenciarUsuariosAdmin />);

    await screen.findByText('Paróquia Santo Antônio');

    // Encontrar botão de deletar por title exato (Excluir Definitivamente)
    const btnDeletarIcone = document.querySelector('button[title="Excluir Definitivamente"]') as HTMLButtonElement;
    expect(btnDeletarIcone).toBeInTheDocument();
    fireEvent.click(btnDeletarIcone);

    // Modal de exclusão aberto. O botão "Confirmar Exclusão" deve estar desabilitado
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar Exclusão/i }) as HTMLButtonElement;
    expect(btnConfirmar.disabled).toBe(true);

    // Digitar nome incorreto
    const inputConfirmacao = screen.getByPlaceholderText('Nome exato da organização') as HTMLInputElement;
    fireEvent.change(inputConfirmacao, { target: { value: 'Nome Errado' } });
    expect(btnConfirmar.disabled).toBe(true);

    // Digitar nome exato
    fireEvent.change(inputConfirmacao, { target: { value: 'Paróquia Santo Antônio' } });
    expect(btnConfirmar.disabled).toBe(false);

    // Clicar em confirmar
    fireEvent.click(btnConfirmar);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/admin/organizacoes/10');
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('excluída com sucesso'));
    });
  });
});
