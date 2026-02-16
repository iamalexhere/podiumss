package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/scoresystem/backend/database"
	"github.com/scoresystem/backend/models"
	"github.com/scoresystem/backend/utils"
)

type LeaderboardEntry struct {
	GroupID      uint        `json:"group_id"`
	GroupName    string      `json:"group_name"`
	GroupColor   string      `json:"group_color"`
	TotalScore   int         `json:"total_score"`
	ScoresByGame []GameScore `json:"scores_by_game"`
}

type GameScore struct {
	GameID   uint   `json:"game_id"`
	GameName string `json:"game_name"`
	Score    int    `json:"score"`
}

func GetLeaderboard(c *gin.Context) {
	slug := c.Param("slug")

	var event models.Event
	result := database.DB.Where("slug = ?", slug).First(&event)
	if result.Error != nil {
		utils.NotFound(c, "event not found")
		return
	}

	var groups []models.Group
	database.DB.Where("event_id = ?", event.ID).Order("sort_order").Find(&groups)

	var games []models.Game
	database.DB.Where("event_id = ?", event.ID).Order("sort_order").Find(&games)

	var scores []models.Score
	gameIDs := make([]uint, len(games))
	for i, g := range games {
		gameIDs[i] = g.ID
	}
	database.DB.Where("game_id IN ?", gameIDs).Find(&scores)

	gameMap := make(map[uint]models.Game)
	for _, g := range games {
		gameMap[g.ID] = g
	}

	groupScores := make(map[uint]map[uint]int)
	for _, s := range scores {
		if groupScores[s.GroupID] == nil {
			groupScores[s.GroupID] = make(map[uint]int)
		}
		groupScores[s.GroupID][s.GameID] += s.Value
	}

	leaderboard := make([]LeaderboardEntry, 0, len(groups))
	for _, group := range groups {
		entry := LeaderboardEntry{
			GroupID:      group.ID,
			GroupName:    group.Name,
			GroupColor:   group.Color,
			TotalScore:   0,
			ScoresByGame: []GameScore{},
		}

		for _, game := range games {
			score := 0
			if groupScores[group.ID] != nil {
				score = groupScores[group.ID][game.ID]
			}
			entry.ScoresByGame = append(entry.ScoresByGame, GameScore{
				GameID:   game.ID,
				GameName: game.Name,
				Score:    score,
			})
			entry.TotalScore += score
		}

		leaderboard = append(leaderboard, entry)
	}

	for i := 0; i < len(leaderboard)-1; i++ {
		for j := i + 1; j < len(leaderboard); j++ {
			if leaderboard[j].TotalScore > leaderboard[i].TotalScore {
				leaderboard[i], leaderboard[j] = leaderboard[j], leaderboard[i]
			}
		}
	}

	utils.SuccessResponse(c, 200, leaderboard)
}
