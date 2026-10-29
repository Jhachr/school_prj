#!/bin/sh

set -eu

skill_names="research-proposal-coach session-to-feishu-doc"
repo_url="${RESEARCH_SKILL_REPO:-https://gitee.com/jhachr/school_prj.git}"
repo_ref="${RESEARCH_SKILL_REF:-main}"
target="trae"
dest_root=""
upgrade="false"

usage() {
  cat <<'EOF'
Install research-proposal-coach and session-to-feishu-doc from Gitee.

Usage:
  install-research-proposal-coach.sh [--target trae|trae-cn|codex] [--dest DIR]
                                     [--repo URL] [--ref REF] [--upgrade]

Options:
  --target TARGET      Install under the standard TRAE CN or Codex skill directory.
                       "trae" and "trae-cn" both mean TRAE CN. Defaults to trae.
  --dest DIR           Install under DIR instead of a standard skill directory.
  --repo URL           Git repository URL. Defaults to the public project repo.
  --ref REF            Git branch or tag. Defaults to main.
  --upgrade            Replace valid existing copies of both bundled skills.
  -h, --help           Show this help.

By default, the installer does not overwrite either existing skill directory. Pass
--upgrade explicitly to replace installed copies as one rollback-safe transaction.
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
    --upgrade)
      upgrade="true"
      shift
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
    trae|trae-cn)
      dest_root="${TRAE_HOME:-$HOME/.trae-cn}/skills"
      ;;
    *)
      echo "Unsupported target: $target (expected trae, trae-cn, or codex)" >&2
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
    if [ "$upgrade" != "true" ]; then
      echo "Refusing to overwrite existing skill: $destination" >&2
      echo "Run the installer again with --upgrade to replace both bundled skills safely." >&2
      exit 1
    fi
    if [ ! -d "$destination" ] || [ ! -f "$destination/SKILL.md" ] || [ -L "$destination" ] \
      || ! grep -Eq "^name:[[:space:]]*${skill_name}[[:space:]]*$" "$destination/SKILL.md"; then
      echo "Refusing to upgrade an unrecognized destination: $destination" >&2
      echo "Move it aside manually, then run the installer again." >&2
      exit 1
    fi
  fi
done

temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/research-skill-install.XXXXXX")"
install_stage=""
backup_stage=""
transaction_active="false"
cleanup() {
  if [ "$transaction_active" = "true" ] && [ -n "$backup_stage" ]; then
    transaction_active="false"
    echo "Upgrade did not complete; restoring the previous skill versions." >&2
    for skill_name in $skill_names; do
      destination="$dest_root/$skill_name"
      backup="$backup_stage/$skill_name"
      marker="$backup_stage/$skill_name.was-present"
      if [ -f "$marker" ]; then
        if [ -d "$backup" ]; then
          if [ -e "$destination" ]; then
            rm -r "$destination"
          fi
          mv "$backup" "$destination" || true
        fi
      elif [ -e "$destination" ]; then
        rm -r "$destination"
      fi
    done
  fi
  if [ -n "$install_stage" ] && [ -d "$install_stage" ]; then
    rm -r "$install_stage"
  fi
  if [ -n "$backup_stage" ] && [ -d "$backup_stage" ]; then
    rm -r "$backup_stage"
  fi
  if [ -n "${temp_dir:-}" ] && [ -d "$temp_dir" ]; then
    rm -r "$temp_dir"
  fi
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

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
if [ "$upgrade" = "true" ]; then
  install_stage="$(mktemp -d "$dest_root/.research-skill-stage.XXXXXX")"
  backup_stage="$(mktemp -d "$dest_root/.research-skill-backup.XXXXXX")"

  for skill_name in $skill_names; do
    cp -R "$checkout/skills/$skill_name" "$install_stage/$skill_name"
  done

  transaction_active="true"
  for skill_name in $skill_names; do
    destination="$dest_root/$skill_name"
    if [ -e "$destination" ]; then
      touch "$backup_stage/$skill_name.was-present"
      mv "$destination" "$backup_stage/$skill_name"
    fi
  done
  for skill_name in $skill_names; do
    mv "$install_stage/$skill_name" "$dest_root/$skill_name"
  done
  transaction_active="false"

  for skill_name in $skill_names; do
    destination="$dest_root/$skill_name"
    if [ -f "$backup_stage/$skill_name.was-present" ]; then
      echo "Updated $skill_name at $destination"
    else
      echo "Installed $skill_name to $destination"
    fi
  done
else
  for skill_name in $skill_names; do
    source_dir="$checkout/skills/$skill_name"
    destination="$dest_root/$skill_name"
    cp -R "$source_dir" "$destination"
    echo "Installed $skill_name to $destination"
  done
fi

echo "Both skills will be available in a new conversation or after the host reloads skills."
if [ "$target" = "trae" ] || [ "$target" = "trae-cn" ]; then
  echo "For TRAE CN, restart or reload TRAE, then check Settings > Skills & Commands > Global."
fi
echo "On first upload, ask the assistant to initialize session feedback sharing."
