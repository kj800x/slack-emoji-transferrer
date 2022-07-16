const arg = (name) => {
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === `--${name}`) {
      return process.argv[i + 1];
    }
  }
  return undefined;
};

const EMOJI_FILE = arg("emojis") || "emojis.json";

const path = require("path");
const emojis = require(path.resolve(EMOJI_FILE)).emoji;
const fetch = require("node-fetch");
const util = require("util");
const mkdirp = require("mkdirp");
const fs = require("fs");

const streamPipeline = util.promisify(require("stream").pipeline);

mkdirp("./emojis");

async function main() {
  for (let { name, url } of emojis) {
    if (!fs.existsSync(`./emojis/${name}`)) {
      if (!url || !url.startsWith || !url.startsWith("https://")) {
        continue;
      }
      console.log("fetching", name, "from", url);
      const response = await fetch(url);
      if (response.ok) {
        await streamPipeline(
          response.body,
          fs.createWriteStream(`./emojis/${name}`)
        );
      } else {
        console.error("Download failed", response.statusText);
      }
    }
  }
}

main().catch(console.error);
