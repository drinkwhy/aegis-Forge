package auth

import (
	"context"
)

type contextKey string

const userContextKey contextKey = "user_identity"

type UserIdentity struct {
	Sub         string
	Email       string
	OrgID       string
	WorkspaceID string
}

func FromContext(ctx context.Context) (UserIdentity, bool) {
	identity, ok := ctx.Value(userContextKey).(UserIdentity)
	return identity, ok
}
