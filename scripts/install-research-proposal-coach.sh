#!/bin/sh

set -eu

skill_names="research-proposal-coach session-to-feishu-doc"
repo_url="${RESEARCH_SKILL_REPO:-https://github.com/Jhachr/school_prj.git}"
repo_ref="${RESEARCH_SKILL_REF:-main}"
target="codex"
dest_root=""

usage() {
  cat <<'EOF'
Install research-proposal-coach and session-to-feishu-doc from GitHub.

Usage:
  install-research-proposal-coach.sh [--target codex|trae] [--dest DIR]
                                     [--repo URL] [--ref REF]

Options:
  --target codex|trae  Install under the standard Codex or Trae skill directory.
                      Defaults to codex.
  --dest DIR           Install under DIR instead of a standard skill directory.
  --repo URL           Git repository URL. Defaults to the public project repo.
  --ref REF            Git branch or tag. Defaults to main.
  -h, --help           Show this help.

The installer does not overwrite either existing skill directory. It checks both
destinations before copying, so an expected conflict cannot leave a partial install.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --target)
      [ "$#" -ge 2 ] || { echo "Missing value for --target" >&2; exit 2; }
      target="$2"
      shift 2
      ;;
    --dest)
      [ "$#" -ge 2 ] || { echo "Missing value for --dest" >&2; exit 2; }
      dest_root="$2"
      shift 2
      ;;
    --repo)
      [ "$#" -ge 2 ] || { echo "Missing value for --repo" >&2; exit 2; }
      repo_url="$2"
      shift 2
      ;;
    --ref)
      [ "$#" -ge 2 ] || { echo "Missing value for --ref" >&2; exit 2; }
      repo_ref="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ -z "$dest_root" ]; then
  case "$target" in
    codex)
      dest_root="${CODEX_HOME:-$HOME/.codex}/skills"
      ;;
    trae)
      dest_root="${TRAE_HOME:-$HOME/.trae-cn}/skills"
      ;;
    *)
      echo "Unsupported target: $target (expected codex or trae)" >&2
      exit 2
      ;;
  esac
fi

command -v git >/dev/null 2>&1 || {
  echo "git is required but was not found." >&2
  exit 1
}

for skill_name in $skill_names; do
  destination="$dest_root/$skill_name"
  if [ -e "$destination" ]; then
    echo "Refusing to overwrite existing skill: $destination" >&2
    echo "Move or remove it first, then run the installer again." >&2
    exit 1
  fi
done

temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/research-skill-install.XXXXXX")"
cleanup() {
  if [ -n "${temp_dir:-}" ] && [ -d "$temp_dir" ]; then
    rm -r "$temp_dir"
  fi
}
trap cleanup EXIT HUP INT TERM

checkout="$temp_dir/repo"
git clone --quiet --depth 1 --filter=blob:none --sparse --branch "$repo_ref" "$repo_url" "$checkout"
git -C "$checkout" sparse-checkout set \
  skills/research-proposal-coach \
  skills/session-to-feishu-doc

for skill_name in $skill_names; do
  skill_path="skills/$skill_name"
  source_dir="$checkout/$skill_path"
  if [ ! -f "$source_dir/SKILL.md" ]; then
    echo "Downloaded content is not a valid skill: missing $skill_path/SKILL.md" >&2
    exit 1
  fi
done

mkdir -p "$dest_root"
for skill_name in $skill_names; do
  source_dir="$checkout/skills/$skill_name"
  destination="$dest_root/$skill_name"
  cp -R "$source_dir" "$destination"
  echo "Installed $skill_name to $destination"
done

echo "Both skills will be available in a new conversation or after the host reloads skills."
echo "On first upload, ask the assistant to initialize session feedback sharing."
