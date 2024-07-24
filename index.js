const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const fal = require('@fal-ai/serverless-client');

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_API_KEY);

fal.config({
  credentials: process.env.FAL_API_KEY,
});

const messages = {
  start: {
    en: "Hi, I convert your voice messages and audio files into text. Just send them to me. The conversion is the fastest available on the market via fal.ai. fal.ai's privacy policy applies. This bot only temporarily stores voice messages to send them to fal.ai. They are deleted immediately afterwards.",
    de: "Hi, ich wandle deine Sprachnachrichten und Audiodateien in Text um. Sende sie einfach zu mir. Die Umwandlung ist die schnellste, die am Markt via fal.ai verfügbar ist. Es gelten die Datenschutzbestimmungen von fal.ai. Dieser Bot speichert die Sprachnachrichten nur temporär, um sie an fal.ai zu senden. Danach werden sie sofort gelöscht.",
    es: "Hola, convierto tus mensajes de voz y archivos de audio en texto. Simplemente envíamelos. La conversión es la más rápida disponible en el mercado a través de fal.ai. Se aplica la política de privacidad de fal.ai. Este bot solo almacena temporalmente los mensajes de voz para enviarlos a fal.ai. Se eliminan inmediatamente después.",
    it: "Ciao, converto i tuoi messaggi vocali e file audio in testo. Inviameli semplicemente. La conversione è la più veloce disponibile sul mercato tramite fal.ai. Si applica la politica sulla privacy di fal.ai. Questo bot memorizza i messaggi vocali solo temporaneamente per inviarli a fal.ai. Vengono eliminati subito dopo."
  },
  noPermission: {
    en: "Sorry, you don't have permission to use this bot. Your User ID is {userId}. Please forward this ID to the bot administrator to gain access.",
    de: "Entschuldigung, du hast keine Berechtigung, diesen Bot zu verwenden. Deine User-ID ist {userId}. Bitte leite diese ID an den Bot-Administrator weiter, um Zugang zu erhalten.",
    es: "Lo siento, no tienes permiso para usar este bot. Tu ID de usuario es {userId}. Por favor, reenvía este ID al administrador del bot para obtener acceso.",
    it: "Spiacente, non hai il permesso di utilizzare questo bot. Il tuo ID utente è {userId}. Per favore, inoltra questo ID all'amministratore del bot per ottenere l'accesso."
  },
  invalidFormat: {
    en: "Please send a voice message or an MP3/WAV file.",
    de: "Bitte sende eine Sprachnachricht oder eine MP3/WAV-Datei.",
    es: "Por favor, envía un mensaje de voz o un archivo MP3/WAV.",
    it: "Per favore, invia un messaggio vocale o un file MP3/WAV."
  },
  processingError: {
    en: "Sorry, an error occurred while processing your audio file.",
    de: "Entschuldigung, bei der Verarbeitung deiner Audiodatei ist ein Fehler aufgetreten.",
    es: "Lo siento, ha ocurrido un error al procesar tu archivo de audio.",
    it: "Spiacente, si è verificato un errore durante l'elaborazione del tuo file audio."
  }
};

function getLanguage(ctx) {
  const langCode = ctx.from.language_code?.split('-')[0] || 'en';
  return ['en', 'de', 'es', 'it'].includes(langCode) ? langCode : 'en';
}

function getMessage(ctx, key) {
  const lang = getLanguage(ctx);
  return messages[key][lang];
}

bot.start((ctx) => {
  ctx.reply(getMessage(ctx, 'start'));
});

const allowedUserIds = process.env.ALLOWED_USER_IDS ? process.env.ALLOWED_USER_IDS.split(',').map(id => parseInt(id.trim())) : [];

bot.use((ctx, next) => {
  if (allowedUserIds.length === 0) {
    return next();
  }
  
  const userId = ctx.from.id;
  if (allowedUserIds.includes(userId)) {
    return next();
  } else {
    ctx.reply(getMessage(ctx, 'noPermission').replace('{userId}', userId));
  }
});

bot.on(message('voice'), handleAudio);
bot.on(message('audio'), handleAudio);
bot.on(message('document'), (ctx) => {
  const mime = ctx.message.document.mime_type;
  if (mime === 'audio/mpeg' || mime === 'audio/wav' || mime === 'audio/wave') {
    handleAudio(ctx);
  } else {
    ctx.reply(getMessage(ctx, 'invalidFormat'));
  }
});

async function handleAudio(ctx) {
  try {
    let file_id;
    if (ctx.message.voice) {
      file_id = ctx.message.voice.file_id;
    } else if (ctx.message.audio) {
      file_id = ctx.message.audio.file_id;
    } else if (ctx.message.document) {
      file_id = ctx.message.document.file_id;
    }

    const link = await ctx.telegram.getFileLink(file_id);
    const file_path = await downloadFile(link);
    const transcription = await transcribeAudioWithFAL(file_path);
    const messageParts = splitMessage(transcription);
    for (const part of messageParts) {
      await ctx.reply(part);
    }
  } catch (error) {
    console.error("Error processing audio:", error);
    if (error.status === 422) {
      ctx.reply(getMessage(ctx, 'invalidFormat'));
    } else {
      ctx.reply(getMessage(ctx, 'processingError'));
    }
  }
}

function ensureTempDirectoryExists() {
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
}

async function downloadFile(url) {
  ensureTempDirectoryExists();
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
        language: process.env.AUDIO_LANG
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
    if (error.body && error.body.detail) {
      console.error("Error details:", JSON.stringify(error.body.detail, null, 2));
    }
    throw error;
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

// splitMessage for transcriptions that exceed the telegram character limit for messages
function splitMessage(message, maxLength = 4096) {
  const parts = [];
  while (message.length > 0) {
    if (message.length <= maxLength) {
      parts.push(message);
      break;
    }
    
    let part = message.substr(0, maxLength);
    let lastSpaceIndex = part.lastIndexOf(' ');
    
    if (lastSpaceIndex === -1) {
      lastSpaceIndex = maxLength;
    }
    
    parts.push(part.substr(0, lastSpaceIndex));
    message = message.substr(lastSpaceIndex + 1);
  }
  return parts;
}

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));