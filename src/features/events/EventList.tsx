import type { Component } from 'solid-js';
import { createSignal, onMount, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { api } from '../../lib/api';

interface Event {
  id: number;
  name: string;
  slug: string;
  status: string;
  description?: string;
  created_at?: string;
}

const EventList: Component = () => {
  const [events, setEvents] = createSignal<Event[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.events.list();
      setEvents(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load events';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  onMount(fetchEvents);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'event-status-active';
      case 'completed': return 'event-status-completed';
      default: return 'event-status-draft';
    }
  };

  return (
    <div class="container mt-lg">
      <div class="page-header">
        <h1 class="page-title">Active Events</h1>
      </div>

      <Show when={loading()}>
        <div class="loading-spinner">Loading events...</div>
      </Show>

      <Show when={error()}>
        <div class="alert alert-error mb-md">{error()}</div>
      </Show>

      <Show when={!loading() && events().length === 0}>
        <div class="empty-state">
          <h3>No events available</h3>
          <p>Check back later for upcoming events.</p>
        </div>
      </Show>

      <Show when={!loading() && events().length > 0}>
        <div class="event-grid">
          <For each={events()}>
            {(event) => (
              <A href={`/live/${event.slug}`} class="event-card">
                <div class="event-card-header">
                  <h3 class="event-card-title">{event.name}</h3>
                  <span class={`event-status ${getStatusClass(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                <Show when={event.description}>
                  <p class="text-muted">{event.description}</p>
                </Show>
              </A>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default EventList;