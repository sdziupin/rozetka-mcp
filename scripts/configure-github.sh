#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-sdziupin/rozetka-mcp}"

command -v gh >/dev/null || { echo "GitHub CLI (gh) is required"; exit 1; }
gh auth status >/dev/null

echo "Setting default branch to devel for $REPO..."
gh api --method PATCH "repos/$REPO" -f default_branch=devel >/dev/null

echo "Protecting main..."
gh api --method PUT "repos/$REPO/branches/main/protection"   --input - <<'JSON' >/dev/null
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "test",
      "docker",
      "release-version",
      "smoke"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": false
}
JSON

echo "Repository policy configured:"
echo "  default branch: devel"
echo "  main: PR-only, admins included, strict required checks, no force-push/delete"
