import type { Component } from 'solid-js';
import { createSignal, Show, For } from 'solid-js';
import { calculateGroupSizes, validateGroupCount } from '../../utils/shuffle';

interface ShuffleControlsProps {
  participantCount: number;
  groupCount: number;
  onGroupCountChange: (count: number) => void;
  onShuffle: () => void;
  onClear: () => void;
  canShuffle: boolean;
  hasExistingGroups: boolean;
}

const ShuffleControls: Component<ShuffleControlsProps> = (props) => {
  const [showSizePreview, setShowSizePreview] = createSignal(false);

  const groupSizes = () => calculateGroupSizes(props.participantCount, props.groupCount);

  const isValidCount = () => validateGroupCount(props.participantCount, props.groupCount);

  const handleGroupCountChange = (value: string) => {
    const count = parseInt(value, 10);
    if (!isNaN(count) && count >= 1 && count <= 20) {
      props.onGroupCountChange(count);
    }
  };

  return (
    <div class="shuffle-controls">
      <div class="form-group">
        <label class="form-label">Number of Groups</label>
        <div class="group-count-input">
          <input
            type="number"
            class="input"
            min={1}
            max={20}
            value={props.groupCount}
            onInput={(e) => handleGroupCountChange(e.currentTarget.value)}
          />
          <div class="group-count-buttons">
            <button
              class="btn btn-secondary btn-sm"
              onClick={() => props.onGroupCountChange(Math.max(1, props.groupCount - 1))}
              disabled={props.groupCount <= 1}
            >
              -
            </button>
            <button
              class="btn btn-secondary btn-sm"
              onClick={() => props.onGroupCountChange(Math.min(20, props.groupCount + 1))}
              disabled={props.groupCount >= 20}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <Show when={props.participantCount > 0 && isValidCount()}>
        <div class="group-size-preview mt-sm">
          <button
            class="btn btn-secondary btn-sm"
            onClick={() => setShowSizePreview(!showSizePreview())}
          >
            {showSizePreview() ? 'Hide' : 'Show'} Size Distribution
          </button>

          <Show when={showSizePreview()}>
            <div class="size-list mt-sm">
              <For each={groupSizes()}>
                {(size, i) => (
                  <span class="size-badge">
                    Team {i() + 1}: {size}
                  </span>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>

      <div class="btn-group mt-md">
        <button
          class="btn btn-primary"
          onClick={props.onShuffle}
          disabled={!props.canShuffle}
        >
          {props.hasExistingGroups ? 'Re-shuffle' : 'Shuffle'}
        </button>
        <Show when={props.hasExistingGroups}>
          <button
            class="btn btn-secondary"
            onClick={props.onClear}
          >
            Clear All
          </button>
        </Show>
      </div>

      <Show when={props.participantCount === 0}>
        <p class="text-muted text-center mt-md">
          Add participants first to enable shuffling
        </p>
      </Show>

      <Show when={props.participantCount > 0 && !isValidCount()}>
        <p class="alert alert-error mt-md">
          Group count must be at least 1
        </p>
      </Show>
    </div>
  );
};

export default ShuffleControls;