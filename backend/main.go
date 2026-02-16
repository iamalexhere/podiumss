package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/scoresystem/backend/config"
	"github.com/scoresystem/backend/database"
	"github.com/scoresystem/backend/handlers"
	"github.com/scoresystem/backend/middleware"
	"github.com/scoresystem/backend/websocket"
)

func main() {
	config.Load()

	if err := database.Connect(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	websocket.InitHub()

	r := gin.Default()
	r.Use(middleware.CORS())

	api := r.Group("/api")
	{
		api.POST("/auth/login", handlers.Login)
		api.GET("/auth/me", middleware.AuthRequired(), handlers.GetMe)

		api.GET("/events", handlers.ListPublicEvents)
		api.GET("/events/:slug", handlers.GetEventBySlug)
		api.GET("/events/:slug/groups", handlers.ListEventGroups)
		api.GET("/events/:slug/games", handlers.ListEventGames)
		api.GET("/events/:slug/scores", handlers.ListEventScores)
		api.GET("/events/:slug/leaderboard", handlers.GetLeaderboard)
		api.GET("/events/:slug/ws", websocket.HandleWebSocket)

		admin := api.Group("/admin")
		admin.Use(middleware.AuthRequired())
		{
			admin.GET("/events", handlers.ListAdminEvents)
			admin.POST("/events", handlers.CreateEvent)
			admin.PUT("/events/:id", handlers.UpdateEvent)
			admin.DELETE("/events/:id", handlers.DeleteEvent)

			admin.POST("/events/:id/groups", handlers.CreateGroup)
			admin.PUT("/groups/:id", handlers.UpdateGroup)
			admin.DELETE("/groups/:id", handlers.DeleteGroup)
			admin.POST("/groups/:id/participants", handlers.CreateParticipant)
			admin.DELETE("/participants/:id", handlers.DeleteParticipant)

			admin.POST("/events/:id/games", handlers.CreateGame)
			admin.PUT("/games/:id", handlers.UpdateGame)
			admin.DELETE("/games/:id", handlers.DeleteGame)

			admin.POST("/games/:id/scores", handlers.CreateScore)
			admin.PUT("/scores/:id", handlers.UpdateScore)
			admin.DELETE("/scores/:id", handlers.DeleteScore)
		}
	}

	log.Printf("Server starting on :%s", config.AppConfig.Port)
	if err := r.Run(":" + config.AppConfig.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
