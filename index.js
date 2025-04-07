/**
 * index.js
 * This file is the main entrypoint for the application.
 * @author  Giuseppe Careri
 * @see https://www.gcareri.com
 */
const express = require('express');
const { ElevenLabsClient } = require('elevenlabs');
const { Readable } = require('stream');

require('dotenv').config();

const app = express();

app.use(express.json());

/**
 * Handle incoming HTTP POST request with JSON body containing a text string,
 * and streams the text-to-speech audio response back to the client.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
const handleTextToSpeech = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  res.setHeader('Content-Type', 'audio/basic');  // Changed to audio/basic for µ-law format
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
    const requestConfig = {
      output_format: "pcm_8000",  // µ-law format at 8kHz
      text: text,
      model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
      // voice_settings: {
      //   stability: 0.5,
      //   similarity_boost: 0.75,
      //   style: 0,
      //   use_speaker_boost: true
      // }
    };

    console.log('Request config:', requestConfig);

    const audioStream = await client.textToSpeech.convertAsStream(process.env.ELEVENLABS_VOICE_ID, requestConfig);

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const dataArray = new Uint8Array(buffer);

    // Send data in chunks of 320 bytes
    for (let i = 0; i < dataArray.length; i += 320) {
      const chunk = dataArray.slice(i, i + 320);
      res.write(chunk);
    }
    res.end();

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error communicating with ElevenLabs' });
  }
}

app.post('/text-to-speech-stream', handleTextToSpeech);

const port = process.env.PORT || 6007;
app.listen(port, () => {
  console.log(`Elevenlabs listening on port ${port}`);
});
