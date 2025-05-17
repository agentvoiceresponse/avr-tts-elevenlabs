/**
 * index.js
 * ElevenLabs Text-to-Speech Service
 * This service converts text to speech using ElevenLabs API and streams the audio in chunks.
 * @author  AgentVoiceResponse
 * @see https://www.agentvoiceresponse.com
 */

const express = require('express');
const { ElevenLabsClient } = require('elevenlabs');

require('dotenv').config();

// Constants
const DEFAULT_PORT = 6007;

// Initialize Express app
const app = express();
app.use(express.json());

/**
 * Converts text to speech using ElevenLabs API and streams the audio in chunks
 * @param {express.Request} req - Express request object containing text in body
 * @param {express.Response} res - Express response object for streaming audio
 */
const handleTextToSpeech = async (req, res) => {
  const { text } = req.body;

  // Validate input
  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  // Set response headers for audio streaming
  res.setHeader('Content-Type', 'audio/basic');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Initialize ElevenLabs client
    const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

    // Configure TTS request
    const requestConfig = {
      output_format: "pcm_8000",  // 8kHz PCM format
      text: text,
      model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2'
    };

    console.log('Processing TTS request:', requestConfig);

    const audioStream = await client.textToSpeech.convertAsStream(
      process.env.ELEVENLABS_VOICE_ID,
      requestConfig
    );

    for await (const chunk of audioStream) {
      res.write(chunk);
    }
    res.end();

  } catch (error) {
    console.error('TTS processing error:', error);
    res.status(500).json({ 
      message: 'Error processing text-to-speech request',
      error: error.message 
    });
  }
}

// Define routes
app.post('/text-to-speech-stream', handleTextToSpeech);

// Start server
const port = process.env.PORT || DEFAULT_PORT;
app.listen(port, () => {
  console.log(`ElevenLabs TTS service listening on port ${port}`);
});
