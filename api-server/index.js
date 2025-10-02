const express = require('express')
const { generateSlug } = require('random-word-slugs')
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs')
const { Server } = require('socket.io')
const Redis = require('ioredis')
require('dotenv').config();

const app = express()
const PORT = 9000
const subscriber = new Redis('redis://127.0.0.1:6379')

const io = new Server({ cors: '*' })

io.on('connection', socket => {
    socket.on('subscribe', channel => {
        socket.join(channel)
        socket.emit('message', `Joined ${channel}`)
    })
})

io.listen(9002, () => console.log('Socket Server 9002'))

const ecsClient = new ECSClient({
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // <-- SAFE
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY // <-- SAFE
    }
});

const config = {
    CLUSTER: process.env.CLUSTER_NAME, // <-- SAFE
    TASK: process.env.TASK_DEFINITION_ARN // <-- SAFE
}
// subnets aur securityGroups mein apni dummy values ya placeholder IDs rehne dein.

// Subnets aur Security Groups mein bhi dummy strings daal dein
// Subnets: ['', '', '']  ->  Subnets: ['s-1', 's-2', 's-3']
// securityGroups: [''] -> securityGroups: ['sg-1']

app.use(express.json())

app.post('/project', async (req, res) => {
    const { gitURL, slug } = req.body
    const projectSlug = slug ? slug : generateSlug()

    // Spin the container
    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: process.env.SUBNET_IDS.split(','), // <-- SAFE (split string into array)
                 securityGroups: process.env.SECURITY_GROUP_IDS.split(',')
            }
        },
        overrides: {
            containerOverrides: [
                {
                     name: 'builder-image',
                    environment: [
                        { name: 'GIT_REPOSITORY__URL', value: gitURL }, 
                        { name: 'PROJECT_ID', value: projectSlug },
                       
                        { name: 'AWS_ACCESS_KEY_ID', value: process.env.AWS_ACCESS_KEY_ID },
                        { name: 'AWS_SECRET_ACCESS_KEY', value: process.env.AWS_SECRET_ACCESS_KEY }
                    ]
                }
            ]
        }
    })

    await ecsClient.send(command);

    return res.json({ status: 'queued', data: { projectSlug, url: `http://${projectSlug}.localhost:8000` } })

})

async function initRedisSubscribe() {
    console.log('Subscribed to logs....')
    subscriber.psubscribe('logs:*')
    subscriber.on('pmessage', (pattern, channel, message) => {
        io.to(channel).emit('message', message)
    })
}


initRedisSubscribe()

app.listen(PORT, () => console.log(`API Server Running..${PORT}`))