import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './useAuth';

// Helper component to expose auth context values
function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="token">{auth.token ?? 'null-token'}</span>
      <button data-testid="login" onClick={() => auth.login('test-token')}>
        Login
      </button>
      <button data-testid="logout" onClick={auth.logout}>
        Logout
      </button>
    </div>
  );
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it('throws an error when used outside AuthProvider', () => {
    // Suppress console.error from the expected error boundary
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used within AuthProvider'
    );
    consoleError.mockRestore();
  });

  it('provides null token by default when localStorage is empty', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('token').textContent).toBe('null-token');
  });

  it('reads the initial token from localStorage', () => {
    localStorage.setItem('token', 'initial-token');
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByTestId('token').textContent).toBe('initial-token');
  });

  it('login sets token in context and localStorage', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    act(() => {
      screen.getByTestId('login').click();
    });
    expect(screen.getByTestId('token').textContent).toBe('test-token');
    expect(localStorage.getItem('token')).toBe('test-token');
  });

  it('logout clears token from context and localStorage', () => {
    localStorage.setItem('token', 'some-token');
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    // token is initially from localStorage
    expect(screen.getByTestId('token').textContent).toBe('some-token');
    act(() => {
      screen.getByTestId('logout').click();
    });
    expect(screen.getByTestId('token').textContent).toBe('null-token');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('survives multiple login / logout cycles', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    const loginBtn = screen.getByTestId('login');
    const logoutBtn = screen.getByTestId('logout');

    act(() => { loginBtn.click(); });
    expect(screen.getByTestId('token').textContent).toBe('test-token');
    expect(localStorage.getItem('token')).toBe('test-token');

    act(() => { logoutBtn.click(); });
    expect(screen.getByTestId('token').textContent).toBe('null-token');
    expect(localStorage.getItem('token')).toBeNull();

    act(() => { loginBtn.click(); });
    expect(screen.getByTestId('token').textContent).toBe('test-token');
    expect(localStorage.getItem('token')).toBe('test-token');
  });
});