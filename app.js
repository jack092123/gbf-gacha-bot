const Line = require("@line/bot-sdk");
const express = require("express");

const port = process.env.PORT || 3000;
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const lineClinet = new Line.Client(config);
const app = express();

// message event handler
const eventHandler = (event) => {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  // create echo message for replying
  const replyMessage = {
    type: "text",
    text: event.message.text,
  };

  // use client API to reply message
  return lineClinet.replyMessage(event.replyToken, replyMessage);
};

// webhook entry point
app.post("/webhook", Line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(eventHandler))
    .then((results) => {
      res.json(results);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// welcome message
app.get("/", (req, res) => {
  res.send("Welcome GBF-Gacha-BOT Webhook API");
});

app.listen(port, () => {
  console.log(`Listening on ${port}`);
});
