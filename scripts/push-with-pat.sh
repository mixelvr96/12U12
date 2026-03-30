#!/usr/bin/env bash
# Загружает GITHUB_PAT из `oup/.env` или `../.env` (например Desktop) и выполняет git push.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

load_env() {
  local f
  for f in "$REPO_ROOT/.env" "$REPO_ROOT/../.env"; do
    if [[ -f "$f" ]]; then
      set -a
      # shellcheck disable=SC1090
      source "$f"
      set +a
      return 0
    fi
  done
  return 1
}

if ! load_env; then
  echo "Не найден .env (ожидались $REPO_ROOT/.env или $REPO_ROOT/../.env)." >&2
  echo "Скопируйте .env.example → .env и задайте GITHUB_PAT." >&2
  exit 1
fi

if [[ -z "${GITHUB_PAT:-}" ]]; then
  echo "В .env не задан GITHUB_PAT." >&2
  exit 1
fi

ORIGIN="$(git remote get-url origin 2>/dev/null || true)"
if [[ -z "$ORIGIN" ]]; then
  echo "Remote origin не настроен." >&2
  exit 1
fi

# https://github.com/user/repo.git → https://x-access-token:TOKEN@github.com/user/repo.git
if [[ "$ORIGIN" =~ ^https://github\.com/(.+)$ ]]; then
  SUFFIX="${BASH_REMATCH[1]}"
  PUSH_URL="https://x-access-token:${GITHUB_PAT}@github.com/${SUFFIX}"
elif [[ "$ORIGIN" =~ ^git@github\.com:(.+)$ ]]; then
  echo "Remote по SSH ($ORIGIN). Переключите на HTTPS или используйте ssh-ключ:" >&2
  echo "  git remote set-url origin https://github.com/${BASH_REMATCH[1]}" >&2
  exit 1
else
  echo "Не удалось разобрать origin: $ORIGIN" >&2
  exit 1
fi

echo "Pushing to GitHub…"
git push "$PUSH_URL" "$@"
