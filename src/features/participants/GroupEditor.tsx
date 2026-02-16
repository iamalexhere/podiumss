import type { Component, JSX } from 'solid-js';
import { For, Show } from 'solid-js';
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  createDraggable,
  createDroppable,
} from '@thisbeyond/solid-dnd';
import type { ShuffledGroup } from '../../utils/shuffle';
import { generateGroupColors } from '../../utils/shuffle';

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      draggable: true;
      droppable: true;
    }
  }
}

interface GroupEditorProps {
  groups: ShuffledGroup[];
  onGroupsChange: (groups: ShuffledGroup[]) => void;
  onLock: () => void;
  isLocked: boolean;
  colors?: string[];
}

const GroupEditor: Component<GroupEditorProps> = (props) => {
  const colors = () => props.colors || generateGroupColors(props.groups.length);

  const handleRemoveParticipant = (groupId: number | string, participantName: string) => {
    const newGroups = props.groups.map((group) => {
      if (group.id === groupId) {
        return {
          ...group,
          participants: group.participants.filter((p) => p.name !== participantName),
        };
      }
      return group;
    });
    props.onGroupsChange(newGroups);
  };

  const handleDragEnd = (event: { draggable: { id: string | number }; droppable?: { id: string | number } | null }) => {
    if (!event.droppable) return;

    const dragId = String(event.draggable.id);
    const toGroupId = event.droppable.id;

    const [fromGroupId, participantName] = dragId.split('|#|');

    if (fromGroupId !== String(toGroupId)) {
      const newGroups = props.groups.map((group) => {
        if (String(group.id) === String(fromGroupId)) {
          return {
            ...group,
            participants: group.participants.filter((p) => p.name !== participantName),
          };
        }
        if (String(group.id) === String(toGroupId)) {
          const participant = props.groups
            .find((g) => String(g.id) === String(fromGroupId))
            ?.participants.find((p) => p.name === participantName);
          if (participant) {
            return {
              ...group,
              participants: [...group.participants, participant],
            };
          }
        }
        return group;
      });
      props.onGroupsChange(newGroups);
    }
  };

  const handleNameChange = (groupId: number | string, name: string) => {
    const newGroups = props.groups.map((group) =>
      group.id === groupId ? { ...group, name } : group
    );
    props.onGroupsChange(newGroups);
  };

  const DraggableParticipant: Component<{ name: string; groupId: number | string }> = (p) => {
    const draggable = createDraggable(`${p.groupId}|#|${p.name}`);
    return (
      <div
        use:draggable
        class={`participant-item ${props.isLocked ? 'locked' : ''}`}
        style={draggable.isActiveDraggable ? { opacity: 0.5 } : {}}
      >
        <span class="participant-name">{p.name}</span>
        <Show when={!props.isLocked}>
          <div class="participant-actions">
            <span class="participant-handle">::</span>
            <button
              class="btn btn-danger btn-sm btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveParticipant(p.groupId, p.name);
              }}
              title="Remove participant"
            >
              x
            </button>
          </div>
        </Show>
      </div>
    );
  };

  const DroppableGroup: Component<{ group: ShuffledGroup; color: string }> = (p) => {
    const droppable = createDroppable(p.group.id);
    const isActive = () => droppable.isActiveDroppable;
    
    return (
      <div
        use:droppable
        class="group-card"
        style={{
          'border-left-color': p.color,
          ...(isActive() ? { 'border-color': '#3b82f6', 'background-color': '#eff6ff' } : {}),
        }}
      >
        <div class="group-header">
          <Show when={!props.isLocked}>
            <input
              type="text"
              class="group-name-input"
              value={p.group.name}
              onInput={(e) => handleNameChange(p.group.id, e.currentTarget.value)}
            />
          </Show>
          <Show when={props.isLocked}>
            <h4 class="group-name">{p.group.name}</h4>
          </Show>
          <span class="participant-count">{p.group.participants.length}</span>
        </div>

        <div class="participant-list">
          <For each={p.group.participants}>
            {(participant) => (
              <DraggableParticipant
                name={participant.name}
                groupId={p.group.id}
              />
            )}
          </For>
        </div>
      </div>
    );
  };

  const DragOverlayContent: Component = () => {
    const dragId = () => {
      const el = document.querySelector('[data-dragging="true"]');
      return el?.getAttribute('data-drag-id');
    };

    const name = () => {
      const id = dragId();
      if (!id) return null;
      const parts = id.split('|#|');
      return parts[1] || null;
    };

    return (
      <Show when={name()}>
        <div class="drag-overlay-item">{name()}</div>
      </Show>
    );
  };

  return (
    <div class="group-editor">
      <DragDropProvider onDragEnd={handleDragEnd}>
        <DragDropSensors />

        <div class="groups-grid">
          <For each={props.groups}>
            {(group, i) => (
              <DroppableGroup
                group={group}
                color={colors()[i()]}
              />
            )}
          </For>
        </div>

        <DragOverlay>
          <Show when={props.groups.length > 0}>
            <div class="drag-overlay-item">Dragging...</div>
          </Show>
        </DragOverlay>
      </DragDropProvider>

      <Show when={!props.isLocked && props.groups.length > 0}>
        <div class="lock-section mt-lg">
          <p class="text-muted mb-md">
            Drag participants between groups to adjust. Lock when ready to save.
          </p>
          <button class="btn btn-primary" onClick={props.onLock}>
            Lock Groups & Save
          </button>
        </div>
      </Show>
    </div>
  );
};

export default GroupEditor;