import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import App from './App';
import { useAuth } from './hooks/useAuth';

jest.mock('./hooks/useAuth', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const mockUseAuth = useAuth as jest.Mock;

describe('App', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('redirects to login when unauthenticated (token null) and accessing root', async () => {
    mockUseAuth.mockReturnValue({ token: null });
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText(/login/i)).toBeInTheDocument();
  });

  test('redirects to login when token is empty and accessing root', async () => {
    mockUseAuth.mockReturnValue({ token: '' });
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByText(/login/i)).toBeInTheDocument();
  });

  test('renders reminders when authenticated and accessing root', () => {
    mockUseAuth.mockReturnValue({ token: 'valid-token' });
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/reminders/i)).toBeInTheDocument();
  });

  test('renders login page directly when navigating to /login', () => {
    mockUseAuth.mockReturnValue({ token: null });
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });
});