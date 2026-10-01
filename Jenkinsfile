// Requires a separate Linux build agent labeled finsight-java17-docker with JDK 17,
// Git, and Docker CLI/daemon access. The existing Jenkins controller uses JDK 21.
pipeline {
    agent { label 'finsight-java17-docker' }
    options { timestamps() }
    stages {
        stage('Checkout Source') {
            steps { checkout scm }
        }
        stage('Backend Build') {
            steps { sh 'cd backend && ./mvnw -B -DskipTests package' }
        }
        stage('Backend Unit Tests') {
            steps { sh 'cd backend && ./mvnw -B test' }
        }
        stage('Docker Image Build (future integration)') {
            when { expression { false } }
            steps { sh 'docker build -t finsight-backend:ci backend' }
        }
    }
}
