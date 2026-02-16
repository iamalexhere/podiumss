import type { Component } from 'solid-js';
import { createSignal, onMount, Show, For } from 'solid-js';
import { useParams, A, useNavigate } from '@solidjs/router';
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

const EventManage: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = createSignal<EventData | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [saving, setSaving] = createSignal(false);
  const [deleteModalOpen, setDeleteModalOpen] = createSignal(false);
  const [deleting, setDeleting] = createSignal(false);

  const [editForm, setEditForm] = createSignal({
    name: '',
    description: '',
    status: 'draft',
  });

  const fetchEvent = async () => {
    setLoading(true);
    setError('');
    try {
      const events = await api.admin.events.list();
      const found = events.find((e: EventData) => e.id === Number(params.id));
      if (found) {
        setEvent(found);
        setEditForm({
          name: found.name,
          description: found.description || '',
          status: found.status,
        });
      } else {
        setError('Event not found');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load event';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  onMount(fetchEvent);

  const handleSave = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!event()) return;

    setSaving(true);
    setError('');
    try {
      await api.admin.events.update(event()!.id, {
        name: editForm().name,
        description: editForm().description || undefined,
        status: editForm().status,
      });
      fetchEvent();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event()) return;

    setDeleting(true);
    try {
      await api.admin.events.delete(event()!.id);
      navigate('/admin');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      setError(message);
      setDeleting(false);
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
        <Show when={loading()}>
          <div class="loading-spinner">Loading event...</div>
        </Show>

        <Show when={error() && !event()}>
          <div class="alert alert-error mb-md">{error()}</div>
          <A href="/admin" class="btn btn-secondary">Back to Dashboard</A>
        </Show>

        <Show when={!loading() && event()}>
          <div class="page-header">
            <div>
              <h1 class="page-title">{event()?.name}</h1>
              <span class={`event-status ${getStatusClass(event()?.status || 'draft')}`}>
                {event()?.status}
              </span>
            </div>
            <div class="btn-group">
              <Show when={event()?.status === 'active'}>
                <A href={`/live/${event()?.slug}`} class="btn btn-primary btn-sm">
                  View Live
                </A>
              </Show>
              <button class="btn btn-danger btn-sm" onClick={() => setDeleteModalOpen(true)}>
                Delete
              </button>
            </div>
          </div>

          <div class="tabs mb-lg">
            <A href={`/admin/events/${params.id}`} class="tab active">Settings</A>
            <A href={`/admin/events/${params.id}/groups`} class="tab">Groups</A>
            <A href={`/admin/events/${params.id}/games`} class="tab">Games</A>
          </div>

          <div class="card">
            <h2 class="mb-md">Event Settings</h2>

            <Show when={error()}>
              <div class="alert alert-error mb-md">{error()}</div>
            </Show>

            <form onSubmit={handleSave}>
              <Input
                label="Event Name"
                value={editForm().name}
                onInput={(v) => setEditForm({ ...editForm(), name: v })}
                required
              />

              <div class="mt-md">
                <Input
                  label="Description"
                  type="textarea"
                  value={editForm().description}
                  onInput={(v) => setEditForm({ ...editForm(), description: v })}
                  rows={3}
                />
              </div>

              <div class="mt-md">
                <Select
                  label="Status"
                  value={editForm().status}
                  onInput={(v) => setEditForm({ ...editForm(), status: v })}
                  options={[
                    { value: 'draft', label: 'Draft (not visible publicly)' },
                    { value: 'active', label: 'Active (visible to everyone)' },
                    { value: 'completed', label: 'Completed' },
                  ]}
                />
              </div>

              <div class="mt-lg">
                <button
                  type="submit"
                  class="btn btn-primary"
                  disabled={saving() || !editForm().name.trim()}
                >
                  {saving() ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            <div class="mt-lg">
              <h3 class="mb-sm">Share Link</h3>
              <Show when={event()?.status === 'active'}>
                <code class="text-muted">
                  {window.location.origin}/live/{event()?.slug}
                </code>
              </Show>
              <Show when={event()?.status !== 'active'}>
                <p class="text-muted">Activate the event to generate a shareable link.</p>
              </Show>
            </div>
          </div>
        </Show>

        <Modal
          open={deleteModalOpen()}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Event"
        >
          <p>Are you sure you want to delete <strong>{event()?.name}</strong>?</p>
          <p class="text-muted mt-sm">This will permanently delete all groups, participants, games, and scores.</p>

          <div class="btn-group mt-lg">
            <button
              type="button"
              class="btn btn-secondary"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-danger"
              onClick={handleDelete}
              disabled={deleting()}
            >
              {deleting() ? 'Deleting...' : 'Delete Event'}
            </button>
          </div>
        </Modal>
      </div>
    </ProtectedRoute>
  );
};

export default EventManage;