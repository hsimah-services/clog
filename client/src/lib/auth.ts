const TOKEN_KEY = 'clog_jwt_token';

export function getToken(): string | null {
  return (window as any).__CLOG_TOKEN__ ?? localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
