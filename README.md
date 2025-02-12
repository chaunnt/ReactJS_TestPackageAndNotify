# ReactJS_BuildPackageAndNotify
This project will build reactjs project and notify build result to Slack
Define these properties in `.env`
```
#example: Project A
PROJECT_NAME=<Name of this project which will be shown on message to Slack>
#example: 202211230508 (YYYYMMDDHHmm)
REACT_APP_BUILD_VERSION=<Build version>
#example: #build_notify
SLACK_CHANNEL=<Channel Name of Slack>
#example: https://.......
SLACK_HOOK_URL=<URL of hook from Slack> 
#example: 235123634:3454 (visit BotFather for detail)
TELEGRAM_BOT_TOKEN=<BOT TOKEN> 
#example: @BuildNotify
TELEGRAM_CHAT_ID=<CHAT ID OR Name>
#example: 2143124
PASTE_BIN_API_KEY=<PASTEBIN API KEY>
```
# setup
install package
`npm install --save @chaunnt/reactjs_buildpackageandnotify` or `yarn add @chaunnt/reactjs_buildpackageandnotify`

add this command to your `package.json`
```
"scripts": {
    "autobuild": "npx @chaunnt/reactjs_buildpackageandnotify"
  },
```
# sample 
run command `npm run autobuild`

