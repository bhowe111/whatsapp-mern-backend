// importing
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';

import Pusher from 'pusher';
import cors from 'cors';

// app config
const app = express();
const port = process.env.PORT || 9000;
// Pusher for real time frontend update from backend info
const pusher = new Pusher({
  appId: "1127090",
  key: "32a9659dda0c6382fb1b",
  secret: "130ccf8ec981f4f9d772",
  cluster: "us3",
  useTLS: true
});

// middleware
app.use(express.json());
app.use(cors());


// db config
const connection_url = 'mongodb+srv://admin:lNMI33hVw32bdyFI@cluster0.kyufc.mongodb.net/whatsappdb?retryWrites=true&w=majority'

mongoose.connect(connection_url, {
  'useNewUrlParser': true,
  'useFindAndModify': false,
  'useCreateIndex': true,
  'useUnifiedTopology': true
})

const db = mongoose.connection

db.once('open', () => {
  console.log('DB connected')
  
  const msgCollection = db.collection('messagecontents');
  const changeStream = msgCollection.watch();

  changeStream.on('change', (change) => {
    console.log('a change occurred', change)

    if (change.operationType === 'insert') {
      const messageDetails = change.fullDocument;
      pusher.trigger('messages', 'inserted', 
      {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received
      })
    } else {
      console.log('Error triggering Pusher')
    }
  })
})


// api routes
app.get('/', (req, res) => res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
  Messages.find((err, data) => {
    if (err) res.status(500).send(err)
    else res.status(200).send(data)
  })
})

app.post('/messages/new', (req, res) => {
  const dbMessage = req.body

  Messages.create(dbMessage, (err, data) => {
    if (err) res.status(500).send(err)
    else res.status(201).send(`new message created: \n ${data}`)
  })
})

// listener
app.listen(port, () => console.log(`Server running on port: ${port}`))