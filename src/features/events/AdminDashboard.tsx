import type { Component } from 'solid-js';
import { createSignal, onMount, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { useAuth } from '../auth/useAuth';
import { api } from '../../lib/api';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import ProtectedRoute from '../../components/layout/ProtectedRoute';

interface EventData {
  id: number;
  name: string;
  slug: string;
  status: string;
  description?: string;
}

const AdminDashboard: Component = () => {
  const { admin } = useAuth();
  const [events, setEvents] = createSignal<EventData[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [createModalOpen, setCreateModalOpen] = createSignal(false);
  const [submitting, setSubmitting] = createSignal(false);

  const [newEvent, setNewEvent] = createSignal({
    name: '',
    description: '',
    status: 'draft',
  });

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.admin.events.list();
      setEvents(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load events';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  onMount(fetchEvents);

  const handleCreateEvent = async (e: SubmitEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.admin.events.create({
        name: newEvent().name,
        description: newEvent().description || undefined,
        status: newEvent().status,
      });
      setCreateModalOpen(false);
      setNewEvent({ name: '', description: '', status: 'draft' });
      fetchEvents();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'event-status-active';
      case 'completed': return 'event-status-completed';
      default: return 'event-status-draft';
    }
  };

  return (
    <ProtectedRoute>
      <div class="container mt-lg">
        <div class="page-header">
          <div>
            <h1 class="page-title">Admin Dashboard</h1>
            <p class="text-muted">Welcome, {admin()?.name || admin()?.email}</p>
          </div>
          <div class="btn-group">
            <A href="/admin/users" class="btn btn-secondary">
              Manage Users
            </A>
            <button class="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
              Create Event
            </button>
          </div>
        </div>

        <Show when={loading()}>
          <div class="loading-spinner">Loading your events...</div>
        </Show>

        <Show when={error() && !createModalOpen()}>
          <div class="alert alert-error mb-md">{error()}</div>
        </Show>

        <Show when={!loading() && events().length === 0}>
          <div class="empty-state">
            <h3>No events yet</h3>
            <p>Create your first event to get started.</p>
            <button class="btn btn-primary mt-md" onClick={() => setCreateModalOpen(true)}>
              Create Event
            </button>
          </div>
        </Show>

        <Show when={!loading() && events().length > 0}>
          <div class="event-grid">
            <For each={events()}>
              {(event) => (
                <div class="event-card">
                  <div class="event-card-header">
                    <h3 class="event-card-title">{event.name}</h3>
                    <span class={`event-status ${getStatusClass(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                  <Show when={event.description}>
                    <p class="text-muted mb-md">{event.description}</p>
                  </Show>
                  <div class="btn-group">
                    <A href={`/admin/events/${event.id}`} class="btn btn-secondary btn-sm">
                      Manage
                    </A>
                    <Show when={event.status === 'active'}>
                      <A href={`/live/${event.slug}`} class="btn btn-primary btn-sm">
                        View Live
                      </A>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>

        <Modal
          open={createModalOpen()}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Event"
        >
          <form onSubmit={handleCreateEvent}>
            <Show when={error() && createModalOpen()}>
              <div class="alert alert-error mb-md">{error()}</div>
            </Show>

            <Input
              label="Event Name"
              value={newEvent().name}
              onInput={(v) => setNewEvent({ ...newEvent(), name: v })}
              placeholder="My Tournament"
              required
            />

            <div class="mt-md">
              <Input
                label="Description"
                type="textarea"
                value={newEvent().description}
                onInput={(v) => setNewEvent({ ...newEvent(), description: v })}
                placeholder="Optional description..."
                rows={3}
              />
            </div>

            <div class="mt-md">
              <Select
                label="Status"
                value={newEvent().status}
                onInput={(v) => setNewEvent({ ...newEvent(), status: v })}
                options={[
                  { value: 'draft', label: 'Draft (not visible publicly)' },
                  { value: 'active', label: 'Active (visible to everyone)' },
                ]}
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
                disabled={submitting() || !newEvent().name.trim()}
              >
                {submitting() ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;