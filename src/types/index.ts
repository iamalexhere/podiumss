export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  created: string;
  updated: string;
}

export interface Event {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: 'draft' | 'active' | 'completed';
  created_by: string;
  created: string;
  updated: string;
}

export interface Group {
  id: string;
  event_id: string;
  name: string;
  color?: string;
  sort_order: number;
  created: string;
  updated: string;
}

export interface Participant {
  id: string;
  group_id: string;
  name: string;
  created: string;
}

export interface Game {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  scoring_mode: 'incremental' | 'absolute';
  status: 'pending' | 'active' | 'completed';
  sort_order: number;
  created: string;
  updated: string;
}

export interface Score {
  id: string;
  game_id: string;
  group_id: string;
  value: number;
  note?: string;
  created_by: string;
  created: string;
  updated: string;
}

export interface EventWithGroups extends Event {
  expand?: {
    groups?: Group[];
  };
}

export interface GroupWithParticipants extends Group {
  expand?: {
    participants?: Participant[];
  };
}

export interface ScoreWithDetails extends Score {
  expand?: {
    game_id?: Game;
    group_id?: Group;
    created_by?: Profile;
  };
}

export type EventStatus = Event['status'];
export type GameStatus = Game['status'];
export type ScoringMode = Game['scoring_mode'];