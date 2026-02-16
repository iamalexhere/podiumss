import { createSignal, onCleanup } from 'solid-js';
import { api } from '../lib/api';

interface WebSocketMessage {
  type: 'score_update' | 'score_delete';
  data: {
    event_id: number;
    score_id: number;
  };
}

interface UseWebSocketReturn {
  connected: () => boolean;
  error: () => string | null;
  lastMessage: () => WebSocketMessage | null;
}

export function useWebSocket(eventSlug: string): UseWebSocketReturn {
  const [connected, setConnected] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [lastMessage, setLastMessage] = createSignal<WebSocketMessage | null>(null);

  let ws: WebSocket | null = null;
  let reconnectTimer: number | null = null;

  const connect = () => {
    try {
      ws = api.websocket(eventSlug);

      ws.onopen = () => {
        setConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!reconnectTimer) {
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, 3000);
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection error');
      };
    } catch (e) {
      setError('Failed to create WebSocket connection');
    }
  };

  connect();

  onCleanup(() => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    if (ws) {
      ws.close();
    }
  });

  return {
    connected,
    error,
    lastMessage,
  };
}