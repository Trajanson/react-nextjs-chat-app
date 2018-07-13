const functions = require('firebase-functions');
const firebase = require('firebase-admin');

const cors = require('cors');
const next = require('next');
const Pusher = require('pusher');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const Sentiment = require('sentiment');

const firebaseApp = firebase.initializeApp(
  functions.config().firebase
)

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;

const app = next({ dev });
const handler = app.getRequestHandler();
const sentiment = new Sentiment();

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_APP_CLUSTER,
  encrypted: true
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://<YOUR-APP-NAME>.herokuapp.com");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})

app.prepare()
  .then(() => {

    const server = express();

    server.use(cors());
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({ extended: true }));

    server.get('*', (req, res) => {
      return handler(req, res);
    })

const chatHistory = { messages: [] };

server.post('/message', (req, res, next) => {
  const { user = null, message = '', timestamp = +new Date } = req.body;
  const sentimentScore = sentiment.analyze(message).score;

  const chat = { user, message, timestamp, sentiment: sentimentScore };

  chatHistory.messages.push(chat);
  pusher.trigger('chat-room', 'new-message', { chat });

  res.send(Widgets.create());
});

server.post('/messages', (req, res, next) => {
  res.json({ ...chatHistory, status: 'success' });

  res.send(Widgets.create());
});

server.listen(port, err => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${port}`);
});

})
.catch(ex => {
console.error(ex.stack);
process.exit(1);
});

exports.widgets = functions.https.onRequest(server);