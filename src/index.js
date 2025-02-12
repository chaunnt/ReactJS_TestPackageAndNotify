#!/usr/bin/env node

const { execSync, exec } = require('child_process');
require('dotenv').config();

async function storeLogToPastebin(log) {
  const { PasteClient, Publicity, ExpireDate } = require("pastebin-api"); // using CommonJS

  // Tip: load dev key from a `.env` file
  const client = new PasteClient(process.env.PASTE_BIN_API_KEY || "8d4905354da08ff554dfacbc604a0ab5");
  const url = await client.createPaste({
    code: log,
    expireDate: ExpireDate.OneDay,
    format: "bash",
    name: "buildlog",
    publicity: Publicity.Public,
  });
  return url;
}

function reportToSlack(message, attachments) {
  if (!process.env.SLACK_HOOK_URL) {
    return;
  }
  var Slack = require('node-slack');
  var slack = new Slack(process.env.SLACK_HOOK_URL);
  slack.send({
    text: `${message}`,
    channel: process.env.SLACK_CHANNEL,
    username: 'Bot',
    icon_emoji: 'taco',
    attachments: attachments,
    unfurl_links: true,
    link_names: 1
  });
}

function reportToTelegram(message) {
  const TelegramBot = require('node-telegram-bot-api');

  // replace the value below with the Telegram token you receive from @BotFather
  const token = process.env.TELEGRAM_BOT_TOKEN || '5665305274:AAFlhbcpNijafxo9sCNqO2CBuojoRNP5ZFc';

  // Create a bot that uses 'polling' to fetch new updates
  const bot = new TelegramBot(token, { polling: false });

  const chatId = process.env.TELEGRAM_CHAT_ID || '@BuildNotify'
  bot.sendMessage(chatId, message);
}

function updateEnvVariables(filePath) {
  console.info(`updateEnvVariables ${filePath}`)
  // Import the filesystem module 
  const fs = require('fs');
  const moment = require('moment');
  let _envVariables = process.env;
  console.log(process.env);
  _envVariables[`REACT_APP_BUILD_VERSION`] =`${moment().format('YYYYMMDDHHmm')}`;

  let _envVariablesKeyList = Object.keys(_envVariables);

  let _envDataString = "";
  for (let i = 0; i < _envVariablesKeyList.length; i++) {
    const _variableName = _envVariablesKeyList[i];
    const regex = /([A-Z_][^a-z(__)]\w+)/g;
    const found = _variableName.match(regex);
    if (found !== null) {
      _envDataString += `${_variableName}=${_envVariables[_variableName]}`
      _envDataString += '\r\n'
    }
  }
  try {
    fs.appendFileSync(filePath, _envDataString);
  } catch (error) {
    if (error) {
      console.error(`updateEnvVariables ERROR`)
      console.error(error);
    }
  }
  return _envVariables;
}
function buildReactJS() {
  try {
    console.log(`execute job ${__dirname}`);
    let _envVariables = updateEnvVariables('.env');
    const buildProcess = exec(`cd ${__dirname} && cd ../../../../ && npm run build`, {
      maxBuffer: 1024 * 1024 * 1024
    });
    let _versionBuild = "-";
    if (process.env.REACT_APP_BUILD_VERSION) {
      _versionBuild = process.env.REACT_APP_BUILD_VERSION
    }
    if (_envVariables[`REACT_APP_BUILD_VERSION`]) {
      _versionBuild = _envVariables[`REACT_APP_BUILD_VERSION`]
    }
    let _chunkLog = [];
    // reportToSlack(`build start ${process.env.REACT_APP_PROJECT_NAME} - version ${_versionBuild} at ${new Date}`);
    reportToTelegram(`build start ${process.env.REACT_APP_PROJECT_NAME} - version ${_versionBuild} at ${new Date}`);
    buildProcess.stdout.on('data', data => {
      console.log(`stdout: ${data}`);
      _chunkLog.push(data);
    });

    buildProcess.stderr.on('message', data => {
      console.error(`stderr: ${data}`);
      _chunkLog.push(data);
    });

    buildProcess.stderr.on('error', data => {
      console.error(`stderr error: ${data}`);
      _chunkLog.push(data);
    });
    buildProcess.stdout.on('error', data => {
      console.error(`stdout error: ${data}`);
      _chunkLog.push(data);
    });
    buildProcess.on('close', code => {
      console.log(`child process closed with code ${code}`);
      if (code !== 0) {
        _chunkLog = _chunkLog.join('\r\n');
        storeLogToPastebin(_chunkLog).then((pasteBinLogFileUrl) => {
          console.log(pasteBinLogFileUrl);
          reportToSlack(`❌ build error ${process.env.REACT_APP_PROJECT_NAME} - version ${_versionBuild} at ${new Date}`);
          reportToSlack(`See detail error log on ${pasteBinLogFileUrl}`);
          reportToTelegram(`❌ build error ${process.env.REACT_APP_PROJECT_NAME} - version ${_versionBuild} at ${new Date}`);
          reportToTelegram(`See detail error log on ${pasteBinLogFileUrl}`);
        });

      } else {
        reportToSlack(`🆗 build finish ${process.env.REACT_APP_PROJECT_NAME} - version ${_versionBuild} at ${new Date}`);
        reportToTelegram(`🆗 build finish ${process.env.REACT_APP_PROJECT_NAME} - version ${_versionBuild} at ${new Date}`);
      }
    });
    buildProcess.on('message', code => {
      console.log(`child process message with code ${code}`);
    });
    buildProcess.on('disconnect', code => {
      console.log(`child process disconnect with code ${code}`);
    });
    buildProcess.on('exit', code => {
      console.log(`child process exited with code ${code}`);
    });
  } catch (error) {
    console.error(error)
  }
}

function main() {
  console.log("Say Hello from ChauNNT");
  buildReactJS()

}

if (require.main === module) {
  main();
}