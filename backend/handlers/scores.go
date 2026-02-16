package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/scoresystem/backend/database"
	"github.com/scoresystem/backend/middleware"
	"github.com/scoresystem/backend/models"
	"github.com/scoresystem/backend/utils"
	"github.com/scoresystem/backend/websocket"
)

type CreateScoreRequest struct {
	GroupID uint   `json:"group_id" binding:"required"`
	Value   int    `json:"value" binding:"required"`
	Note    string `json:"note"`
}

func ListEventScores(c *gin.Context) {
	slug := c.Param("slug")

	var event models.Event
	result := database.DB.Where("slug = ?", slug).First(&event)
	if result.Error != nil {
		utils.NotFound(c, "event not found")
		return
	}

	var games []models.Game
	database.DB.Where("event_id = ?", event.ID).Find(&games)

	gameIDs := make([]uint, len(games))
	for i, g := range games {
		gameIDs[i] = g.ID
	}

	var scores []models.Score
	database.DB.Where("game_id IN ?", gameIDs).
		Preload("Group").
		Preload("Game").
		Order("created_at desc").
		Find(&scores)

	utils.SuccessResponse(c, 200, scores)
}

func CreateScore(c *gin.Context) {
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

	var req CreateScoreRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "invalid request body")
		return
	}

	var group models.Group
	result = database.DB.Where("id = ? AND event_id = ?", req.GroupID, game.EventID).First(&group)
	if result.Error != nil {
		utils.BadRequest(c, "invalid group")
		return
	}

	score := models.Score{
		GameID:    game.ID,
		GroupID:   req.GroupID,
		Value:     req.Value,
		Note:      req.Note,
		CreatedBy: userID,
	}

	if result := database.DB.Create(&score); result.Error != nil {
		utils.InternalError(c, "failed to create score")
		return
	}

	database.DB.Preload("Group").Preload("Game").First(&score, score.ID)

	websocket.BroadcastScoreUpdate(game.EventID, score)

	utils.SuccessResponse(c, 201, score)
}

func UpdateScore(c *gin.Context) {
	userID := middleware.GetUserID(c)
	scoreID := c.Param("id")

	var score models.Score
	result := database.DB.Preload("Game.Event").First(&score, scoreID)
	if result.Error != nil {
		utils.NotFound(c, "score not found")
		return
	}

	if score.CreatedBy != userID {
		utils.Forbidden(c, "access denied")
		return
	}

	var req CreateScoreRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "invalid request body")
		return
	}

	updates := make(map[string]interface{})
	updates["group_id"] = req.GroupID
	updates["value"] = req.Value
	updates["note"] = req.Note

	database.DB.Model(&score).Updates(updates)
	database.DB.Preload("Group").Preload("Game").First(&score, score.ID)

	websocket.BroadcastScoreUpdate(score.Game.EventID, score)

	utils.SuccessResponse(c, 200, score)
}

func DeleteScore(c *gin.Context) {
	userID := middleware.GetUserID(c)
	scoreID := c.Param("id")

	var score models.Score
	result := database.DB.Preload("Game.Event").First(&score, scoreID)
	if result.Error != nil {
		utils.NotFound(c, "score not found")
		return
	}

	if score.CreatedBy != userID {
		utils.Forbidden(c, "access denied")
		return
	}

	eventID := score.Game.EventID
	database.DB.Delete(&score)

	websocket.BroadcastScoreDelete(eventID, score.ID)

	utils.SuccessResponse(c, 200, gin.H{"message": "score deleted"})
}
