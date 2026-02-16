import type { Component } from 'solid-js';
import ProtectedRoute from '../../components/layout/ProtectedRoute';

const GameManage: Component = () => {
  return (
    <ProtectedRoute>
      <div class="container mt-lg">
        <h1 class="mb-md">Game Management</h1>
        <p class="text-muted">Game management will be implemented in Phase 5</p>
      </div>
    </ProtectedRoute>
  );
};

export default GameManage;