const Line = require("@line/bot-sdk");
const express = require("express");
const modelGBF = require("./model");

const port = process.env.PORT || 3000;
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const lineClinet = new Line.Client(config);
const app = express();

// message event handler
const eventHandler = async (event) => {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const messageText = event.message.text;
  if (!messageText.split("").includes("超")) {
    return Promise.resolve(null);
  }

  try {
    const url = await modelGBF.getItemURL();
    const thumbnail = url.replace(".png", "t.png");

    // create echo message for replying
    const replyMessage = {
      type: "image",
      originalContentUrl: url,
      previewImageUrl: thumbnail,
    };

    // use client API to reply message
    return lineClinet.replyMessage(event.replyToken, replyMessage);
  } catch (error) {
    console.error(`getItemURL error: ${error}`);
    return Promise.resolve(null);
  }
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

const startup = async () => {
  await modelGBF.setup();
  app.listen(port, () => {
    console.log(`Listening on ${port}`);
  });
};

startup();
