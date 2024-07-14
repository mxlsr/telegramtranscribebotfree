const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const fal = require('@fal-ai/serverless-client');

// Disable console.log for pm2 testing
console.log = function() {};

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_API_KEY);

fal.config({
  credentials: process.env.FAL_API_KEY,
});

bot.start((ctx) => {
  ctx.reply("Hi, ich wandle deine Sprachnachrichten in Text um. Sende mir hierfür einfach eine Sprachnachricht. Die Umwandlung ist die schnellste die am Markt verfügbar ist via fal.ai. Es gelten die Datenschutzbestimmungen von fal.ai. Dieser Bot speichert die Sprachnachrichten nur temporär ab, um diese an fal.ai zu schicken. Danach werden diese sofort gelöscht.");
});

const allowedUserIds = [336979047]; // Ersetze dies durch die tatsächlichen Telegram-IDs der erlaubten Benutzer

bot.use((ctx, next) => {
  const userId = ctx.from.id;
  if (allowedUserIds.includes(userId)) {
    return next();
  } else {
    ctx.reply("Sorry, du hast keine Berechtigung, diesen Bot zu verwenden.");
  }
});

bot.on('voice', async (ctx) => {
  try {
    const file_id = ctx.message.voice.file_id;
    const link = await ctx.telegram.getFileLink(file_id);
    const file_path = await downloadFile(link);
    const transcription = await transcribeAudioWithFAL(file_path);
    ctx.reply(transcription);
  } catch (error) {
    console.error("Error processing voice message:", error);
    ctx.reply("Entschuldigung, bei der Verarbeitung deiner Sprachnachricht ist ein Fehler aufgetreten.");
  }
});

async function downloadFile(url) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  const tempPath = path.join(__dirname, 'temp', `${Date.now()}.mp3`);
  fs.writeFileSync(tempPath, buffer);
  return tempPath;
}

async function transcribeAudioWithFAL(filePath) {
  const content = fs.readFileSync(filePath);
  const data_uri = `data:audio/mpeg;base64,${content.toString('base64')}`;

  try {
    const result = await fal.subscribe("fal-ai/wizper", {
      input: {
        audio_url: data_uri,
        language: "de"  // Assuming the transcription language is German
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log("API Response:", JSON.stringify(result, null, 2));

    if (result && result.chunks && result.chunks.length > 0) {
      const fullTranscription = result.chunks.map(chunk => chunk.text).join(" ");
      return fullTranscription;
    } else {
      console.error("Unexpected API response structure or no transcription chunks found:", result);
      throw new Error("Unexpected API response structure or no transcription chunks found.");
    }
  } catch (error) {
    console.error("Error in transcribing audio with FAL: ", error);
    throw error;
  } finally {
    // Always delete the file after processing, regardless of success or failure
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

bot.launch();