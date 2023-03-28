const express = require('express');
const app = express();

const AWS = require('aws-sdk');

const sns = new AWS.SNS({
    profile: 'SNSUser',
    accessKeyId: 'AKIA2FYOJOURW4PI55HR',
    secretAccessKey: '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',
    region: 'us-east-1',
});

const port = 3000;

app.use(express.json());

app.get('/status', (req, res) => res.json({ status: "ok", sns: sns }));

app.listen(port, () => console.log(`SNS App en el puerto: ${port}!`));

const amqp = require('amqplib')
require('dotenv').config()

const hostname = process.env.HOST || 'localhost'
const protocol = process.env.PROTOCOL
const username = process.env.USERNAME
const password = process.env.PASSWORD
const queue = process.env.QUEUE

const rabbitSettings = {
    protocol: protocol,
    hostname: hostname,
    username: username,
    password: password,
    vhost: '/'
}

async function connect() {
    try {
        const conn = await amqp.connect(rabbitSettings)
        console.log("*Conectado*")

        const channel = await conn.createChannel();

        channel.consume(queue, (msg) => {
            if (msg !== null) {
                console.log("La nuevo notificacion es: " + msg);

                let now = new Date().toString();
                let email = `${msg.content.toString()} \n \n Enviado: ${now}`;
                let params = {
                    Message: email,
                    Subject: msg.content.toString(),
                    TopicArn: 'arn:aws:sns:us-east-1:699572778275:MyFirtsTopic'
                };
                sns.publish(params, function (err, data) {
                    if (err) console.log(err, err.stack);
                    else {
                        console.log(data);
                    }
                });

                channel.ack(msg)
            }
            else {
                console.log("Consumer cancelled by server")
            }
        })

    }
    catch (error) {
        console.log('Erro =>', error)
    }
}

connect()

app.post('/subscribe', (req, res) => {
    let params = {
        Protocol: 'EMAIL',
        TopicArn: 'arn:aws:sns:us-east-1:699572778275:MyFirtsTopic',
        Endpoint: req.body.email
    };

    sns.subscribe(params, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            console.log(data);
            res.send(data);
        }
    });
});

app.post('/send', (req, res) => {
    let now = new Date().toString();
    let email = `${req.body.message} \n \n Enviado: ${now}`;
    let params = {
        Message: email,
        Subject: req.body.subject,
        TopicArn: 'arn:aws:sns:us-east-1:699572778275:MyFirtsTopic'
    };

    sns.publish(params, function (err, data) {
        if (err) console.log(err, err.stack);
        else {
            console.log(data);
            res.send(data);
        }
    });
});