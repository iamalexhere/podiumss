import { createContext, useContext, createSignal, onMount, type ParentComponent, type Accessor } from 'solid-js';
import { api, setToken, isAuthenticated } from '../../lib/api';
import type { Profile } from '../../types';

interface AuthContextValue {
  admin: Accessor<Profile | null>;
  isAuthenticated: Accessor<boolean>;
  isLoading: Accessor<boolean>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>();

export const AuthProvider: ParentComponent = (props) => {
  const [admin, setAdmin] = createSignal<Profile | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);

  const checkAuth = async () => {
    if (!isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    try {
      const user = await api.auth.me();
      setAdmin({
        id: String(user.id),
        email: user.email,
        name: user.name || '',
        created: '',
        updated: '',
      });
    } catch {
      setToken(null);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  onMount(checkAuth);

  const login = async (email: string, password: string) => {
    const result = await api.auth.login(email, password);
    setToken(result.token);
    setAdmin({
      id: String(result.user.id),
      email: result.user.email,
      name: result.user.name || '',
      created: '',
      updated: '',
    });
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: () => !!admin(), isLoading, login, logout }}>
      {props.children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}