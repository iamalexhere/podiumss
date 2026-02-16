package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/scoresystem/backend/database"
	"github.com/scoresystem/backend/middleware"
	"github.com/scoresystem/backend/models"
	"github.com/scoresystem/backend/utils"
)

type CreateGameRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	ScoringMode string `json:"scoring_mode"`
	Status      string `json:"status"`
	SortOrder   int    `json:"sort_order"`
}

func ListEventGames(c *gin.Context) {
	slug := c.Param("slug")

	var event models.Event
	result := database.DB.Where("slug = ?", slug).First(&event)
	if result.Error != nil {
		utils.NotFound(c, "event not found")
		return
	}

	var games []models.Game
	database.DB.Where("event_id = ?", event.ID).Order("sort_order").Find(&games)

	utils.SuccessResponse(c, 200, games)
}

func CreateGame(c *gin.Context) {
	userID := middleware.GetUserID(c)
	eventID := c.Param("id")

	var event models.Event
	result := database.DB.Where("id = ? AND created_by = ?", eventID, userID).First(&event)
	if result.Error != nil {
		utils.NotFound(c, "event not found")
		return
	}

	var req CreateGameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "invalid request body")
		return
	}

	scoringMode := "incremental"
	if req.ScoringMode == "absolute" {
		scoringMode = "absolute"
	}

	status := "pending"
	if req.Status == "active" || req.Status == "completed" {
		status = req.Status
	}

	game := models.Game{
		EventID:     event.ID,
		Name:        req.Name,
		Description: req.Description,
		ScoringMode: scoringMode,
		Status:      status,
		SortOrder:   req.SortOrder,
	}

	if result := database.DB.Create(&game); result.Error != nil {
		utils.InternalError(c, "failed to create game")
		return
	}

	utils.SuccessResponse(c, 201, game)
}

func UpdateGame(c *gin.Context) {
	userID := middleware.GetUserID(c)
	gameID := c.Param("id")

	var game models.Game
	result := database.DB.Preload("Event").First(&game, gameID)
	if result.Error != nil {
		utils.NotFound(c, "game not found")
		return
	}

	if game.Event.CreatedBy != userID {
		utils.Forbidden(c, "access denied")
		return
	}

	var req CreateGameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "invalid request body")
		return
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.ScoringMode != "" {
		updates["scoring_mode"] = req.ScoringMode
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	updates["sort_order"] = req.SortOrder

	database.DB.Model(&game).Updates(updates)
	database.DB.First(&game, game.ID)

	utils.SuccessResponse(c, 200, game)
}

func DeleteGame(c *gin.Context) {
	userID := middleware.GetUserID(c)
	gameID := c.Param("id")

	var game models.Game
	result := database.DB.Preload("Event").First(&game, gameID)
	if result.Error != nil {
		utils.NotFound(c, "game not found")
		return
	}

	if game.Event.CreatedBy != userID {
		utils.Forbidden(c, "access denied")
		return
	}

	database.DB.Delete(&game)

	utils.SuccessResponse(c, 200, gin.H{"message": "game deleted"})
}
