pipeline {
  agent any

  environment {
    APP_DIR = '/home/ec2-user/the_full_web'
    BRANCH = 'main'
    SERVICE_NAME = 'the-full-web'
  }

  stages {
    stage('Deploy') {
      steps {
        sh '''
          cd "$APP_DIR"
          chmod +x scripts/deploy-ec2.sh
          APP_DIR="$APP_DIR" BRANCH="$BRANCH" SERVICE_NAME="$SERVICE_NAME" ./scripts/deploy-ec2.sh
        '''
      }
    }
  }
}
