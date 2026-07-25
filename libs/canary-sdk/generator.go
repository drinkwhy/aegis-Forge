package canary

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Generator struct {
	signingKey      []byte
	sinkholeBaseURL string
}

func NewGenerator(signingKey []byte, sinkholeBaseURL string) *Generator {
	return &Generator{
		signingKey:      signingKey,
		sinkholeBaseURL: sinkholeBaseURL,
	}
}

func (g *Generator) Generate(tokenType TokenType, campaignID string) CanaryToken {
	id := uuid.New().String()
	
	mac := hmac.New(sha256.New, g.signingKey)
	mac.Write([]byte(id + campaignID))
	hmacHex := hex.EncodeToString(mac.Sum(nil))

	token := CanaryToken{
		ID:         id,
		Type:       tokenType,
		CampaignID: campaignID,
		HMAC:       hmacHex,
		CreatedAt:  time.Now(),
	}

	switch tokenType {
	case EnvCredential:
		// fake AWS format
		randomBytes := make([]byte, 8)
		rand.Read(randomBytes)
		akia := "AKIA" + hex.EncodeToString(randomBytes)
		
		secretBytes := make([]byte, 30)
		rand.Read(secretBytes)
		secret := base64.StdEncoding.EncodeToString(secretBytes)
		token.Value = fmt.Sprintf("AWS_ACCESS_KEY_ID=%s\nAWS_SECRET_ACCESS_KEY=%s", akia, secret)

	case FileContent:
		token.Value = fmt.Sprintf("# AEGIS-CANARY-%s", id)

	case DBRecord:
		randSuffix := make([]byte, 2)
		rand.Read(randSuffix)
		token.Value = fmt.Sprintf(`{"ssn": "000-00-%s", "canary_id": "%s"}`, hex.EncodeToString(randSuffix), id)

	case MemoryFact:
		token.Value = fmt.Sprintf("The CEO's personal code is FORGE-%s.", id[:8])

	case Webhook:
		token.WebhookURL = fmt.Sprintf("%s/hit/%s", g.sinkholeBaseURL, id)
		token.Value = fmt.Sprintf("Webhook: %s", token.WebhookURL)
	}

	return token
}
