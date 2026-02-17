import type { Component } from 'solid-js';
import { createSignal, onMount, For, Show } from 'solid-js';
import { useAuth } from '../auth/useAuth';
import { api } from '../../lib/api';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ProtectedRoute from '../../components/layout/ProtectedRoute';

interface UserData {
  id: number;
  email: string;
  name: string;
}

const UserManage: Component = () => {
  const { admin } = useAuth();
  const [users, setUsers] = createSignal<UserData[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [createModalOpen, setCreateModalOpen] = createSignal(false);
  const [submitting, setSubmitting] = createSignal(false);
  const [deletingUserId, setDeletingUserId] = createSignal<number | null>(null);

  const [newUser, setNewUser] = createSignal({
    email: '',
    password: '',
    name: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.admin.users.list();
      setUsers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  onMount(fetchUsers);

  const handleCreateUser = async (e: SubmitEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.admin.users.create({
        email: newUser().email,
        password: newUser().password,
        name: newUser().name || undefined,
      });
      setCreateModalOpen(false);
      setNewUser({ email: '', password: '', name: '' });
      fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}?`)) {
      return;
    }

    setDeletingUserId(userId);
    setError('');

    try {
      await api.admin.users.delete(userId);
      fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      setError(message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const isCurrentUser = (userId: number) => {
    const currentId = admin()?.id;
    return currentId !== undefined && Number(currentId) === userId;
  };

  return (
    <ProtectedRoute>
      <div class="container mt-lg">
        <div class="page-header">
          <div>
            <h1 class="page-title">User Management</h1>
            <p class="text-muted">Manage admin users</p>
          </div>
          <button class="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
            Create Admin User
          </button>
        </div>

        <Show when={loading()}>
          <div class="loading-spinner">Loading users...</div>
        </Show>

        <Show when={error() && !createModalOpen()}>
          <div class="alert alert-error mb-md">{error()}</div>
        </Show>

        <Show when={!loading() && users().length === 0}>
          <div class="empty-state">
            <h3>No users found</h3>
            <p>Create your first admin user to get started.</p>
            <button class="btn btn-primary mt-md" onClick={() => setCreateModalOpen(true)}>
              Create Admin User
            </button>
          </div>
        </Show>

        <Show when={!loading() && users().length > 0}>
          <div class="card">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <For each={users()}>
                  {(user) => (
                    <tr>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>{user.name || <span class="text-muted">—</span>}</td>
                      <td>
                        <Show
                          when={!isCurrentUser(user.id)}
                          fallback={<span class="text-muted">(Current user)</span>}
                        >
                          <button
                            class="btn btn-danger btn-sm"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            disabled={deletingUserId() === user.id}
                          >
                            {deletingUserId() === user.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </Show>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>

        <Modal
          open={createModalOpen()}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Admin User"
        >
          <form onSubmit={handleCreateUser}>
            <Show when={error() && createModalOpen()}>
              <div class="alert alert-error mb-md">{error()}</div>
            </Show>

            <Input
              label="Email"
              type="email"
              value={newUser().email}
              onInput={(v) => setNewUser({ ...newUser(), email: v })}
              placeholder="admin@example.com"
              required
            />

            <div class="mt-md">
              <Input
                label="Password"
                type="password"
                value={newUser().password}
                onInput={(v) => setNewUser({ ...newUser(), password: v })}
                placeholder="Min. 6 characters"
                required
              />
            </div>

            <div class="mt-md">
              <Input
                label="Name (optional)"
                value={newUser().name}
                onInput={(v) => setNewUser({ ...newUser(), name: v })}
                placeholder="John Doe"
              />
            </div>

            <div class="btn-group mt-lg">
              <button
                type="button"
                class="btn btn-secondary"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                disabled={submitting() || !newUser().email.trim() || !newUser().password.trim()}
              >
                {submitting() ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
};

export default UserManage;
