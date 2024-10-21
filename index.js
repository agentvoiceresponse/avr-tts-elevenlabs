/**
 * index.js
 * This file is the main entrypoint for the application.
 * @author  Giuseppe Careri
 * @see https://www.gcareri.com
 */
const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');
const axios = require('axios');

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

  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        text: text,
        model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_monolingual_v1', 
        voice_settings: {
          "stability": 0.5,
          "similarity_boost": 0.75,
          "style": 0,
          "use_speaker_boost": true
        }
      },
      {
        headers: {
          'accept': 'audio/mpeg',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer', // Tell Axios to expect binary data
      }
    );

    const bufferStream = new PassThrough();
    bufferStream.end(response.data);

    ffmpeg(bufferStream)
      .audioChannels(1)        // Convert to mono
      .audioFrequency(8000)     // Set sample rate to 8kHz
      .audioCodec('pcm_s16le')  // Set codec to 16-bit linear PCM
      .format('wav')            // Output format as WAV
      .on('start', (commandLine) => {
        console.log('Starting audio streaming:', commandLine);
      })
      .on('codecData', (data) => {
        console.log(data);
      })
      .on('error', (err) => {
        console.error('Error during conversion: ' + err.message);
        res.status(500).send('Error converting audio.');
      })
      .on('end', () => {
        console.log('Streaming finished.');
      })
      .pipe(res, { end: true });

  } catch (error) {
    console.error(error.response.data.toString());
    res.status(500).json({ message: 'Error communicating with ElevenLabs' });
  }
}

app.post('/text-to-speech-stream', handleTextToSpeech);

const port = process.env.PORT || 6007;
app.listen(port, () => {
  console.log(`Elevenlabs listening on port ${port}`);
});
