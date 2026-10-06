pipeline {
    agent { label 'finsight-java17-docker' }
    tools { jdk 'jdk17' }
    options {
        skipDefaultCheckout(true)
        timestamps()
    }
    stages {
        stage('Checkout Source') {
            steps { checkout scm }
        }
        stage('Backend Build') {
            steps {
                dir('backend') {
                    bat 'call mvnw.cmd -B -DskipTests package'
                }
            }
        }
        stage('Backend Unit Tests') {
            steps {
                dir('backend') {
                    bat 'call mvnw.cmd -B test'
                }
            }
        }
        stage('Web Build') {
            steps {
                dir('frontend/web') {
                    bat 'call npm ci'
                    bat 'call npm run build'
                }
            }
        }
        stage('Docker Image Build') {
            steps { bat 'docker build -t finsight-backend:ci backend' }
        }
    }
}
