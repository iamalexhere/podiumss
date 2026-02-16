import type { Component } from 'solid-js';
import { createSignal, For, Show, onMount } from 'solid-js';
import { api } from '../../lib/api';

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
}

interface ScoreEntryProps {
  gameId: number;
  groups: Group[];
  scoringMode: 'incremental' | 'absolute';
  onScoreAdded: () => void;
}

const ScoreEntry: Component<ScoreEntryProps> = (props) => {
  const [groupId, setGroupId] = createSignal<number | null>(null);
  const [value, setValue] = createSignal(0);
  const [note, setNote] = createSignal('');
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!groupId()) {
      setError('Please select a group');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.admin.scores.create(props.gameId, {
        group_id: groupId()!,
        value: value(),
        note: note() || undefined,
      });
      setGroupId(null);
      setValue(0);
      setNote('');
      props.onScoreAdded();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add score';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const quickAddScore = (points: number) => {
    setValue(value() + points);
  };

  return (
    <div class="score-entry">
      <h4 class="mb-md">Add Score</h4>

      <Show when={error()}>
        <div class="alert alert-error mb-md">{error()}</div>
      </Show>

      <form onSubmit={handleSubmit}>
        <div class="form-group mb-md">
          <label class="form-label">Select Group</label>
          <select
            class="input"
            value={groupId() || ''}
            onChange={(e) => setGroupId(Number(e.currentTarget.value) || null)}
            required
          >
            <option value="">-- Select Group --</option>
            <For each={props.groups}>
              {(group) => (
                <option value={group.id}>{group.name}</option>
              )}
            </For>
          </select>
        </div>

        <div class="form-group mb-md">
          <label class="form-label">
            Score Value ({props.scoringMode === 'incremental' ? 'Add/Subtract' : 'Set Absolute'})
          </label>
          <input
            type="number"
            class="input"
            value={value()}
            onInput={(e) => setValue(Number(e.currentTarget.value))}
            required
          />
          <Show when={props.scoringMode === 'incremental'}>
            <div class="quick-score-buttons mt-sm">
              <button type="button" class="btn btn-secondary btn-sm" onClick={() => quickAddScore(-10)}>-10</button>
              <button type="button" class="btn btn-secondary btn-sm" onClick={() => quickAddScore(-5)}>-5</button>
              <button type="button" class="btn btn-secondary btn-sm" onClick={() => quickAddScore(-1)}>-1</button>
              <button type="button" class="btn btn-secondary btn-sm" onClick={() => quickAddScore(1)}>+1</button>
              <button type="button" class="btn btn-secondary btn-sm" onClick={() => quickAddScore(5)}>+5</button>
              <button type="button" class="btn btn-secondary btn-sm" onClick={() => quickAddScore(10)}>+10</button>
            </div>
          </Show>
        </div>

        <div class="form-group mb-md">
          <label class="form-label">Note (optional)</label>
          <input
            type="text"
            class="input"
            value={note()}
            onInput={(e) => setNote(e.currentTarget.value)}
            placeholder="Reason for score change..."
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block"
          disabled={submitting() || !groupId()}
        >
          {submitting() ? 'Adding...' : 'Add Score'}
        </button>
      </form>
    </div>
  );
};

export default ScoreEntry;