import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import { parseNamesFromText } from '../../utils/shuffle';

interface ParticipantInputProps {
  onAddNames: (names: string[]) => void;
  existingCount?: number;
}

const ParticipantInput: Component<ParticipantInputProps> = (props) => {
  const [inputText, setInputText] = createSignal('');
  const [individualName, setIndividualName] = createSignal('');
  const [mode, setMode] = createSignal<'bulk' | 'individual'>('bulk');

  const handleBulkAdd = () => {
    const names = parseNamesFromText(inputText());
    if (names.length > 0) {
      props.onAddNames(names);
      setInputText('');
    }
  };

  const handleIndividualAdd = () => {
    const name = individualName().trim();
    if (name) {
      props.onAddNames([name]);
      setIndividualName('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (mode() === 'bulk') {
        handleBulkAdd();
      } else {
        handleIndividualAdd();
      }
    }
  };

  const previewNames = () => parseNamesFromText(inputText());

  return (
    <div class="participant-input">
      <div class="tabs mb-md">
        <button
          class={`tab ${mode() === 'bulk' ? 'active' : ''}`}
          onClick={() => setMode('bulk')}
        >
          Bulk Add
        </button>
        <button
          class={`tab ${mode() === 'individual' ? 'active' : ''}`}
          onClick={() => setMode('individual')}
        >
          Add One
        </button>
      </div>

      <Show when={mode() === 'bulk'}>
        <div class="form-group">
          <label class="form-label">
            Paste names (one per line or comma-separated)
          </label>
          <textarea
            class="input"
            value={inputText()}
            onInput={(e) => setInputText(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder="John Smith&#10;Jane Doe&#10;Bob Johnson"
            rows={5}
          />
        </div>

        <Show when={inputText().trim()}>
          <p class="text-muted mt-sm mb-md">
            {previewNames().length} name(s) detected
          </p>
        </Show>

        <button
          class="btn btn-primary btn-block"
          onClick={handleBulkAdd}
          disabled={!inputText().trim()}
        >
          Add {previewNames().length || 0} Names
        </button>
      </Show>

      <Show when={mode() === 'individual'}>
        <div class="form-group">
          <label class="form-label">Name</label>
          <input
            type="text"
            class="input"
            value={individualName()}
            onInput={(e) => setIndividualName(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter name"
          />
        </div>

        <button
          class="btn btn-primary btn-block mt-md"
          onClick={handleIndividualAdd}
          disabled={!individualName().trim()}
        >
          Add Name
        </button>
      </Show>

      <Show when={props.existingCount && props.existingCount > 0}>
        <p class="text-muted text-center mt-md">
          {props.existingCount} participant(s) already added
        </p>
      </Show>
    </div>
  );
};

export default ParticipantInput;