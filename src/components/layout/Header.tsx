import type { Component } from 'solid-js';
import { A } from '@solidjs/router';
import { useAuth } from '../../features/auth/useAuth';

const Header: Component = () => {
  const { admin, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header class="header">
      <div class="container header-content">
        <A href="/" class="logo">
          <span class="logo-text">ScoreSystem</span>
        </A>
        
        <nav class="nav">
          <A href="/" class="nav-link">Events</A>
          {isAuthenticated() ? (
            <>
              <A href="/admin" class="nav-link">Admin</A>
              <div class="user-menu">
                <span class="user-name">{admin()?.name || admin()?.email}</span>
                <button class="btn btn-secondary btn-sm" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <A href="/login" class="btn btn-primary btn-sm">Login</A>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;