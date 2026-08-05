#!/bin/bash

set -euo pipefail

APP_DIR="${APP_DIR:-/home/ec2-user/the_full_web}"
BRANCH="${BRANCH:-main}"
SERVICE_NAME="${SERVICE_NAME:-the-full-web}"

echo "[1/6] 프로젝트 경로 이동"
cd "$APP_DIR"
# Jenkins가 실행 권한을 설정해도 소스 변경으로 인식하지 않도록 파일 모드를 제외합니다.
git config core.fileMode false

echo "[2/6] 최신 소스 반영"
PREVIOUS_COMMIT="$(git rev-parse HEAD)"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"
CURRENT_COMMIT="$(git rev-parse HEAD)"

echo "[3/6] 의존성 확인"
# 잠금 파일이 변경된 배포에서만 전체 의존성을 다시 설치합니다.
if [ ! -d node_modules ] || ! git diff --quiet "$PREVIOUS_COMMIT" "$CURRENT_COMMIT" -- package-lock.json; then
  npm ci --no-audit --no-fund
else
  echo "패키지 변경이 없어 기존 의존성을 사용합니다."
fi

echo "[4/6] 운영 빌드 수행"
npm run build

echo "[5/6] 서비스 재시작"
sudo systemctl restart "$SERVICE_NAME"

echo "[6/6] 서비스 상태 확인"
sudo systemctl status "$SERVICE_NAME" --no-pager
