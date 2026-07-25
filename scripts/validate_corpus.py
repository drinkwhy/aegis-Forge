#!/usr/bin/env python3
"""
Validates all YAML files in attack-corpus/ against the schema.json.
Run from the monorepo root.

Usage: python scripts/validate_corpus.py
"""

import json
import sys
import yaml
from pathlib import Path
import jsonschema

ROOT = Path(__file__).parent.parent
CORPUS_PATH = ROOT / "attack-corpus"
SCHEMA_PATH = CORPUS_PATH / "schema.json"


def main():
    with open(SCHEMA_PATH) as f:
        schema = json.load(f)

    validator = jsonschema.Draft7Validator(schema)

    errors = []
    validated = 0

    for yaml_file in sorted(CORPUS_PATH.rglob("*.yaml")):
        # Skip discovered payloads — they have a different schema
        if "discovered" in str(yaml_file):
            continue

        with open(yaml_file) as f:
            try:
                data = yaml.safe_load(f)
            except yaml.YAMLError as e:
                errors.append(f"YAML parse error in {yaml_file}: {e}")
                continue

        if data is None:
            errors.append(f"Empty file: {yaml_file}")
            continue

        validation_errors = list(validator.iter_errors(data))
        if validation_errors:
            for err in validation_errors:
                errors.append(f"{yaml_file}: {err.message} (path: {list(err.absolute_path)})")
        else:
            validated += 1
            print(f"  ✓ {yaml_file.relative_to(ROOT)}")

    print(f"\nValidated {validated} corpus entries.")

    if errors:
        print(f"\n❌ {len(errors)} validation error(s):\n")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)
    else:
        print("✅ All corpus entries are valid.")
        sys.exit(0)


if __name__ == "__main__":
    main()
