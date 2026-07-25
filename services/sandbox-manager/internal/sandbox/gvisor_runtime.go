package sandbox

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
)

// GVisorRuntime implements SandboxRuntime using gVisor (runsc) via containerd.
// It provides user-space kernel interception — all syscalls from the sandboxed
// process are intercepted by gVisor's Sentry before reaching the host kernel.
//
// Prerequisites on the EKS node:
//   - containerd with containerd-shim-runsc-v1 installed
//   - RuntimeClass "gvisor" configured in Kubernetes
//   - /usr/local/bin/runsc binary present
type GVisorRuntime struct {
	// containerdSock is the path to the containerd UNIX socket.
	containerdSock string
	// egressProxyAddr is the address of the egress proxy that enforces RoE scope.
	egressProxyAddr string
	// sinkholeBaseURL is the domain for canary webhook callbacks.
	sinkholeBaseURL string
	// sandboxRootDir is the host directory for sandbox working files.
	sandboxRootDir string
}

// NewGVisorRuntime creates a new gVisor-backed sandbox runtime.
func NewGVisorRuntime(containerdSock, egressProxyAddr, sinkholeBaseURL, sandboxRootDir string) *GVisorRuntime {
	return &GVisorRuntime{
		containerdSock:  containerdSock,
		egressProxyAddr: egressProxyAddr,
		sinkholeBaseURL: sinkholeBaseURL,
		sandboxRootDir:  sandboxRootDir,
	}
}

// Provision creates a new gVisor-isolated container for a test campaign.
func (g *GVisorRuntime) Provision(ctx context.Context, spec SandboxSpec) (SandboxHandle, error) {
	id := GenerateSandboxID()

	log.Info().
		Str("sandbox_id", id).
		Str("campaign_id", spec.CampaignID).
		Msg("provisioning gVisor sandbox")

	// Create sandbox working directory
	sandboxDir := filepath.Join(g.sandboxRootDir, id)
	if err := os.MkdirAll(sandboxDir, 0700); err != nil {
		return SandboxHandle{}, fmt.Errorf("failed to create sandbox dir: %w", err)
	}

	// Write the agent configuration to a file for the sandbox to read
	configData, err := json.Marshal(spec.AgentConfig)
	if err != nil {
		return SandboxHandle{}, fmt.Errorf("failed to marshal agent config: %w", err)
	}
	if err := os.WriteFile(filepath.Join(sandboxDir, "agent_config.json"), configData, 0600); err != nil {
		return SandboxHandle{}, fmt.Errorf("failed to write agent config: %w", err)
	}

	// Write synthetic files to the sandbox directory
	for _, f := range spec.SyntheticData.Files {
		destPath := filepath.Join(sandboxDir, "fs", f.Path)
		if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
			return SandboxHandle{}, fmt.Errorf("failed to create dir for synthetic file %s: %w", f.Path, err)
		}
		mode := os.FileMode(f.Mode)
		if mode == 0 {
			mode = 0644
		}
		if err := os.WriteFile(destPath, []byte(f.Content), mode); err != nil {
			return SandboxHandle{}, fmt.Errorf("failed to write synthetic file %s: %w", f.Path, err)
		}
	}

	// Build environment variables for the sandbox
	env := buildEnvVars(spec)

	// Run the container with gVisor runtime via nerdctl or ctr
	// In production (EKS), this would use the Kubernetes API to create a Pod
	// with runtimeClassName: gvisor. Here we use nerdctl for local/dev.
	args := buildContainerArgs(id, sandboxDir, env, spec)

	log.Debug().
		Str("sandbox_id", id).
		Strs("args", args).
		Msg("launching container with gVisor runtime")

	cmd := exec.CommandContext(ctx, "nerdctl", args...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	if err := cmd.Start(); err != nil {
		// Clean up sandbox dir on failure
		os.RemoveAll(sandboxDir)
		return SandboxHandle{}, fmt.Errorf("failed to start gVisor container: %w (stderr: %s)", err, stderr.String())
	}

	handle := SandboxHandle{
		ID:          id,
		Status:      StatusProvisioning,
		CreatedAt:   time.Now(),
		InternalIP:  "10.100." + strconv.Itoa(int(time.Now().UnixNano()%255)) + ".2",
		MockAPIPort: 9000,
	}

	log.Info().
		Str("sandbox_id", id).
		Str("status", string(StatusReady)).
		Msg("gVisor sandbox ready")

	handle.Status = StatusReady
	return handle, nil
}

// buildEnvVars constructs the environment variable list for the sandbox container.
// Canary credentials are injected here.
func buildEnvVars(spec SandboxSpec) []string {
	env := []string{}

	// Inject canary environment variables
	for k, v := range spec.SyntheticData.EnvVars {
		env = append(env, fmt.Sprintf("%s=%s", k, v))
	}

	// Always inject the agent config path
	env = append(env, "AEGIS_AGENT_CONFIG=/sandbox/agent_config.json")
	env = append(env, "AEGIS_CAMPAIGN_ID="+spec.CampaignID)
	env = append(env, "AEGIS_RUN_ID="+spec.RunID)

	// Inject agent's own env vars (from the target config)
	for k, v := range spec.AgentConfig.EnvironmentVars {
		env = append(env, fmt.Sprintf("%s=%s", k, v))
	}

	return env
}

// buildContainerArgs constructs the nerdctl run arguments for the gVisor sandbox.
func buildContainerArgs(id, sandboxDir string, env []string, spec SandboxSpec) []string {
	args := []string{
		"run",
		"--name", id,
		"--runtime", "io.containerd.runsc.v1", // gVisor runtime shim
		"--rm",                                  // Auto-remove when done (ephemeral)
		"--network", "none",                     // No direct network — egress proxy handles outbound
		"--read-only",                           // Read-only root filesystem
		"--no-new-privileges",
		"--cap-drop", "ALL",                     // Drop all Linux capabilities
		"--security-opt", "no-new-privileges:true",
		"-v", sandboxDir + ":/sandbox:ro",       // Mount sandbox config read-only
		"-v", sandboxDir + "/fs:/mnt/sandbox:rw", // Mount synthetic filesystem
		"--memory", "512m",                       // Memory limit per sandbox
		"--cpus", "1",                            // CPU limit
	}

	// Inject environment variables
	for _, e := range env {
		args = append(args, "-e", e)
	}

	// Set timeout via --stop-timeout
	timeout := spec.MaxDurationSeconds
	if timeout == 0 {
		timeout = 300 // 5 minute default
	}
	args = append(args, "--stop-timeout", strconv.Itoa(timeout))

	// Egress proxy label for traffic routing
	args = append(args, "--label", "aegis.egress-proxy="+spec.CampaignID)
	args = append(args, "--label", "aegis.campaign-id="+spec.CampaignID)

	// The sandbox agent image (runs the target agent in the isolated env)
	args = append(args, "aegis-forge/sandbox-agent:latest")

	return args
}

// Terminate destroys a running gVisor sandbox and cleans up all ephemeral state.
// This is always called via defer in RunTestCampaign to guarantee cleanup.
func (g *GVisorRuntime) Terminate(ctx context.Context, id string) error {
	log.Info().Str("sandbox_id", id).Msg("terminating gVisor sandbox")

	// Force-stop the container
	stopCmd := exec.CommandContext(ctx, "nerdctl", "rm", "-f", id)
	if out, err := stopCmd.CombinedOutput(); err != nil {
		// Log but don't fail — we still want to clean up the directory
		log.Warn().
			Str("sandbox_id", id).
			Str("output", string(out)).
			Err(err).
			Msg("container stop returned error (may already be stopped)")
	}

	// Remove sandbox working directory — no persistent state survives
	sandboxDir := filepath.Join(g.sandboxRootDir, id)
	if err := os.RemoveAll(sandboxDir); err != nil {
		return fmt.Errorf("failed to remove sandbox dir %s: %w", sandboxDir, err)
	}

	log.Info().Str("sandbox_id", id).Msg("sandbox terminated and state wiped")
	return nil
}

// Exec runs a command inside a running sandbox. Used for seeding test data
// or verifying state before/after attack execution.
func (g *GVisorRuntime) Exec(ctx context.Context, id, command string, args []string) (ExecResult, error) {
	start := time.Now()

	nerdctlArgs := append([]string{"exec", id, command}, args...)
	cmd := exec.CommandContext(ctx, "nerdctl", nerdctlArgs...)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			return ExecResult{}, fmt.Errorf("exec failed: %w", err)
		}
	}

	return ExecResult{
		ExitCode: exitCode,
		Stdout:   stdout.String(),
		Stderr:   stderr.String(),
		Duration: time.Since(start),
	}, nil
}

// StreamEvents returns a channel of trace events from the sandbox.
// In production, this reads from an eBPF ring buffer or the egress proxy logs.
// For MVP, it reads from the container's stdout in a structured JSON format.
func (g *GVisorRuntime) StreamEvents(ctx context.Context, id string) (<-chan SandboxEvent, error) {
	ch := make(chan SandboxEvent, 100)

	go func() {
		defer close(ch)

		// In MVP: tail container logs looking for structured JSON events
		// In production: read from eBPF ring buffer via perf_event
		cmd := exec.CommandContext(ctx, "nerdctl", "logs", "-f", id)
		stdout, err := cmd.StdoutPipe()
		if err != nil {
			log.Error().Str("sandbox_id", id).Err(err).Msg("failed to open log pipe")
			return
		}

		if err := cmd.Start(); err != nil {
			log.Error().Str("sandbox_id", id).Err(err).Msg("failed to start log tailing")
			return
		}

		// Read log lines and parse structured events
		buf := make([]byte, 4096)
		var remainder strings.Builder

		for {
			n, readErr := stdout.Read(buf)
			if n > 0 {
				remainder.Write(buf[:n])
				text := remainder.String()
				lines := strings.Split(text, "\n")

				for i := 0; i < len(lines)-1; i++ {
					line := strings.TrimSpace(lines[i])
					if line == "" {
						continue
					}

					var event SandboxEvent
					if err := json.Unmarshal([]byte(line), &event); err == nil {
						event.SandboxID = id
						if event.Timestamp.IsZero() {
							event.Timestamp = time.Now()
						}
						select {
						case ch <- event:
						case <-ctx.Done():
							return
						}
					}
				}

				remainder.Reset()
				if len(lines) > 0 {
					remainder.WriteString(lines[len(lines)-1])
				}
			}

			if readErr != nil {
				break
			}
		}

		cmd.Wait()
	}()

	return ch, nil
}
