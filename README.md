### Usage

Go to https://your-slack-domain.slack.com/customize/emoji in a web browser.

Grab your cookie from the request headers and your token from the request payload (or form data) and create an `auth.json` in the following format:

```json
{
  "COOKIES": "your-cookie-here",
  "TOKEN": "your-token-here"
}
```
