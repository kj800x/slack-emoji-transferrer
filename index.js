// Downloads an emojis index (for use in the download script)
// USAGE: node index.js --slack your-slack-here [--auth some-auth.json] [--emojis emojis.json]

const fs = require("fs");
const process = require("process");
const rp = require("request-promise");
const path = require("path");

const arg = (name) => {
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === `--${name}`) {
      return process.argv[i + 1];
    }
  }
  return undefined;
};

const EMOJI_FILE = arg("emojis") || "emojis.json";
const authArg = arg("auth") || "auth.json";
const SLACK = arg("slack");
if (!SLACK) {
  throw new Error("--slack argument required");
}
const AUTH = require(path.resolve(".", authArg));
if (!AUTH) {
  throw new Error(
    "Either there must be an `auth.json` file or you must provide an --auth argument pointing to a json file with your token and cookies"
  );
}
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36";

async function requestAdminList() {
  var res = await rp({
    method: "POST",
    uri: `https://${SLACK}.slack.com/api/emoji.adminList?_x_id=1.0.${Math.random()}`,
    json: true,
    headers: {
      cookie: AUTH.COOKIES,
      origin: `https://${SLACK}.slack.com`,
      "user-agent": USER_AGENT,
    },
    form: {
      page: 1,
      count: 999999999,
      queries: [],
      user_ids: [],
      token: AUTH.TOKEN,
    },
  }).catch((err) => Promise.resolve(err.error));
  return res;
}

async function main() {
  const response = await requestAdminList();
  console.log(response);
  fs.writeFileSync(path.resolve(".", EMOJI_FILE), JSON.stringify(response));
}

main().catch(console.error);
