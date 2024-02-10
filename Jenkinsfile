pipeline {
     agent {
         label 'python'
     }
     stages {
        stage("Build") {
            steps {
                sh "sudo npm i"

            }
        }
        stage("Deploy") {
            steps {
                sh "sudo pm2 restart influencer-2029"
                sh "echo node-influencermodule.mobiloitte.io"

            }
        }
    }
}
