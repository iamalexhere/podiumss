import type { Component } from 'solid-js';

interface SelectProps {
  id?: string;
  label?: string;
  value?: string;
  onInput?: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  error?: string;
}

const Select: Component<SelectProps> = (props) => {
  const handleInput = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    props.onInput?.(target.value);
  };

  return (
    <div class="form-group">
      {props.label && (
        <label for={props.id} class="form-label">
          {props.label}
          {props.required && <span class="required">*</span>}
        </label>
      )}
      <select
        id={props.id}
        class="input"
        classList={{ 'input-error': !!props.error }}
        value={props.value ?? ''}
        onChange={handleInput}
        required={props.required ?? false}
      >
        {props.options.map((opt) => (
          <option value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {props.error && <span class="form-error">{props.error}</span>}
    </div>
  );
};

export default Select;