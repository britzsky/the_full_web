# EC2 배포 가이드

## 변경 목적
- EC2에서 이 프로젝트 소스를 직접 받아 빌드하고 8081 포트로 실행할 수 있게 배포 기준을 정리합니다.

## 영향 범위
- `package.json`
- `scripts/deploy-ec2.sh`
- `deploy/the-full-web.service`
- `deploy/nginx-the-full-web.conf`
- `deploy/nginx-the-full-web-domain.conf`
- `Jenkinsfile`

## 사전 준비
- EC2에 Node.js 20 설치
- EC2에 Git 설치
- EC2 보안 그룹에서 `80` 또는 `443` 포트 오픈
- Nginx를 쓰지 않고 직접 접속할 경우 `8081` 포트 오픈
- 프로젝트 경로 예시: `/home/ec2-user/the_full_web`

## 운영 환경변수
- 운영 서버에서는 `.env.real` 파일을 프로젝트 루트에 둡니다.
- `npm run build`, `npm start`는 `.env.real` 기준으로 동작합니다.
- 아래 값은 운영 주소에 맞게 확인합니다.

```env
NEXTAUTH_URL=http://운영주소:8081
NEXT_PUBLIC_BASE_URL=http://운영주소:8081
PORT=8081
WEB_API_BASE_URL=http://운영주소:8090
ERP_INQUIRY_WEBHOOK_URL=http://운영주소:8080/ERP/ContactInquiryWebhook
```

## EC2 초기 설정
### 1. 프로젝트 배치
```bash
cd /home/ec2-user
git clone <저장소 주소> the_full_web
cd the_full_web
```

### 2. 운영 환경변수 파일 배치
```bash
vi /home/ec2-user/the_full_web/.env.real
```

### 3. 의존성 설치 및 최초 빌드
```bash
cd /home/ec2-user/the_full_web
npm ci
npm run build
```

## systemd 등록
### 1. 서비스 파일 복사
```bash
sudo cp deploy/the-full-web.service /etc/systemd/system/the-full-web.service
```

### 2. 서비스 등록
```bash
sudo systemctl daemon-reload
sudo systemctl enable the-full-web
sudo systemctl start the-full-web
sudo systemctl status the-full-web --no-pager
```

## Nginx 설정
### 1. 설정 파일 복사
```bash
sudo cp deploy/nginx-the-full-web.conf /etc/nginx/conf.d/the-full-web.conf
```

### 2. 문법 확인 및 재시작
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 도메인을 사용하는 경우
- `deploy/nginx-the-full-web-domain.conf` 파일의 `your-domain.com`을 실제 도메인으로 바꿉니다.
- `.env.real`의 URL 관련 값도 같은 도메인 기준으로 맞춥니다.

```bash
sudo cp deploy/nginx-the-full-web-domain.conf /etc/nginx/conf.d/the-full-web.conf
sudo nginx -t
sudo systemctl restart nginx
```

## Jenkins 설정 예시
### Jenkins 서버가 EC2 안에서 직접 실행되는 경우
- Freestyle job 또는 Pipeline job에서 배포 스크립트를 호출합니다.
- Jenkins 실행 계정이 `sudo systemctl restart the-full-web`를 실행할 수 있어야 합니다.

```bash
cd /home/ec2-user/the_full_web
chmod +x scripts/deploy-ec2.sh
APP_DIR=/home/ec2-user/the_full_web BRANCH=main SERVICE_NAME=the-full-web ./scripts/deploy-ec2.sh
```

### Jenkinsfile 예시
- 프로젝트 루트의 `Jenkinsfile`을 그대로 사용할 수 있습니다.

## Jenkins 계정 sudo 설정 예시
- `visudo`로 아래 항목을 추가하면 서비스 재시작만 허용할 수 있습니다.

```bash
jenkins ALL=(ALL) NOPASSWD: /bin/systemctl restart the-full-web, /bin/systemctl status the-full-web --no-pager
```

## 운영 점검 명령
```bash
cd /home/ec2-user/the_full_web
npm run build
sudo systemctl restart the-full-web
sudo systemctl status the-full-web --no-pager
curl http://127.0.0.1:8081
```

## systemd와 PM2 중 추천 방식
- 현재 프로젝트는 EC2 부팅 후 자동 실행, Jenkins 재배포 후 재시작, 운영 장애 시 자동 재시작이 중요하므로 `systemd`를 우선 추천합니다.
- 운영 표준에 맞게 서비스 등록과 상태 확인을 할 수 있어 Jenkins와도 연결이 단순합니다.
- PM2는 여러 Node 프로세스를 한 서버에서 함께 관리할 때 편하지만, 지금처럼 단일 Next.js 서비스를 띄우는 구조에서는 `systemd`가 더 단순합니다.
- 따라서 현재 기준 권장 방식은 `systemd + Nginx` 조합입니다.

## 주의사항
- 도메인을 사용할 경우 `.env.real`의 URL 값을 IP 대신 도메인으로 맞춥니다.
- HTTPS를 사용할 경우 Nginx 또는 ALB에서 SSL 종료를 처리합니다.
- `npm start`는 현재 `8081` 포트로 고정되어 있습니다.
