package models

import (
	"time"

	"gorm.io/gorm"
)

type Score struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	GameID    uint           `json:"game_id" gorm:"not null;index"`
	Game      Game           `json:"game,omitempty" gorm:"foreignKey:GameID"`
	GroupID   uint           `json:"group_id" gorm:"not null;index"`
	Group     Group          `json:"group,omitempty" gorm:"foreignKey:GroupID"`
	Value     int            `json:"value" gorm:"not null"`
	Note      string         `json:"note"`
	CreatedBy uint           `json:"created_by"`
}

func (Score) TableName() string {
	return "scores"
}
