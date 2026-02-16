import type { Component } from 'solid-js';
import { JSX } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../../features/auth/useAuth';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: Component<ProtectedRouteProps> = (props) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading()) {
    return (
      <div class="container mt-lg text-center">
        <div class="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    navigate('/login', { replace: true });
    return null;
  }

  return <>{props.children}</>;
};

export default ProtectedRoute;