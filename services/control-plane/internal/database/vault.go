package database

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/rs/zerolog/log"
)

// BootstrapVault automatically mounts the transit secrets engine and configures the Ed25519 signing key
func BootstrapVault(vaultAddr, vaultToken string) error {
	if vaultAddr == "" || vaultToken == "" {
		log.Warn().Msg("Vault address or token empty; skipping Vault auto-configuration bootstrap")
		return nil
	}

	client := &http.Client{Timeout: 5 * time.Second}

	// 1. Check health
	healthReq, _ := http.NewRequestWithContext(context.Background(), "GET", vaultAddr+"/v1/sys/health", nil)
	resp, err := client.Do(healthReq)
	if err != nil {
		log.Warn().Err(err).Msg("Vault health check failed; Vault service may be offline or unreachable")
		return nil
	}
	resp.Body.Close()

	// 2. Query mounts to see if transit is enabled
	mountsReq, _ := http.NewRequestWithContext(context.Background(), "GET", vaultAddr+"/v1/sys/mounts", nil)
	mountsReq.Header.Set("X-Vault-Token", vaultToken)
	resp, err = client.Do(mountsReq)
	if err != nil {
		return fmt.Errorf("failed to query Vault mounts: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		var mounts map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&mounts); err == nil {
			if _, exists := mounts["transit/"]; !exists {
				log.Info().Msg("Vault transit secrets engine not found; enabling transit mount...")
				// Mount transit
				body, _ := json.Marshal(map[string]interface{}{
					"type":        "transit",
					"description": "Transit secrets engine for Aegis passport signing",
				})
				mountReq, _ := http.NewRequestWithContext(context.Background(), "POST", vaultAddr+"/v1/sys/mounts/transit", bytes.NewBuffer(body))
				mountReq.Header.Set("X-Vault-Token", vaultToken)
				mountReq.Header.Set("Content-Type", "application/json")
				mResp, err := client.Do(mountReq)
				if err == nil {
					mResp.Body.Close()
					if mResp.StatusCode == http.StatusNoContent || mResp.StatusCode == http.StatusOK {
						log.Info().Msg("Vault transit secrets engine mounted successfully")
					} else {
						log.Warn().Msgf("Failed to mount transit engine; status code: %d", mResp.StatusCode)
					}
				} else {
					log.Warn().Err(err).Msg("Failed to mount transit secrets engine")
				}
			} else {
				log.Info().Msg("Vault transit secrets engine is already mounted")
			}
		}
	}

	// 3. Check if key exists
	keyReq, _ := http.NewRequestWithContext(context.Background(), "GET", vaultAddr+"/v1/transit/keys/passport-key", nil)
	keyReq.Header.Set("X-Vault-Token", vaultToken)
	resp, err = client.Do(keyReq)
	if err == nil {
		defer resp.Body.Close()
		if resp.StatusCode == http.StatusNotFound {
			log.Info().Msg("Vault transit passport-key not found; generating ed25519 signing key...")
			// Generate Ed25519 key
			body, _ := json.Marshal(map[string]interface{}{
				"type": "ed25519",
			})
			createReq, _ := http.NewRequestWithContext(context.Background(), "POST", vaultAddr+"/v1/transit/keys/passport-key", bytes.NewBuffer(body))
			createReq.Header.Set("X-Vault-Token", vaultToken)
			createReq.Header.Set("Content-Type", "application/json")
			cResp, err := client.Do(createReq)
			if err == nil {
				cResp.Body.Close()
				if cResp.StatusCode == http.StatusNoContent || cResp.StatusCode == http.StatusOK {
					log.Info().Msg("Vault transit passport-key (ed25519) created successfully")
				} else {
					log.Warn().Msgf("Failed to create key; status code: %d", cResp.StatusCode)
				}
			} else {
				log.Warn().Err(err).Msg("Failed to generate passport-key")
			}
		} else if resp.StatusCode == http.StatusOK {
			log.Info().Msg("Vault transit passport-key already exists and is active")
		}
	}

	return nil
}
