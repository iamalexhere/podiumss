package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/scoresystem/backend/database"
	"github.com/scoresystem/backend/middleware"
	"github.com/scoresystem/backend/models"
	"github.com/scoresystem/backend/utils"
)

type CreateEventRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

type UpdateEventRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

func ListPublicEvents(c *gin.Context) {
	var events []models.Event
	database.DB.Where("status = ?", "active").Order("created_at desc").Find(&events)

	utils.SuccessResponse(c, 200, events)
}

func GetEventBySlug(c *gin.Context) {
	slug := c.Param("slug")

	var event models.Event
	result := database.DB.Where("slug = ? AND status = ?", slug, "active").First(&event)
	if result.Error != nil {
		utils.NotFound(c, "event not found")
		return
	}

	utils.SuccessResponse(c, 200, event)
}

func ListAdminEvents(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var events []models.Event
	database.DB.Where("created_by = ?", userID).Order("created_at desc").Find(&events)

	utils.SuccessResponse(c, 200, events)
}

func CreateEvent(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "invalid request body")
		return
	}

	status := "draft"
	if req.Status == "active" || req.Status == "completed" {
		status = req.Status
	}

	event := models.Event{
		Name:        req.Name,
		Slug:        utils.GenerateSlug(req.Name),
		Description: req.Description,
		Status:      status,
		CreatedBy:   userID,
	}

	if result := database.DB.Create(&event); result.Error != nil {
		utils.InternalError(c, "failed to create event")
		return
	}

	utils.SuccessResponse(c, 201, event)
}

func UpdateEvent(c *gin.Context) {
	userID := middleware.GetUserID(c)
	eventID := c.Param("id")

	var event models.Event
	result := database.DB.Where("id = ? AND created_by = ?", eventID, userID).First(&event)
	if result.Error != nil {
		utils.NotFound(c, "event not found")
		return
	}

	var req UpdateEventRequest
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
	if req.Status != "" {
		updates["status"] = req.Status
	}

	database.DB.Model(&event).Updates(updates)
	database.DB.First(&event, event.ID)

	utils.SuccessResponse(c, 200, event)
}

func DeleteEvent(c *gin.Context) {
	userID := middleware.GetUserID(c)
	eventID := c.Param("id")

	result := database.DB.Where("id = ? AND created_by = ?", eventID, userID).Delete(&models.Event{})
	if result.RowsAffected == 0 {
		utils.NotFound(c, "event not found")
		return
	}

	utils.SuccessResponse(c, 200, gin.H{"message": "event deleted"})
}
