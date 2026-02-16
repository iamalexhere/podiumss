package models

import (
	"time"

	"gorm.io/gorm"
)

type Group struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
	EventID      uint           `json:"event_id" gorm:"not null;index"`
	Event        Event          `json:"event,omitempty" gorm:"foreignKey:EventID"`
	Name         string         `json:"name" gorm:"not null"`
	Color        string         `json:"color"`
	SortOrder    int            `json:"sort_order" gorm:"default:0"`
	Participants []Participant  `json:"participants,omitempty"`
	Scores       []Score        `json:"scores,omitempty"`
}

func (Group) TableName() string {
	return "groups"
}
