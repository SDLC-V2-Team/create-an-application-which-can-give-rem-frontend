import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

jest.mock('../hooks/useAuth');
jest.mock('../services/api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('Login', () => {
  const mockLogin = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ login: mockLogin });
    (api.post as jest.Mock).mockReset();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  it('renders Login form with required fields', () => {
    render(<Login />);
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    const loginButton = screen.getByRole('button', { name: /login/i });
    expect(loginButton).toBeInTheDocument();
  });

  it('successful login calls login and navigates to home', async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: { token: 'test-token' } });
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'user' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pass' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        username: 'user',
        password: 'pass',
      });
      expect(mockLogin).toHaveBeenCalledWith('test-token');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows alert on login failure', async () => {
    (api.post as jest.Mock).mockRejectedValue(new Error('Network error'));
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'user' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrong' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Login failed');
    });

    alertSpy.mockRestore();
  });

  it('username and password inputs are required', () => {
    render(<Login />);
    expect(screen.getByPlaceholderText('Username')).toHaveAttribute('required');
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('required');
  });
});