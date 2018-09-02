const axios = require("axios");
const redis = require("redis");

const Const = {
  SET_KEY: "GBF",
  ALBUM_HASH: process.env.ALBUM_HASH,
  IMGUR_CLIENTID: process.env.IMGUR_CLIENTID,
};

const redisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
};

let redisClient;

const cleanup = key => (
  new Promise((resolve, reject) => {
    redisClient.del(key, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  })
);

const addItem = (key, value) => (
  new Promise((resolve, reject) => {
    redisClient.sadd(key, value, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  })
);

const updateRedis = async (images) => {
  try {
    await cleanup(Const.SET_KEY);

    const tasks = [];
    for (let i = 0; i < images.length; i += 1) {
      tasks.push(addItem(Const.SET_KEY, images[i].link));
    }

    await Promise.all(tasks);
    return;
  } catch (error) {
    console.error(`Redis update error: ${error}`);
    await updateRedis(images);
  }
};

const setup = async () => {
  redisClient = redis.createClient(redisOptions);
  redisClient.on("error", (err) => {
    console.error(`Redis Error: ${err}`);
  });

  try {
    // load image urls from imgur album
    const response = await axios.get(`https://api.imgur.com/3/album/${Const.ALBUM_HASH}/images`, {
      headers: {
        Authorization: `Client-ID ${Const.IMGUR_CLIENTID}`,
      },
    });
    const images = response.data.data;
    console.log(`Total images: ${images.length}`);

    await updateRedis(images);
    console.log("Setup Finish");
  } catch (error) {
    console.error(`Setup Error: ${error}`);
  }
};

const getItemURL = () => (
  new Promise((resolve, reject) => {
    redisClient.srandmember("GBF", (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  })
);

module.exports = {
  setup,
  getItemURL,
};
