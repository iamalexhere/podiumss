import type { Component, JSX } from 'solid-js';
import { createSignal, createEffect, on } from 'solid-js';
import { Portal } from 'solid-js/web';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
}

const Modal: Component<ModalProps> = (props) => {
  const [visible, setVisible] = createSignal(false);

  createEffect(on(
    () => props.open,
    (open) => {
      if (open) {
        setVisible(true);
        document.body.style.overflow = 'hidden';
      } else {
        setTimeout(() => setVisible(false), 150);
        document.body.style.overflow = '';
      }
    }
  ));

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose();
    }
  };

  return (
    <Portal>
      <div
        class="modal-backdrop"
        classList={{ 'modal-visible': visible(), 'modal-open': props.open }}
        onClick={handleBackdropClick}
        onKeyDown={handleKeydown}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">{props.title}</h2>
            <button class="modal-close" onClick={props.onClose} aria-label="Close">
              x
            </button>
          </div>
          <div class="modal-body">
            {props.children}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default Modal;