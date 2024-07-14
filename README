# Telegram Transcribe Bot feat. fal.ai

This Telegram bot converts voice messages and audio files into text using fal.ai's lightning fast transcription service. It supports multiple languages and is designed for easy setup and use.

## Features

- Transcribe voice messages and audio files (MP3/WAV) sent via Telegram
- Multi-language support for user interactions (English, German, Spanish, Italian)
- Automatic language detection for bot responses based on user's Telegram language setting
- Optional user whitelist to control access
- Super fast transcription powered by fal.ai

## Prerequisites

1. fal.ai API key (Get $20 free API credits [here](https://www.fal.ai/))
2. Telegram Bot API key (Instructions below)
3. Node.js and npm installed on your system
4. your telegram user ID to whitelist it for the bot (if ALLOWED_USER_IDS it not set, the bot will be usable by everyone who finds it!) 

## Setup

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/telegram-transcribe-bot.git
   cd telegram-transcribe-bot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy the example environment file:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file with your API keys:
   ```
   FAL_API_KEY=your_fal_ai_api_key
   TELEGRAM_BOT_API_KEY=your_telegram_bot_api_key
   ALLOWED_USER_IDS=123456789,987654321  # Optional: Comma-separated list of allowed user IDs. The bot will be usable by everyone who finds it if it stays empty!
   AUDIO_LANG=en # language detection is currently not supported by wizper, so choose a language here: https://fal.ai/models/fal-ai/whisper/api
   
   ```

## Getting a Telegram Bot API Key

1. Start a chat with the [BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the prompts to create a new bot
3. Once created, BotFather will give you an API key. Use this as your `TELEGRAM_BOT_API_KEY`

## Running the Bot

To start the bot, run:

```
npm start
```

## Usage

1. Start a chat with your bot on Telegram
2. Send a voice message or audio file (MP3/WAV)
3. The bot will respond with the transcribed text

You can even invite it to groups. It needs admin permissions to be able to read (and transcribe) all voice messages + audio files.

## Supported Languages
### Transcribing
The usual languages whisper-ai supports. 
Transcribe Language auto detection is currently not working. 
You can set the language in the .env file. 
Possible values and some documentation are here:
https://fal.ai/models/fal-ai/whisper/api

### User interaction
The bot automatically detects the user's language based on their Telegram settings and responds in the appropriate language. Currently supported languages for bot messages are:

- English (en)
- German (de)
- Spanish (es)
- Italian (it)

If a user's language is not among these, the bot will default to English.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Donations
If you find this bot useful and want to support me you can do so here:
[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/mxlsr)

## Acknowledgements

- [fal.ai](https://www.fal.ai/) for their crazy fast transcription API
- [Telegraf](https://github.com/telegraf/telegraf) for the Telegram Bot framework
