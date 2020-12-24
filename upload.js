// Downloads an emojis index (for use in the download script)
// USAGE: node upload.js --slack target-slack-here [--auth target-auth.json] [--skip-emojis skip-emojis.json] [--after some-emoji]

const rp = require("request-promise");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
const util = require("util");
const mkdirp = require("mkdirp");

const arg = (name) => {
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === `--${name}`) {
      return process.argv[i + 1];
    }
  }
  return undefined;
};

function after(arr, elem) {
  if (arr.indexOf(elem) !== -1) {
    return arr.slice(arr.indexOf(elem))
  }
  return arr;
}

function subtract(arr1, arr2) {
  return arr1.filter(elem => !arr2.includes(elem))
}

const SLACK = arg("slack");
const AFTER = arg("after");
if (!SLACK) {
  throw new Error("--slack argument required");
}
const AUTH = require(path.resolve(".", arg("auth") || "auth.json"));
if (!AUTH) {
  throw new Error(
    "Either there must be an `auth.json` file or you must provide an --auth argument pointing to a json file with your token and cookies"
  );
}

const SKIP_EMOJIS = require(path.resolve(".", arg("skip-emojis")));
if (!SKIP_EMOJIS) {
  throw new Error(
    "Missing skip emojis"
  );
}
const DIR = "./emojis";
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36";
const SKIP_EMOJI_NAMES = SKIP_EMOJIS.emoji.map(({name}) => name);
const FILES = subtract(after(fs.readdirSync(DIR), AFTER), SKIP_EMOJI_NAMES);
const sleep = (ms) => new Promise((acc) => setTimeout(acc, ms));

console.log("Uploading files from", DIR);

async function upload(file) {
  const uploadFrom = path.join(DIR, file);
  const uri = `https://${SLACK}.slack.com/api/emoji.add?_x_id=1.0.${Math.random()}`;
  var res = await rp({
    method: "POST",
    uri,
    json: true,
    headers: {
      cookie: AUTH.COOKIES,
      origin: `https://${SLACK}.slack.com`,
      "user-agent": USER_AGENT,
    },
    formData: {
      name: file,
      mode: "data",
      token: AUTH.TOKEN,
      image: {
        value: fs.createReadStream(uploadFrom),
        options: {
          filename: file,
          contentType: "image",
        },
      },
    },
  }).catch((err) => Promise.resolve(err.error));
  return res;
}

const main = async () => {
  for (const file of FILES) {
    const response = await upload(file);
    console.log("Uploading", file, "...");
    if (response.ok) {
      console.log("OK");
      await sleep(2000);
    } else {
      if (response.error === "ratelimited") {
        console.log("[[ Rate limited... sleeping for 60s ]]");
        await sleep(60000);
        console.log(await upload(file));
      } else if (
        response.error === "error_name_taken" ||
        response.error === "error_name_taken_i18n"
      ) {
        console.log("[[ Already uploaded ]]");
        await sleep(500);
      } else {
        console.log("[[ Other error ]]", response.error);
        console.log(response);
        throw response.error;
        // await sleep(60000);
      }
    }
  }
};

main()
  .then(() => console.log("done"))
  .catch((err) => console.error(err));
