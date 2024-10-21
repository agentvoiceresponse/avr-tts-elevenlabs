# Agent Voice Response with ElevenLabs TTS Integration

This repository demonstrates the integration between **Agent Voice Response (AVR)** and **ElevenLabs Text-to-Speech (TTS)** API, allowing for real-time speech synthesis in an audio format suitable for telephony applications. The project is built with Node.js and leverages ElevenLabs for high-quality voice generation and `ffmpeg` to transcode the audio into a format compatible with telecommunication systems like Asterisk.

## Features

- **Real-time Text-to-Speech (TTS)**: Convert text to natural-sounding speech using ElevenLabs API.
- **Audio Transcoding**: Use `ffmpeg` to transcode ElevenLabs audio from MPEG to mono, 16-bit linear PCM at 8kHz, which is the standard for telephony.
- **Streaming Audio**: The audio response is streamed back to the client in real-time using Node.js' stream capabilities, allowing for low-latency voice responses.

## Prerequisites

Before you begin, ensure you have the following:

1. **Node.js** and **npm** installed.
2. An **ElevenLabs API key** and a **voice ID**.
3. **ffmpeg** installed on your system. You can download it [here](https://ffmpeg.org/download.html).

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/agentvoiceresponse/avr-tts-elevenlabs.git
    cd agent-voice-response-elevenlabs
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add your ElevenLabs API key and voice ID:
    ```plaintext
    ELEVENLABS_API_KEY=your_elevenlabs_api_key
    ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id
    PORT=6007
    ```

4. Ensure **ffmpeg** is installed and available in your system's PATH.

## Usage

To start the application:

```bash
npm start
```

The application will listen on the port specified in the `.env` file (default is `6007`).

### API Endpoint

#### `POST /text-to-speech-stream`

This endpoint accepts a JSON payload containing the text to be converted into speech. The audio is streamed back in WAV format.

- **Request Body**:
    ```json
    {
      "text": "Hello, how can I assist you today?"
    }
    ```

- **Response**:
    The server streams the audio as `audio/wav` with the following characteristics:
    - Mono channel
    - 8kHz sample rate
    - 16-bit linear PCM

### Example Request

```bash
curl -X POST http://localhost:6003/text-to-speech-stream \
     -H "Content-Type: application/json" \
     -d '{"text":"Hello, this is a real-time voice response!"}' \
     --output response.wav
```

## How It Works

1. The application receives a text string through an HTTP POST request.
2. It sends this text to ElevenLabs' API to synthesize the voice.
3. The response from ElevenLabs, in MPEG format, is piped into `ffmpeg`, which transcodes it to WAV format suitable for telephony (mono, 8kHz, 16-bit linear PCM).
4. The transcoded audio is streamed back to the client.

### Code Breakdown

- **ElevenLabs API Call**: The text is sent to the ElevenLabs API to generate speech using the provided `voice ID`. The request includes parameters like voice settings (stability, similarity boost, etc.).
- **Audio Transcoding**: The audio returned from ElevenLabs is in MPEG format, but telephony systems often require 8kHz WAV in mono. `ffmpeg` is used to convert the audio on the fly.
- **Real-time Streaming**: The `PassThrough` stream is used to pipe the audio back to the client while `ffmpeg` processes it.

## Error Handling

The application includes basic error handling:
- Missing `text` in the request body results in a `400 Bad Request` response.
- Issues with the ElevenLabs API or `ffmpeg` result in a `500 Internal Server Error` response.