package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/aegis-forge/control-plane/internal/config"
	"github.com/golang-jwt/jwt/v5"
)

func Middleware(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			// In a real app, use jwks logic to validate the RS256 token against Auth0Domain
			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			_ = tokenString 

			// Stub: decode token without verification for now
			token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})
			if err != nil {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				http.Error(w, "Invalid claims", http.StatusUnauthorized)
				return
			}

			sub, _ := claims["sub"].(string)
			email, _ := claims["email"].(string)
			orgID, _ := claims["org_id"].(string)
			
			// Get workspace ID from URL if present
			// Normally parsed via chi router

			identity := UserIdentity{
				Sub:   sub,
				Email: email,
				OrgID: orgID,
			}

			ctx := context.WithValue(r.Context(), userContextKey, identity)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
