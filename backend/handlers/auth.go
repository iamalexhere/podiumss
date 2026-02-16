package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/scoresystem/backend/database"
	"github.com/scoresystem/backend/models"
	"github.com/scoresystem/backend/utils"
)

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "invalid request body")
		return
	}

	var user models.User
	result := database.DB.Where("email = ?", req.Email).First(&user)
	if result.Error != nil {
		utils.Unauthorized(c, "invalid email or password")
		return
	}

	if !utils.CheckPassword(req.Password, user.Password) {
		utils.Unauthorized(c, "invalid email or password")
		return
	}

	token, err := utils.GenerateToken(user.ID)
	if err != nil {
		utils.InternalError(c, "failed to generate token")
		return
	}

	utils.SuccessResponse(c, 200, LoginResponse{
		Token: token,
		User:  user,
	})
}

func GetMe(c *gin.Context) {
	userID := GetUserIDFromContext(c)
	if userID == 0 {
		utils.Unauthorized(c, "not authenticated")
		return
	}

	var user models.User
	result := database.DB.First(&user, userID)
	if result.Error != nil {
		utils.NotFound(c, "user not found")
		return
	}

	utils.SuccessResponse(c, 200, user)
}

func GetUserIDFromContext(c *gin.Context) uint {
	userID, exists := c.Get("userID")
	if !exists {
		return 0
	}
	return userID.(uint)
}
