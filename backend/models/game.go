package models

import (
	"time"

	"gorm.io/gorm"
)

type Game struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	EventID     uint           `json:"event_id" gorm:"not null;index"`
	Event       Event          `json:"event,omitempty" gorm:"foreignKey:EventID"`
	Name        string         `json:"name" gorm:"not null"`
	Description string         `json:"description"`
	ScoringMode string         `json:"scoring_mode" gorm:"default:'incremental'"` // incremental, absolute
	Status      string         `json:"status" gorm:"default:'pending'"`           // pending, active, completed
	SortOrder   int            `json:"sort_order" gorm:"default:0"`
	Scores      []Score        `json:"scores,omitempty"`
}

func (Game) TableName() string {
	return "games"
}
