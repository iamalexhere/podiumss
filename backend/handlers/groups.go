package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/scoresystem/backend/database"
	"github.com/scoresystem/backend/middleware"
	"github.com/scoresystem/backend/models"
	"github.com/scoresystem/backend/utils"
)

type CreateGroupRequest struct {
	Name      string `json:"name" binding:"required"`
	Color     string `json:"color"`
	SortOrder int    `json:"sort_order"`
}

type CreateParticipantRequest struct {
	Name string `json:"name" binding:"required"`
}

func ListEventGroups(c *gin.Context) {
	slug := c.Param("slug")

	var event models.Event
	result := database.DB.Where("slug = ?", slug).First(&event)
	if result.Error != nil {
		utils.NotFound(c, "event not found")
		return
	}

	var groups []models.Group
	database.DB.Where("event_id = ?", event.ID).Order("sort_order").Preload("Participants").Find(&groups)

	utils.SuccessResponse(c, 200, groups)
}

func CreateGroup(c *gin.Context) {
	userID := middleware.GetUserID(c)
	eventID := c.Param("id")

	var event models.Event
	result := database.DB.Where("id = ? AND created_by = ?", eventID, userID).First(&event)
	if result.Error != nil {
		utils.NotFound(c, "event not found")
		return
	}

	var req CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "invalid request body")
		return
	}

	group := models.Group{
		EventID:   event.ID,
		Name:      req.Name,
		Color:     req.Color,
		SortOrder: req.SortOrder,
	}

	if result := database.DB.Create(&group); result.Error != nil {
		utils.InternalError(c, "failed to create group")
		return
	}

	utils.SuccessResponse(c, 201, group)
}

func UpdateGroup(c *gin.Context) {
	userID := middleware.GetUserID(c)
	groupID := c.Param("id")

	var group models.Group
	result := database.DB.Preload("Event").First(&group, groupID)
	if result.Error != nil {
		utils.NotFound(c, "group not found")
		return
	}

	if group.Event.CreatedBy != userID {
		utils.Forbidden(c, "access denied")
		return
	}

	var req CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "invalid request body")
		return
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Color != "" {
		updates["color"] = req.Color
	}
	updates["sort_order"] = req.SortOrder

	database.DB.Model(&group).Updates(updates)
	database.DB.First(&group, group.ID)

	utils.SuccessResponse(c, 200, group)
}

func DeleteGroup(c *gin.Context) {
	userID := middleware.GetUserID(c)
	groupID := c.Param("id")

	var group models.Group
	result := database.DB.Preload("Event").First(&group, groupID)
	if result.Error != nil {
		utils.NotFound(c, "group not found")
		return
	}

	if group.Event.CreatedBy != userID {
		utils.Forbidden(c, "access denied")
		return
	}

	database.DB.Delete(&group)

	utils.SuccessResponse(c, 200, gin.H{"message": "group deleted"})
}

func CreateParticipant(c *gin.Context) {
	userID := middleware.GetUserID(c)
	groupID := c.Param("id")

	var group models.Group
	result := database.DB.Preload("Event").First(&group, groupID)
	if result.Error != nil {
		utils.NotFound(c, "group not found")
		return
	}

	if group.Event.CreatedBy != userID {
		utils.Forbidden(c, "access denied")
		return
	}

	var req CreateParticipantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "invalid request body")
		return
	}

	participant := models.Participant{
		GroupID: group.ID,
		Name:    req.Name,
	}

	if result := database.DB.Create(&participant); result.Error != nil {
		utils.InternalError(c, "failed to create participant")
		return
	}

	utils.SuccessResponse(c, 201, participant)
}

func DeleteParticipant(c *gin.Context) {
	userID := middleware.GetUserID(c)
	participantID := c.Param("id")

	var participant models.Participant
	result := database.DB.Preload("Group.Event").First(&participant, participantID)
	if result.Error != nil {
		utils.NotFound(c, "participant not found")
		return
	}

	if participant.Group.Event.CreatedBy != userID {
		utils.Forbidden(c, "access denied")
		return
	}

	database.DB.Delete(&participant)

	utils.SuccessResponse(c, 200, gin.H{"message": "participant deleted"})
}
