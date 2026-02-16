import type { Component } from 'solid-js';
import { createSignal, onMount, Show, For, createEffect } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { api } from '../../lib/api';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import ScoreEntry from './ScoreEntry';
import ScoreList from './ScoreList';
import ProtectedRoute from '../../components/layout/ProtectedRoute';

interface EventData {
  id: number;
  name: string;
  slug: string;
  status: string;
}

interface Game {
  id: number;
  name: string;
  description?: string;
  scoring_mode: 'incremental' | 'absolute';
  status: 'pending' | 'active' | 'completed';
  sort_order: number;
}

interface Group {
  id: number;
  name: string;
  color?: string;
}

interface Score {
  id: number;
  game_id: number;
  group_id: number;
  value: number;
  note?: string;
  group?: Group;
  created_at?: string;
}

const GameManage: Component = () => {
  const params = useParams();
  const [event, setEvent] = createSignal<EventData | null>(null);
  const [games, setGames] = createSignal<Game[]>([]);
  const [groups, setGroups] = createSignal<Group[]>([]);
  const [scores, setScores] = createSignal<Score[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');

  const [selectedGame, setSelectedGame] = createSignal<Game | null>(null);
  const [createModalOpen, setCreateModalOpen] = createSignal(false);
  const [editModalOpen, setEditModalOpen] = createSignal(false);
  const [deleteModalOpen, setDeleteModalOpen] = createSignal(false);
  const [submitting, setSubmitting] = createSignal(false);

  const [formData, setFormData] = createSignal({
    name: '',
    description: '',
    scoring_mode: 'incremental',
    status: 'pending',
  });

  const fetchEvent = async () => {
    setLoading(true);
    setError('');
    try {
      const events = await api.admin.events.list();
      const found = (events as EventData[]).find((e) => e.id === Number(params.id));
      if (found) {
        setEvent(found);
        await Promise.all([fetchGames(), fetchGroups()]);
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

  const fetchGames = async () => {
    try {
      const slug = event()?.slug;
      if (!slug) return;
      const data = await api.events.games(slug);
      setGames(data as Game[]);
    } catch (err) {
      console.error('Failed to fetch games:', err);
    }
  };

  const fetchGroups = async () => {
    try {
      const slug = event()?.slug;
      if (!slug) return;
      const data = await api.events.groups(slug);
      setGroups(data as Group[]);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  const fetchScores = async () => {
    try {
      const slug = event()?.slug;
      if (!slug) return;
      const data = await api.events.scores(slug);
      setScores(data as Score[]);
    } catch (err) {
      console.error('Failed to fetch scores:', err);
    }
  };

  onMount(fetchEvent);

  createEffect(() => {
    if (selectedGame()) {
      fetchScores();
    }
  });

  const handleCreateGame = async (e: SubmitEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.admin.games.create(Number(params.id), {
        name: formData().name,
        description: formData().description || undefined,
        scoring_mode: formData().scoring_mode as 'incremental' | 'absolute',
        status: formData().status as 'pending' | 'active' | 'completed',
      });
      setCreateModalOpen(false);
      setFormData({ name: '', description: '', scoring_mode: 'incremental', status: 'pending' });
      fetchGames();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create game';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGame = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!selectedGame()) return;

    setSubmitting(true);
    setError('');

    try {
      await api.admin.games.update(selectedGame()!.id, {
        name: formData().name,
        description: formData().description || undefined,
        status: formData().status as 'pending' | 'active' | 'completed',
      });
      setEditModalOpen(false);
      fetchGames();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update game';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGame = async () => {
    if (!selectedGame()) return;

    setSubmitting(true);
    try {
      await api.admin.games.delete(selectedGame()!.id);
      setDeleteModalOpen(false);
      setSelectedGame(null);
      fetchGames();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete game';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (game: Game) => {
    setSelectedGame(game);
    setFormData({
      name: game.name,
      description: game.description || '',
      scoring_mode: game.scoring_mode,
      status: game.status,
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = (game: Game) => {
    setSelectedGame(game);
    setDeleteModalOpen(true);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'event-status-active';
      case 'completed': return 'event-status-completed';
      default: return 'event-status-draft';
    }
  };

  const getGameScores = () => {
    const gameId = selectedGame()?.id;
    if (!gameId) return [];
    return scores().filter((s) => s.game_id === gameId);
  };

  return (
    <ProtectedRoute>
      <div class="container mt-lg">
        <Show when={loading()}>
          <div class="loading-spinner">Loading...</div>
        </Show>

        <Show when={error() && !event()}>
          <div class="alert alert-error mb-md">{error()}</div>
          <A href="/admin" class="btn btn-secondary">Back to Dashboard</A>
        </Show>

        <Show when={!loading() && event()}>
          <>
            <div class="page-header">
              <div>
                <h1 class="page-title">{event()?.name}</h1>
                <p class="text-muted">Manage games and scores</p>
              </div>
              <div class="btn-group">
                <A href={`/admin/events/${params.id}`} class="btn btn-secondary btn-sm">
                  Back to Event
                </A>
                <Show when={event()?.status === 'active'}>
                  <A href={`/live/${event()?.slug}`} class="btn btn-primary btn-sm">
                    View Live
                  </A>
                </Show>
              </div>
            </div>

            <div class="tabs mb-lg">
              <A href={`/admin/events/${params.id}`} class="tab">Settings</A>
              <A href={`/admin/events/${params.id}/groups`} class="tab">Groups</A>
              <A href={`/admin/events/${params.id}/games`} class="tab active">Games</A>
            </div>

            <Show when={error()}>
              <div class="alert alert-error mb-md">{error()}</div>
            </Show>

            <Show when={groups().length === 0}>
              <div class="alert alert-warning mb-lg">
                You need to create groups before adding games and scores.
                <A href={`/admin/events/${params.id}/groups`} class="btn btn-secondary btn-sm mt-md">
                  Go to Groups
                </A>
              </div>
            </Show>

            <div class="two-column-layout">
              <div>
                <div class="card mb-lg">
                  <div class="page-header" style={{ 'margin-bottom': 'var(--spacing-md)' }}>
                    <h3>Games ({games().length})</h3>
                    <button
                      class="btn btn-primary btn-sm"
                      onClick={() => {
                        setFormData({ name: '', description: '', scoring_mode: 'incremental', status: 'pending' });
                        setCreateModalOpen(true);
                      }}
                      disabled={groups().length === 0}
                    >
                      Create Game
                    </button>
                  </div>

                  <Show when={games().length === 0}>
                    <p class="text-muted">No games created yet.</p>
                  </Show>

                  <div class="game-list">
                    <For each={games()}>
                      {(game) => (
                        <div
                          class={`game-item ${selectedGame()?.id === game.id ? 'active' : ''}`}
                          onClick={() => setSelectedGame(game)}
                        >
                          <div class="game-item-header">
                            <span class="game-item-name">{game.name}</span>
                            <span class={`event-status ${getStatusClass(game.status)}`}>
                              {game.status}
                            </span>
                          </div>
                          <div class="game-item-meta">
                            <span class="text-muted">{game.scoring_mode}</span>
                            <div class="btn-group">
                              <button
                                class="btn btn-secondary btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(game);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                class="btn btn-danger btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal(game);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </div>

              <div>
                <Show when={selectedGame()}>
                  <div class="card mb-lg">
                    <h3 class="mb-md">{selectedGame()?.name}</h3>
                    <p class="text-muted mb-md">
                      Mode: {selectedGame()?.scoring_mode === 'incremental' ? 'Add/Subtract Points' : 'Set Absolute Score'}
                    </p>

                    <ScoreEntry
                      gameId={selectedGame()!.id}
                      groups={groups()}
                      scoringMode={selectedGame()!.scoring_mode}
                      onScoreAdded={fetchScores}
                    />
                  </div>

                  <div class="card">
                    <ScoreList
                      scores={getGameScores()}
                      groups={groups()}
                      onRefresh={fetchScores}
                    />
                  </div>
                </Show>

                <Show when={!selectedGame()}>
                  <div class="empty-state">
                    <h3>Select a Game</h3>
                    <p>Choose a game from the list to manage scores.</p>
                  </div>
                </Show>
              </div>
            </div>

            <Modal
              open={createModalOpen()}
              onClose={() => setCreateModalOpen(false)}
              title="Create Game"
            >
              <form onSubmit={handleCreateGame}>
                <Input
                  label="Game Name"
                  value={formData().name}
                  onInput={(v) => setFormData({ ...formData(), name: v })}
                  placeholder="Round 1"
                  required
                />

                <div class="mt-md">
                  <Input
                    label="Description"
                    type="textarea"
                    value={formData().description}
                    onInput={(v) => setFormData({ ...formData(), description: v })}
                    rows={2}
                  />
                </div>

                <div class="mt-md">
                  <Select
                    label="Scoring Mode"
                    value={formData().scoring_mode}
                    onInput={(v) => setFormData({ ...formData(), scoring_mode: v })}
                    options={[
                      { value: 'incremental', label: 'Incremental (Add/Subtract)' },
                      { value: 'absolute', label: 'Absolute (Set Score)' },
                    ]}
                  />
                </div>

                <div class="mt-md">
                  <Select
                    label="Status"
                    value={formData().status}
                    onInput={(v) => setFormData({ ...formData(), status: v })}
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'active', label: 'Active' },
                      { value: 'completed', label: 'Completed' },
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
                    disabled={submitting() || !formData().name.trim()}
                  >
                    {submitting() ? 'Creating...' : 'Create Game'}
                  </button>
                </div>
              </form>
            </Modal>

            <Modal
              open={editModalOpen()}
              onClose={() => setEditModalOpen(false)}
              title="Edit Game"
            >
              <form onSubmit={handleUpdateGame}>
                <Input
                  label="Game Name"
                  value={formData().name}
                  onInput={(v) => setFormData({ ...formData(), name: v })}
                  required
                />

                <div class="mt-md">
                  <Input
                    label="Description"
                    type="textarea"
                    value={formData().description}
                    onInput={(v) => setFormData({ ...formData(), description: v })}
                    rows={2}
                  />
                </div>

                <div class="mt-md">
                  <Select
                    label="Status"
                    value={formData().status}
                    onInput={(v) => setFormData({ ...formData(), status: v })}
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'active', label: 'Active' },
                      { value: 'completed', label: 'Completed' },
                    ]}
                  />
                </div>

                <div class="btn-group mt-lg">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="btn btn-primary"
                    disabled={submitting()}
                  >
                    {submitting() ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </Modal>

            <Modal
              open={deleteModalOpen()}
              onClose={() => setDeleteModalOpen(false)}
              title="Delete Game"
            >
              <p>Are you sure you want to delete <strong>{selectedGame()?.name}</strong>?</p>
              <p class="text-muted mt-sm">This will also delete all scores associated with this game.</p>

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
                  onClick={handleDeleteGame}
                  disabled={submitting()}
                >
                  {submitting() ? 'Deleting...' : 'Delete Game'}
                </button>
              </div>
            </Modal>
          </>
        </Show>
      </div>
    </ProtectedRoute>
  );
};

export default GameManage;