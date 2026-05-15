# hop Security Policy

## Reporting a Vulnerability

Report privately via [GitHub Security Advisories](https://github.com/opsvr-ai/hop/security/advisories/new). Do not open public issues for security vulnerabilities.

A useful report includes:
- A concise description and severity assessment
- The affected component (file path and line range)
- Environment details (version, commit SHA, OS, Python version)
- Reproduction steps against `main` or the latest release

## Trust Model

hop is a single-tenant personal agent. Its security posture is layered.

### The Boundary: OS-Level Isolation

The only security boundary against an adversarial LLM is the operating system. Nothing inside the agent process constitutes containment — not the approval gate, not output redaction, not any pattern scanner.

hop supports two OS-level isolation postures:

**Terminal-backend isolation:** Run shell commands inside a container, remote host, or cloud sandbox via a non-default terminal backend. This confines shell and file operations but not in-process code (code-execution, MCP subprocesses, plugins, skills).

**Whole-process wrapping:** Run the entire agent process tree inside a sandbox (Docker, OpenShell). Every code path is subject to filesystem, network, and process policy.

### In-Process Heuristics

These components are useful for accident prevention but are not security boundaries:
- **Approval gate:** Detects common destructive shell patterns and prompts before execution
- **Skills Guard:** Scans installable skill content for injection patterns — a review aid, not a boundary

### External Surfaces

Each external surface (gateway platforms, API server, web dashboard, editor adapters) requires its own authorization. An allowlist is required for every network-exposed adapter.

## Scope

### In Scope
- Escape from a declared OS-level isolation posture
- Unauthorized external-surface access
- Credential exfiltration via mechanisms that should have prevented it
- Code behaving contrary to documented security stances

### Out of Scope
- Bypasses of in-process heuristics (approval gate, redaction)
- Prompt injection without a chained in-scope outcome
- Third-party skills and plugins (operator review surface, not hop's trust surface)

## Deployment Hardening

- Run the agent as a non-root user
- Keep credentials out of version control
- Do not expose the gateway or API to the public internet without VPN or firewall
- Configure caller allowlists for every network-exposed adapter
- Review third-party skills and plugins before install

## Disclosure

- **Window:** 90 days from report, or until a fix is released
- **Credit:** Reporters are credited in release notes unless anonymity is requested
