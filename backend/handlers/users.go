package handlers

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/scoresystem/backend/database"
	"github.com/scoresystem/backend/models"
	"github.com/scoresystem/backend/utils"
)

type CreateUserRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name"`
}

type UserResponse struct {
	ID    uint   `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

func ListUsers(c *gin.Context) {
	var users []models.User
	result := database.DB.Find(&users)
	if result.Error != nil {
		utils.InternalError(c, "failed to fetch users")
		return
	}

	userResponses := make([]UserResponse, len(users))
	for i, user := range users {
		userResponses[i] = UserResponse{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
		}
	}

	utils.SuccessResponse(c, 200, userResponses)
}

func CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "invalid request body")
		return
	}

	var existingUser models.User
	result := database.DB.Where("email = ?", req.Email).First(&existingUser)
	if result.Error == nil {
		utils.BadRequest(c, "user with this email already exists")
		return
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.InternalError(c, "failed to hash password")
		return
	}

	user := models.User{
		Email:    req.Email,
		Password: hashedPassword,
		Name:     req.Name,
	}

	if result := database.DB.Create(&user); result.Error != nil {
		utils.InternalError(c, "failed to create user")
		return
	}

	utils.SuccessResponse(c, 201, UserResponse{
		ID:    user.ID,
		Email: user.Email,
		Name:  user.Name,
	})
}

func DeleteUser(c *gin.Context) {
	userID := c.Param("id")
	currentUserID := GetUserIDFromContext(c)

	if userID == "" {
		utils.BadRequest(c, "user ID is required")
		return
	}

	var targetUserID uint
	if _, err := fmt.Sscanf(userID, "%d", &targetUserID); err != nil {
		utils.BadRequest(c, "invalid user ID")
		return
	}

	if targetUserID == currentUserID {
		utils.BadRequest(c, "cannot delete your own account")
		return
	}

	result := database.DB.Delete(&models.User{}, targetUserID)
	if result.Error != nil {
		utils.InternalError(c, "failed to delete user")
		return
	}

	if result.RowsAffected == 0 {
		utils.NotFound(c, "user not found")
		return
	}

	utils.SuccessResponse(c, 200, gin.H{"message": "user deleted successfully"})
}
