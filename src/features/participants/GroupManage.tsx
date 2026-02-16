import type { Component } from 'solid-js';
import { createSignal, onMount, Show, For } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import { api } from '../../lib/api';
import { shuffleIntoGroups, generateGroupColors, type ShuffledGroup } from '../../utils/shuffle';
import ParticipantInput from './ParticipantInput';
import ShuffleControls from './ShuffleControls';
import GroupEditor from './GroupEditor';
import ProtectedRoute from '../../components/layout/ProtectedRoute';

interface Group {
  id: number;
  name: string;
  color?: string;
  participants: Array<{ id: number; name: string }>;
}

interface EventData {
  id: number;
  name: string;
  slug: string;
  status: string;
}

const GroupManage: Component = () => {
  const params = useParams();
  const [event, setEvent] = createSignal<EventData | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal('');

  const [groups, setGroups] = createSignal<Group[]>([]);
  const [shuffledGroups, setShuffledGroups] = createSignal<ShuffledGroup[]>([]);
  const [pendingNames, setPendingNames] = createSignal<string[]>([]);
  const [groupCount, setGroupCount] = createSignal(2);
  const [isLocked, setIsLocked] = createSignal(false);

  const fetchEvent = async () => {
    setLoading(true);
    setError('');
    try {
      const events = await api.admin.events.list();
      const found = (events as EventData[]).find((e) => e.id === Number(params.id));
      if (found) {
        setEvent(found);
        await fetchGroups();
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

  const fetchGroups = async () => {
    try {
      const eventSlug = event()?.slug;
      if (!eventSlug) return;

      const groupData = await api.events.groups(eventSlug);
      setGroups(groupData as Group[]);

      if (groupData.length > 0) {
        setIsLocked(true);
        setShuffledGroups(
          groupData.map((g: Group, i: number) => ({
            id: g.id,
            name: g.name,
            color: g.color || generateGroupColors(groupData.length)[i],
            participants: g.participants.map((p) => ({ id: p.id, name: p.name })),
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  onMount(fetchEvent);

  const handleAddNames = (names: string[]) => {
    setPendingNames([...pendingNames(), ...names]);
  };

  const handleRemoveName = (index: number) => {
    setPendingNames(pendingNames().filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setPendingNames([]);
    setShuffledGroups([]);
    setIsLocked(false);
  };

  const handleShuffle = () => {
    const allNames = pendingNames();
    if (allNames.length === 0) return;

    const result = shuffleIntoGroups(allNames, groupCount(), shuffledGroups());
    const colors = generateGroupColors(result.length);

    setShuffledGroups(
      result.map((g, i) => ({
        ...g,
        color: g.color || colors[i],
      }))
    );
    setIsLocked(false);
  };

  const handleGroupsChange = (newGroups: ShuffledGroup[]) => {
    setShuffledGroups(newGroups);
  };

  const handleLock = async () => {
    if (shuffledGroups().length === 0) return;

    setSaving(true);
    setError('');

    try {
      const eventId = Number(params.id);

      for (const group of shuffledGroups()) {
        const createdGroup = await api.admin.groups.create(eventId, {
          name: group.name,
          color: group.color,
          sort_order: 0,
        });

        for (const participant of group.participants) {
          await api.admin.participants.create(createdGroup.id, participant.name);
        }
      }

      setIsLocked(true);
      setPendingNames([]);
      await fetchGroups();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save groups';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Delete this group and all its participants?')) return;

    try {
      await api.admin.groups.delete(groupId);
      await fetchGroups();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete group';
      setError(message);
    }
  };

  const handleDeleteParticipant = async (participantId: number) => {
    try {
      await api.admin.participants.delete(participantId);
      await fetchGroups();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete participant';
      setError(message);
    }
  };

  const handleRenameGroup = async (groupId: number, newName: string) => {
    if (!newName.trim()) return;
    try {
      await api.admin.groups.update(groupId, { name: newName.trim() });
      await fetchGroups();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to rename group';
      setError(message);
    }
  };

  const totalParticipants = () => {
    if (isLocked()) {
      return groups().reduce((sum, g) => sum + g.participants.length, 0);
    }
    return pendingNames().length;
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
                <p class="text-muted">Manage groups and participants</p>
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
              <A href={`/admin/events/${params.id}/groups`} class="tab active">Groups</A>
              <A href={`/admin/events/${params.id}/games`} class="tab">Games</A>
            </div>

            <Show when={error()}>
              <div class="alert alert-error mb-md">{error()}</div>
            </Show>

            <Show when={!isLocked()}>
              <div class="two-column-layout">
                <div>
                  <div class="card mb-lg">
                    <h3 class="mb-md">Add Participants</h3>
                    <ParticipantInput
                      onAddNames={handleAddNames}
                      onRemoveName={handleRemoveName}
                      pendingNames={pendingNames()}
                      existingCount={totalParticipants()}
                    />
                  </div>

                  <div class="card">
                    <h3 class="mb-md">Shuffle Settings</h3>
                    <ShuffleControls
                      participantCount={totalParticipants()}
                      groupCount={groupCount()}
                      onGroupCountChange={setGroupCount}
                      onShuffle={handleShuffle}
                      onClear={handleClearAll}
                      canShuffle={totalParticipants() > 0}
                      hasExistingGroups={shuffledGroups().length > 0}
                    />
                  </div>
                </div>

                <div>
                  <Show when={shuffledGroups().length > 0}>
                    <h3 class="mb-md">Groups Preview</h3>
                    <GroupEditor
                      groups={shuffledGroups()}
                      onGroupsChange={handleGroupsChange}
                      onLock={handleLock}
                      isLocked={false}
                    />
                  </Show>

                  <Show when={shuffledGroups().length === 0 && pendingNames().length === 0}>
                    <div class="empty-state">
                      <h3>No participants yet</h3>
                      <p>Add names using the form on the left, then shuffle them into groups.</p>
                    </div>
                  </Show>
                </div>
              </div>
            </Show>

            <Show when={isLocked()}>
              <div class="card mb-lg">
                <div class="page-header" style={{ 'margin-bottom': 'var(--spacing-md)' }}>
                  <h3>Groups ({groups().length})</h3>
                  <button
                    class="btn btn-secondary btn-sm"
                    onClick={() => {
                      setIsLocked(false);
                      setShuffledGroups(
                        groups().map((g, i) => ({
                          id: g.id,
                          name: g.name,
                          color: g.color || generateGroupColors(groups().length)[i],
                          participants: g.participants.map((p) => ({ id: p.id, name: p.name })),
                        }))
                      );
                    }}
                  >
                    Edit Groups
                  </button>
                </div>

                <Show when={groups().length === 0}>
                  <p class="text-muted">No groups created yet.</p>
                </Show>

                <div class="groups-grid">
                  <For each={groups()}>
                    {(group) => (
                      <div class="group-card" style={{ 'border-left-color': group.color || '#e2e8f0' }}>
                        <div class="group-header">
                          <input
                            type="text"
                            class="group-name-input"
                            value={group.name}
                            onBlur={(e) => {
                              if (e.currentTarget.value !== group.name) {
                                handleRenameGroup(group.id, e.currentTarget.value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                          />
                          <div class="btn-group">
                            <span class="participant-count">{group.participants.length}</span>
                            <button
                              class="btn btn-danger btn-sm"
                              style={{ 'margin-left': 'var(--spacing-xs)' }}
                              onClick={() => handleDeleteGroup(group.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div class="participant-list">
                          <For each={group.participants}>
                            {(p) => (
                              <div class="participant-item locked">
                                <span class="participant-name">{p.name}</span>
                                <button
                                  class="btn btn-danger btn-sm btn-icon"
                                  onClick={() => handleDeleteParticipant(p.id)}
                                  title="Remove participant"
                                >
                                  x
                                </button>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <Show when={saving()}>
                <div class="loading-spinner">Saving...</div>
              </Show>
            </Show>
          </>
        </Show>
      </div>
    </ProtectedRoute>
  );
};

export default GroupManage;