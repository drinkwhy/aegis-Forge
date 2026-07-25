# Aegis Forge Attack Corpus

This directory contains the attack corpus used by the Attack Generator to evaluate AI agents.

## Structure

Entries are categorized by vulnerability class and attack vector. Each entry is a YAML file conforming to the schema defined in `schema.json`.

## Adding Entries

1. Copy an existing template or start from scratch.
2. Fill in required fields (`id`, `attack_class`, `owasp_mapping`, `mitre_atlas`, `severity`, `preconditions`, `payload_template`, `canary_type`, `success_detector`, `sandbox_requirements`).
3. Place in the appropriate directory structure.
