import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import { useNavigate, A } from '@solidjs/router';
import { useAuth } from './useAuth';

const Login: Component = () => {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal('');
  const [submitting, setSubmitting] = createSignal(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email(), password());
      navigate('/admin', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      if (message.includes('Failed to authenticate')) {
        setError('Invalid email or password');
      } else {
        setError('Unable to connect to server. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="container mt-lg">
      <div class="card login-card">
        <h1 class="text-center mb-md">Admin Login</h1>
        <p class="text-center text-muted mb-lg">
          Sign in to manage events and scores
        </p>

        <form onSubmit={handleSubmit} class="login-form">
          {error() && (
            <div class="alert alert-error mb-md">
              {error()}
            </div>
          )}

          <div class="form-group mb-md">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              type="email"
              class="input"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              placeholder="admin@example.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group mb-lg">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              type="password"
              class="input"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              placeholder="Enter your password"
              required
              autocomplete="current-password"
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            disabled={submitting()}
          >
            {submitting() ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div class="text-center mt-md">
          <A href="/" class="text-muted">Back to Events</A>
        </div>
      </div>
    </div>
  );
};

export default Login;