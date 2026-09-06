export type AuthUser = {
  id: string;
  name?: string;
  email: string;
  role: 'student' | 'admin';
  studentId?: string;
};

export function setAuth(token: string, user: AuthUser) {
  localStorage.setItem('token', token);
  localStorage.setItem('userRole', user.role);
  localStorage.setItem('userEmail', user.email);
  localStorage.setItem('userId', user.id);
  if (user.name) localStorage.setItem('userName', user.name);
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
}

export function getStoredRole(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userRole');
}
