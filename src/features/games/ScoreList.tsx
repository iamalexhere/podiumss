import type { Component } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { api } from '../../lib/api';
import Modal from '../../components/ui/Modal';

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

interface ScoreListProps {
  scores: Score[];
  groups: Group[];
  onRefresh: () => void;
}

const ScoreList: Component<ScoreListProps> = (props) => {
  const [editingScore, setEditingScore] = createSignal<Score | null>(null);
  const [editValue, setEditValue] = createSignal(0);
  const [editNote, setEditNote] = createSignal('');
  const [editGroupId, setEditGroupId] = createSignal<number | null>(null);
  const [saving, setSaving] = createSignal(false);
  const [deleteModalOpen, setDeleteModalOpen] = createSignal(false);
  const [scoreToDelete, setScoreToDelete] = createSignal<Score | null>(null);
  const [deleting, setDeleting] = createSignal(false);
  const [error, setError] = createSignal('');

  const openEditModal = (score: Score) => {
    setEditingScore(score);
    setEditValue(score.value);
    setEditNote(score.note || '');
    setEditGroupId(score.group_id);
  };

  const handleUpdate = async () => {
    if (!editingScore() || !editGroupId()) return;

    setSaving(true);
    setError('');

    try {
      await api.admin.scores.update(editingScore()!.id, {
        group_id: editGroupId()!,
        value: editValue(),
        note: editNote() || undefined,
      });
      setEditingScore(null);
      props.onRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update score';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (score: Score) => {
    setScoreToDelete(score);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!scoreToDelete()) return;

    setDeleting(true);
    try {
      await api.admin.scores.delete(scoreToDelete()!.id);
      setDeleteModalOpen(false);
      setScoreToDelete(null);
      props.onRefresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete score';
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const getGroupName = (groupId: number) => {
    return props.groups.find((g) => g.id === groupId)?.name || 'Unknown';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div class="score-list">
      <h4 class="mb-md">Score History ({props.scores.length})</h4>

      <Show when={props.scores.length === 0}>
        <p class="text-muted">No scores recorded yet.</p>
      </Show>

      <Show when={props.scores.length > 0}>
        <div class="score-table-container">
          <table class="score-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Score</th>
                <th>Note</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <For each={props.scores}>
                {(score) => (
                  <tr>
                    <td>
                      <span
                        class="group-badge"
                        style={{ 'background-color': score.group?.color || '#e2e8f0' }}
                      >
                        {getGroupName(score.group_id)}
                      </span>
                    </td>
                    <td class={score.value >= 0 ? 'score-positive' : 'score-negative'}>
                      {score.value >= 0 ? '+' : ''}{score.value}
                    </td>
                    <td class="score-note">{score.note || '-'}</td>
                    <td class="score-date">{score.created_at ? formatDate(score.created_at) : '-'}</td>
                    <td>
                      <div class="btn-group">
                        <button
                          class="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(score)}
                        >
                          Edit
                        </button>
                        <button
                          class="btn btn-danger btn-sm"
                          onClick={() => openDeleteModal(score)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>

      <Modal
        open={!!editingScore()}
        onClose={() => setEditingScore(null)}
        title="Edit Score"
      >
        <Show when={error()}>
          <div class="alert alert-error mb-md">{error()}</div>
        </Show>

        <div class="form-group mb-md">
          <label class="form-label">Group</label>
          <select
            class="input"
            value={editGroupId() || ''}
            onChange={(e) => setEditGroupId(Number(e.currentTarget.value) || null)}
          >
            <For each={props.groups}>
              {(group) => (
                <option value={group.id}>{group.name}</option>
              )}
            </For>
          </select>
        </div>

        <div class="form-group mb-md">
          <label class="form-label">Score Value</label>
          <input
            type="number"
            class="input"
            value={editValue()}
            onInput={(e) => setEditValue(Number(e.currentTarget.value))}
          />
        </div>

        <div class="form-group mb-md">
          <label class="form-label">Note</label>
          <input
            type="text"
            class="input"
            value={editNote()}
            onInput={(e) => setEditNote(e.currentTarget.value)}
          />
        </div>

        <div class="btn-group mt-lg">
          <button class="btn btn-secondary" onClick={() => setEditingScore(null)}>
            Cancel
          </button>
          <button class="btn btn-primary" onClick={handleUpdate} disabled={saving()}>
            {saving() ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <Modal
        open={deleteModalOpen()}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Score"
      >
        <p>Are you sure you want to delete this score?</p>
        <p class="text-muted mt-sm">
          Group: <strong>{scoreToDelete() ? getGroupName(scoreToDelete()!.group_id) : ''}</strong>
          <br />
          Value: <strong>{scoreToDelete()?.value}</strong>
        </p>

        <div class="btn-group mt-lg">
          <button class="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </button>
          <button class="btn btn-danger" onClick={handleDelete} disabled={deleting()}>
            {deleting() ? 'Deleting...' : 'Delete Score'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ScoreList;