import type { Component } from 'solid-js';
import ProtectedRoute from '../../components/layout/ProtectedRoute';

const GroupManage: Component = () => {
  return (
    <ProtectedRoute>
      <div class="container mt-lg">
        <h1 class="mb-md">Group Management</h1>
        <p class="text-muted">Group management will be implemented in Phase 4</p>
      </div>
    </ProtectedRoute>
  );
};

export default GroupManage;