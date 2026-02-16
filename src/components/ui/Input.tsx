import type { Component } from 'solid-js';

interface InputProps {
  id?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea';
  label?: string;
  value?: string | number;
  onInput?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  rows?: number;
}

const Input: Component<InputProps> = (props) => {
  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
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
      {props.type === 'textarea' ? (
        <textarea
          id={props.id}
          class="input"
          classList={{ 'input-error': !!props.error }}
          value={props.value ?? ''}
          onInput={handleInput}
          placeholder={props.placeholder}
          required={props.required ?? false}
          rows={props.rows ?? 3}
        />
      ) : (
        <input
          id={props.id}
          type={props.type ?? 'text'}
          class="input"
          classList={{ 'input-error': !!props.error }}
          value={props.value ?? ''}
          onInput={handleInput}
          placeholder={props.placeholder}
          required={props.required ?? false}
        />
      )}
      {props.error && <span class="form-error">{props.error}</span>}
    </div>
  );
};

export default Input;