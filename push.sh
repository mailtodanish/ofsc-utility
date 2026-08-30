#!/usr/bin/env bash
#
# push.sh - stage, commit (with an AI-generated message via local Ollama), and push.
#
# Usage:
#   ./push.sh                     auto-generate commit message, push current branch
#   ./push.sh -m "manual message" skip Ollama, use your own message
#   ./push.sh -M codellama        use a specific Ollama model
#   ./push.sh -n                  dry run: show diff and generated message, don't commit or push
#   ./push.sh -b feature/foo      push to a specific branch instead of current
#
# Requirements:
#   - git
#   - curl
#   - ollama running locally (default: http://localhost:11434) with a model pulled
#     e.g. ollama pull qwen3:8b

set -euo pipefail

# ---------- defaults ----------
OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-qwen3:8b}"
MANUAL_MESSAGE=""
DRY_RUN=false
TARGET_BRANCH=""

# ---------- arg parsing ----------
while getopts "m:M:b:nh" opt; do
  case "$opt" in
    m) MANUAL_MESSAGE="$OPTARG" ;;
    M) OLLAMA_MODEL="$OPTARG" ;;
    b) TARGET_BRANCH="$OPTARG" ;;
    n) DRY_RUN=true ;;
    h)
      echo "Usage: $0 [-m \"message\"] [-M model] [-b branch] [-n]"
      echo "  -m  Manual commit message (skips Ollama)"
      echo "  -M  Ollama model to use (default: qwen3:8b)"
      echo "  -b  Target branch to push (default: current branch)"
      echo "  -n  Dry run, show diff and generated message, don't commit or push"
      exit 0
      ;;
    *)
      echo "Unknown option. Use -h for help." >&2
      exit 1
      ;;
  esac
done

# ---------- sanity checks ----------
if ! command -v git >/dev/null 2>&1; then
  echo "Error: git is not installed." >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: not inside a git repository." >&2
  exit 1
fi

if [[ -z "$MANUAL_MESSAGE" ]] && ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is required to talk to Ollama (or pass -m to skip it)." >&2
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
BRANCH="${TARGET_BRANCH:-$CURRENT_BRANCH}"

# ---------- stage changes ----------
echo "Staging changes..."
git add .

if git diff --cached --quiet; then
  echo "Nothing staged. Working tree matches last commit. Nothing to do."
  exit 0
fi

DIFF="$(git diff --cached --no-color)"

# Trim excessively large diffs so we don't blow the model's context window
MAX_DIFF_CHARS=12000
if [[ ${#DIFF} -gt $MAX_DIFF_CHARS ]]; then
  DIFF="${DIFF:0:$MAX_DIFF_CHARS}
... [diff truncated for length] ..."
fi

# ---------- generate commit message ----------
if [[ -n "$MANUAL_MESSAGE" ]]; then
  COMMIT_MSG="$MANUAL_MESSAGE"
else
  echo "Requesting commit message from Ollama ($OLLAMA_MODEL)..."

  PROMPT=$(cat <<EOF
You are a git commit message generator. Write a concise, conventional commit
message for the following staged diff.

Rules:
- First line: a short imperative summary (max 72 chars), optionally prefixed
  with a conventional commit type (feat/fix/chore/refactor/docs/test/etc).
- Leave a blank line, then optional bullet points for notable details only
  if the diff is non-trivial.
- Do not include the diff, code fences, or any explanation. Output ONLY the
  commit message text.

Diff:
$DIFF
EOF
)

  # Build a JSON payload safely (requires jq if available, falls back to python)
  if command -v jq >/dev/null 2>&1; then
    JSON_PAYLOAD=$(jq -n --arg model "$OLLAMA_MODEL" --arg prompt "$PROMPT" \
      '{model: $model, prompt: $prompt, stream: false}')
  else
    JSON_PAYLOAD=$(python3 -c '
import json, sys
model, prompt = sys.argv[1], sys.argv[2]
print(json.dumps({"model": model, "prompt": prompt, "stream": False}))
' "$OLLAMA_MODEL" "$PROMPT")
  fi

  RESPONSE=$(curl -sS --fail -X POST "$OLLAMA_HOST/api/generate" \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD" || true)

  if [[ -z "$RESPONSE" ]]; then
    echo "Warning: Ollama request failed (is it running at $OLLAMA_HOST?). Falling back to manual input." >&2
    read -r -p "Enter commit message: " COMMIT_MSG
  else
    if command -v jq >/dev/null 2>&1; then
      COMMIT_MSG=$(echo "$RESPONSE" | jq -r '.response' 2>/dev/null | sed '/^\s*$/d') || true
    else
      COMMIT_MSG=$(python3 -c '
import json, sys
data = json.loads(sys.stdin.read())
print(data.get("response", "").strip())
' <<< "$RESPONSE" 2>/dev/null) || true
    fi

    if [[ -z "$COMMIT_MSG" ]]; then
      echo "Warning: could not parse a response from Ollama. Raw output was:" >&2
      echo "$RESPONSE" >&2
      read -r -p "Enter commit message: " COMMIT_MSG
    fi
  fi
fi

echo ""
echo "----- Generated commit message -----"
echo "$COMMIT_MSG"
echo "-------------------------------------"
echo ""

if $DRY_RUN; then
  echo "Dry run complete. Not committing or pushing."
  exit 0
fi

read -r -p "Proceed with this commit message? [Y/n/e(dit)] " CONFIRM
CONFIRM="${CONFIRM:-Y}"

case "$CONFIRM" in
  [Nn]*)
    echo "Aborted. Changes remain staged."
    exit 0
    ;;
  [Ee]*)
    TMP_MSG_FILE="$(mktemp)"
    echo "$COMMIT_MSG" > "$TMP_MSG_FILE"
    "${EDITOR:-nano}" "$TMP_MSG_FILE"
    COMMIT_MSG="$(cat "$TMP_MSG_FILE")"
    rm -f "$TMP_MSG_FILE"
    ;;
esac

# ---------- commit ----------
echo "Committing..."
git commit -m "$COMMIT_MSG"

# ---------- push ----------
echo "Pushing to origin/$BRANCH..."
if git push origin "$BRANCH"; then
  echo "Pushed successfully to origin/$BRANCH."
else
  echo "Error: push failed. You may need to pull or rebase first." >&2
  exit 1
fi