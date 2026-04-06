#!/bin/bash

set -euo pipefail

APP_DIR="${APP_DIR:-/home/ec2-user/the_full_web}"
BRANCH="${BRANCH:-main}"
SERVICE_NAME="${SERVICE_NAME:-the-full-web}"

echo "[1/6] 프로젝트 경로 이동"
cd "$APP_DIR"

echo "[2/6] 최신 소스 반영"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "[3/6] 의존성 설치"
npm ci

echo "[4/6] 운영 빌드 수행"
npm run build

echo "[5/6] 서비스 재시작"
sudo systemctl restart "$SERVICE_NAME"

echo "[6/6] 서비스 상태 확인"
sudo systemctl status "$SERVICE_NAME" --no-pager
