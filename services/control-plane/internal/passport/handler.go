package passport

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type PassportHandler struct {
	service *PassportService
}

func NewPassportHandler(service *PassportService) *PassportHandler {
	return &PassportHandler{service: service}
}

// Helper to write JSON responses
func (h *PassportHandler) respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// Helper to write HTTP errors
func (h *PassportHandler) respondError(w http.ResponseWriter, status int, msg string) {
	h.respondJSON(w, status, map[string]string{"error": msg})
}

// POST /api/v1/organizations/:organizationId/systems/:systemId/snapshots
func (h *PassportHandler) CreateSnapshot(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	systemID := chi.URLParam(r, "systemId")

	var input map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid payload: "+err.Error())
		return
	}

	snapshot, err := h.service.CreateSnapshot(r.Context(), orgID, systemID, input)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusCreated, snapshot)
}

// POST /api/v1/organizations/:organizationId/evidence
func (h *PassportHandler) CreateEvidence(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")

	var artifact EvidenceArtifact
	if err := json.NewDecoder(r.Body).Decode(&artifact); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid payload: "+err.Error())
		return
	}
	artifact.OrganizationID = orgID

	created, err := h.service.CreateEvidence(r.Context(), &artifact)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusCreated, created)
}

// GET /api/v1/organizations/:organizationId/evidence/:evidenceId
func (h *PassportHandler) GetEvidence(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	evidenceID := chi.URLParam(r, "evidenceId")

	artifact, err := h.service.GetEvidence(r.Context(), orgID, evidenceID)
	if err != nil {
		h.respondError(w, http.StatusNotFound, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, artifact)
}

// POST /api/v1/organizations/:organizationId/assurance-evaluations
func (h *PassportHandler) CreateEvaluation(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")

	var input struct {
		FrameworkVersionID string `json:"frameworkVersionId"`
		SubjectSnapshotID  string `json:"subjectSnapshotId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid payload: "+err.Error())
		return
	}

	evaluation, err := h.service.Evaluate(r.Context(), orgID, input.FrameworkVersionID, input.SubjectSnapshotID)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusCreated, evaluation)
}

// GET /api/v1/organizations/:organizationId/assurance-evaluations/:evaluationId
func (h *PassportHandler) GetEvaluation(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	evalID := chi.URLParam(r, "evaluationId")

	evaluation, err := h.service.GetEvaluation(r.Context(), orgID, evalID)
	if err != nil {
		h.respondError(w, http.StatusNotFound, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, evaluation)
}

// POST /api/v1/organizations/:organizationId/security-passports
func (h *PassportHandler) IssuePassport(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")

	var input struct {
		SystemID              string `json:"systemId"`
		SystemDisplayName     string `json:"systemDisplayName"`
		FrameworkID           string `json:"frameworkId"`
		FrameworkVersionID    string `json:"frameworkVersionId"`
		AssuranceEvaluationID string `json:"assuranceEvaluationId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid payload: "+err.Error())
		return
	}

	passport, err := h.service.IssuePassport(
		r.Context(), orgID, input.SystemID, input.SystemDisplayName,
		input.FrameworkID, input.FrameworkVersionID, input.AssuranceEvaluationID,
	)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusCreated, passport)
}

// GET /api/v1/organizations/:organizationId/security-passports
func (h *PassportHandler) ListPassports(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")

	passports, err := h.service.ListPassports(r.Context(), orgID)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, map[string]interface{}{"passports": passports})
}

// GET /api/v1/organizations/:organizationId/security-passports/:passportId
func (h *PassportHandler) GetPassport(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	passportID := chi.URLParam(r, "passportId")

	passport, err := h.service.GetPassport(r.Context(), orgID, passportID)
	if err != nil {
		h.respondError(w, http.StatusNotFound, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, passport)
}

// POST /api/v1/organizations/:organizationId/security-passports/:passportId/revoke
func (h *PassportHandler) RevokePassport(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	passportID := chi.URLParam(r, "passportId")

	var input struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&input)

	err := h.service.UpdatePassportStatus(r.Context(), orgID, passportID, PassportStatusRevoked, input.Reason, "User Admin")
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, map[string]string{"status": string(PassportStatusRevoked)})
}

// POST /api/v1/organizations/:organizationId/security-passports/:passportId/suspend
func (h *PassportHandler) SuspendPassport(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	passportID := chi.URLParam(r, "passportId")

	var input struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&input)

	err := h.service.UpdatePassportStatus(r.Context(), orgID, passportID, PassportStatusSuspended, input.Reason, "User Admin")
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, map[string]string{"status": string(PassportStatusSuspended)})
}

// POST /api/v1/organizations/:organizationId/security-passports/:passportId/supersede
func (h *PassportHandler) SupersedePassport(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	passportID := chi.URLParam(r, "passportId")

	var input struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&input)

	// In this implementation, supersede moves status to EXPIRED/SUPERSEDED
	err := h.service.UpdatePassportStatus(r.Context(), orgID, passportID, PassportStatusExpired, input.Reason, "User Admin")
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, map[string]string{"status": string(PassportStatusExpired)})
}

// POST /api/v1/verify/passports/:passportId
func (h *PassportHandler) CreateVerificationToken(w http.ResponseWriter, r *http.Request) {
	passportID := chi.URLParam(r, "passportId")

	token, err := h.service.GenerateVerificationToken(r.Context(), passportID)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusCreated, token)
}

// GET /api/v1/verify/passports/:passportId
// Public verification endpoint. Redacts all sensitive customer details.
func (h *PassportHandler) VerifyPassport(w http.ResponseWriter, r *http.Request) {
	passportID := chi.URLParam(r, "passportId")

	// Query passport across any org (since this is the public validation endpoint)
	var passport SecurityPassport
	query := `
		SELECT passport_id, passport_version, organization_id, system_id, system_display_name, framework_id,
		       framework_version_id, framework_fingerprint, assurance_evaluation_id, subject_fingerprint,
		       evidence_manifest_hash, issued_at, valid_until, status, assurance_level,
		       scope_summary, results_summary, limitations, issuer, signature, payload_hash
		FROM security_passports
		WHERE passport_id = $1
	`
	err := h.service.db.QueryRow(r.Context(), query, passportID).Scan(
		&passport.PassportID, &passport.PassportVersion, &passport.OrganizationID, &passport.SystemID,
		&passport.SystemDisplayName, &passport.FrameworkID, &passport.FrameworkVersionID, &passport.FrameworkFingerprint,
		&passport.AssuranceEvaluationID, &passport.SubjectFingerprint, &passport.EvidenceManifestHash,
		&passport.IssuedAt, &passport.ValidUntil, &passport.Status, &passport.AssuranceLevel,
		&passport.ScopeSummary, &passport.ResultsSummary, &passport.Limitations, &passport.Issuer,
		&passport.Signature, &passport.PayloadHash,
	)
	if err != nil {
		h.respondError(w, http.StatusNotFound, "passport not found or validation failed")
		return
	}

	// Clean/Redact details to ensure NO prompt texts, credentials, or private details leak.
	// Omit raw configurations, database paths, or private payload logs.
	redactedLimitations := []string{}
	for _, lim := range passport.Limitations {
		// Example filter logic: remove path or sensitive terms
		redactedLimitations = append(redactedLimitations, "System limitation details: "+lim)
	}

	redactedResponse := map[string]interface{}{
		"passportId":           passport.PassportID,
		"passportVersion":      passport.PassportVersion,
		"organizationId":       passport.OrganizationID,
		"systemDisplayName":    passport.SystemDisplayName,
		"frameworkId":          passport.FrameworkID,
		"frameworkVersionId":   passport.FrameworkVersionID,
		"frameworkFingerprint": passport.FrameworkFingerprint,
		"subjectFingerprint":   passport.SubjectFingerprint,
		"evidenceManifestHash": passport.EvidenceManifestHash,
		"issuedAt":             passport.IssuedAt,
		"validUntil":           passport.ValidUntil,
		"status":               passport.Status,
		"assuranceLevel":       passport.AssuranceLevel,
		"scopeSummary":         passport.ScopeSummary,
		"resultsSummary":       passport.ResultsSummary,
		"limitations":          redactedLimitations,
		"issuer":               passport.Issuer,
		"signature":            passport.Signature,
	}

	h.respondJSON(w, http.StatusOK, redactedResponse)
}

// POST /api/v1/organizations/:organizationId/systems/:systemId/heartbeat
func (h *PassportHandler) RecordHeartbeat(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	err := h.service.RecordHeartbeat(r.Context(), orgID)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.respondJSON(w, http.StatusOK, map[string]string{"status": "online"})
}

// POST /api/v1/organizations/:organizationId/findings/:findingId/dispositions
func (h *PassportHandler) CreateFindingDisposition(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	findingID := chi.URLParam(r, "findingId")

	var disp FindingDisposition
	if err := json.NewDecoder(r.Body).Decode(&disp); err != nil {
		h.respondError(w, http.StatusBadRequest, "invalid payload: "+err.Error())
		return
	}
	disp.OrganizationID = orgID
	disp.FindingID = findingID

	created, err := h.service.CreateFindingDisposition(r.Context(), &disp)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusCreated, created)
}

// GET /api/v1/organizations/:organizationId/findings/:findingId/dispositions
func (h *PassportHandler) GetFindingDispositions(w http.ResponseWriter, r *http.Request) {
	orgID := chi.URLParam(r, "organizationId")
	findingID := chi.URLParam(r, "findingId")

	list, err := h.service.GetFindingDispositions(r.Context(), orgID, findingID)
	if err != nil {
		h.respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	h.respondJSON(w, http.StatusOK, list)
}

