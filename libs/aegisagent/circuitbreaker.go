package aegisagent

import (
	"errors"
	"sync"
)

type TurnCounter struct {
	mu       sync.Mutex
	sessions map[string]int
	limit    int
}

func NewTurnCounter(limit int) *TurnCounter {
	return &TurnCounter{
		sessions: make(map[string]int),
		limit:    limit,
	}
}

func (tc *TurnCounter) IncrementAndCheck(sessionID string) (int, bool) {
	tc.mu.Lock()
	defer tc.mu.Unlock()

	tc.sessions[sessionID]++
	count := tc.sessions[sessionID]
	
	limitReached := count >= tc.limit
	
	return count, limitReached
}

func (tc *TurnCounter) CheckLimitError(sessionID string) error {
	_, reached := tc.IncrementAndCheck(sessionID)
	if reached {
		return errors.New("maximum turn limit reached for session")
	}
	return nil
}
