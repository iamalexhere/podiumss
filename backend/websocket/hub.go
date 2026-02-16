package websocket

import (
	"encoding/json"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/scoresystem/backend/database"
	"github.com/scoresystem/backend/models"
)

type MessageType string

const (
	MessageTypeScoreUpdate MessageType = "score_update"
	MessageTypeScoreDelete MessageType = "score_delete"
)

type Message struct {
	Type MessageType    `json:"type"`
	Data MessagePayload `json:"data"`
}

type MessagePayload struct {
	ScoreID uint `json:"score_id,omitempty"`
	EventID uint `json:"event_id,omitempty"`
}

type Client struct {
	conn    *websocket.Conn
	eventID uint
	send    chan []byte
}

type Hub struct {
	clients    map[uint]map[*Client]bool
	clientsMux sync.RWMutex
	register   chan *Client
	unregister chan *Client
	broadcast  chan Message
}

var hub *Hub

func InitHub() {
	hub = &Hub{
		clients:    make(map[uint]map[*Client]bool),
		register:   make(chan *Client, 256),
		unregister: make(chan *Client, 256),
		broadcast:  make(chan Message, 256),
	}
	go hub.run()
}

func GetHub() *Hub {
	return hub
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clientsMux.Lock()
			if h.clients[client.eventID] == nil {
				h.clients[client.eventID] = make(map[*Client]bool)
			}
			h.clients[client.eventID][client] = true
			h.clientsMux.Unlock()

		case client := <-h.unregister:
			h.clientsMux.Lock()
			if clients, ok := h.clients[client.eventID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.send)
				}
			}
			h.clientsMux.Unlock()

		case message := <-h.broadcast:
			h.clientsMux.RLock()
			clients, ok := h.clients[message.Data.EventID]
			h.clientsMux.RUnlock()

			if ok {
				data, err := json.Marshal(message)
				if err != nil {
					continue
				}
				for client := range clients {
					select {
					case client.send <- data:
					default:
						close(client.send)
						h.clientsMux.Lock()
						delete(h.clients[client.eventID], client)
						h.clientsMux.Unlock()
					}
				}
			}
		}
	}
}

func (h *Hub) Register(client *Client) {
	h.register <- client
}

func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

func BroadcastScoreUpdate(eventID uint, score models.Score) {
	if hub != nil {
		hub.broadcast <- Message{
			Type: MessageTypeScoreUpdate,
			Data: MessagePayload{
				EventID: eventID,
				ScoreID: score.ID,
			},
		}
	}
}

func BroadcastScoreDelete(eventID uint, scoreID uint) {
	if hub != nil {
		hub.broadcast <- Message{
			Type: MessageTypeScoreDelete,
			Data: MessagePayload{
				EventID: eventID,
				ScoreID: scoreID,
			},
		}
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func HandleWebSocket(c *gin.Context) {
	eventSlug := c.Param("slug")

	var event models.Event
	result := database.DB.Where("slug = ?", eventSlug).First(&event)
	if result.Error != nil {
		c.JSON(404, gin.H{"error": "event not found"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := &Client{
		conn:    conn,
		eventID: event.ID,
		send:    make(chan []byte, 256),
	}

	hub.Register(client)

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		hub.Unregister(c)
		c.conn.Close()
	}()
	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func (c *Client) writePump() {
	defer func() {
		c.conn.Close()
	}()
	for {
		message, ok := <-c.send
		if !ok {
			c.conn.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}
		c.conn.WriteMessage(websocket.TextMessage, message)
	}
}
