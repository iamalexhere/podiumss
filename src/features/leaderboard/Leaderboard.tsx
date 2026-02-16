import type { Component } from 'solid-js';
import { createSignal, onMount, createEffect, Show, For } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { api } from '../../lib/api';
import { useWebSocket } from '../../hooks/useWebSocket';

interface LeaderboardEntry {
  group_id: number;
  group_name: string;
  group_color: string;
  total_score: number;
  rank?: number;
}

interface Event {
  id: number;
  name: string;
  slug: string;
  description?: string;
  status: string;
}

const Leaderboard: Component = () => {
  const params = useParams();
  const slug = () => params.slug;
  const [event, setEvent] = createSignal<Event | null>(null);
  const [leaderboard, setLeaderboard] = createSignal<LeaderboardEntry[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');

  const ws = useWebSocket(slug() || '');

  const fetchEvent = async () => {
    if (!slug()) return;
    try {
      const data = await api.events.getBySlug(slug()!);
      setEvent(data as Event);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load event';
      setError(message);
    }
  };

  const fetchLeaderboard = async () => {
    if (!slug()) return;
    try {
      const data = await api.events.leaderboard(slug()!);
      const sorted = (data as LeaderboardEntry[]).sort((a, b) => b.total_score - a.total_score);
      const ranked = sorted.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
      setLeaderboard(ranked);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  onMount(async () => {
    await fetchEvent();
    await fetchLeaderboard();
  });

  createEffect(() => {
    if (ws.lastMessage()) {
      fetchLeaderboard();
    }
  });

  const getMedalClass = (rank: number): string => {
    switch (rank) {
      case 1: return 'medal-gold';
      case 2: return 'medal-silver';
      case 3: return 'medal-bronze';
      default: return '';
    }
  };

  const getRankClass = (rank: number): string => {
    if (rank <= 3) return 'leaderboard-item-top3';
    return '';
  };

  const getScoreClass = (score: number): string => {
    if (score > 0) return 'score-positive';
    if (score < 0) return 'score-negative';
    return '';
  };

  return (
    <div class="leaderboard-page">
      <Show when={loading()}>
        <div class="loading-spinner">Loading...</div>
      </Show>

      <Show when={error()}>
        <div class="container mt-lg">
          <div class="alert alert-error mb-md">{error()}</div>
          <A href="/" class="btn btn-secondary">Back to Events</A>
        </div>
      </Show>

      <Show when={!loading() && event()}>
        <div class="leaderboard-header">
          <div class="container">
            <div class="leaderboard-title-row">
              <div>
                <h1 class="leaderboard-title">{event()?.name}</h1>
                <p class="leaderboard-subtitle">Live Leaderboard</p>
              </div>
              <div class="connection-status">
                <span class={`status-dot ${ws.connected() ? 'connected' : ''}`}></span>
                <span class="status-text">{ws.connected() ? 'Live' : 'Reconnecting...'}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="container">
          <Show when={event()?.description}>
            <p class="text-muted mb-lg">{event()?.description}</p>
          </Show>

          <Show when={leaderboard().length === 0}>
            <div class="empty-state">
              <h3>No Scores Yet</h3>
              <p>Scores will appear here once games are scored.</p>
            </div>
          </Show>

          <Show when={leaderboard().length > 0}>
            <div class="leaderboard-list">
              <For each={leaderboard()}>
                {(entry) => (
                  <div class={`leaderboard-item ${getRankClass(entry.rank!)}`}>
                    <div class="leaderboard-rank">
                      <Show when={entry.rank! <= 3} fallback={<span class="rank-number">{entry.rank}</span>}>
                        <span class={`medal ${getMedalClass(entry.rank!)}`}></span>
                      </Show>
                    </div>
                    <div class="leaderboard-group">
                      <span
                        class="group-color-bar"
                        style={{ 'background-color': entry.group_color || '#94a3b8' }}
                      ></span>
                      <span class="group-name">{entry.group_name}</span>
                    </div>
                    <div class={`leaderboard-score ${getScoreClass(entry.total_score)}`}>
                      {entry.total_score >= 0 ? '+' : ''}{entry.total_score}
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};

export default Leaderboard;