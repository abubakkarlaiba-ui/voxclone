# Kokoro TTS Setup Guide

This guide explains how to set up and use Kokoro TTS with the VoxClone application.

---

## 1. Install Kokoro TTS Server

### Option A: Using pip (Recommended)

```bash
pip install kokoro
```

### Option B: Using the kokoro-api package

```bash
pip install kokoro-api
```

### Option C: Using Docker

```bash
docker pull ghcr.io/remsky/kokoro-fastapi-cpu:latest
docker run -p 8000:8000 ghcr.io/remsky/kokoro-fastapi-cpu:latest
```

---

## 2. Start the Kokoro Server (Windows)

### Using pip

```bash
# Start the Kokoro API server
python -m kokoro.api
```

Or if using `kokoro-api`:

```bash
kokoro-api --host 0.0.0.0 --port 8000
```

### Using Docker

```bash
docker run -p 8000:8000 ghcr.io/remsky/kokoro-fastapi-cpu:latest
```

The server will start at `http://localhost:8000`.

---

## 3. Configure .env.local

Edit the `.env.local` file in the VoxClone project root:

```env
# Kokoro TTS Server URL (required)
KOKORO_API_URL=http://localhost:8000

# Optional: API key if authentication is enabled
KOKORO_API_KEY=
```

**Important:** Never use `NEXT_PUBLIC_KOKORO_API_KEY` - this would expose your key to the browser.

---

## 4. Test the Kokoro API

Before running the Next.js app, verify the Kokoro server is working:

### Check server health

```bash
curl http://localhost:8000/
```

### Test TTS generation

```bash
curl -X POST http://localhost:8000/v1/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","voice":"af_heart","speed":1.0,"lang":"en","format":"mp3"}' \
  --output test.mp3
```

If you hear "Hello world" when you play `test.mp3`, the server is working.

---

## 5. Run the Next.js Application

```bash
# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

Open http://localhost:3000 in your browser and navigate to **Text to Speech**.

---

## 6. How It Works

### Architecture

```
User Browser
    |
    v
Next.js Frontend (text-to-speech page)
    |
    v
Next.js API Route (/api/tts)
    |
    v
Kokoro TTS Server (localhost:8000)
    |
    v
Generated Audio (MP3/WAV)
    |
    v
Next.js API Route streams audio back
    |
    v
Browser Audio Player
```

### Data Flow

1. User types text and selects a voice
2. Frontend sends POST request to `/api/tts`
3. The API route validates the request
4. The API route forwards the request to the Kokoro server
5. Kokoro generates the audio
6. The API route streams the audio back to the browser
7. The browser plays and/or downloads the audio

### Security

- The Kokoro server URL is only stored in `KOKORO_API_URL` (server-side only)
- API keys are never exposed to the browser
- All user input is validated server-side
- The browser never communicates directly with the Kokoro server

---

## 7. Available Voices

### English (American)
| Voice ID | Name | Gender | Description |
|----------|------|--------|-------------|
| af_heart | Heart | Female | Warm, friendly female voice |
| af_bella | Bella | Female | Clear, confident female voice |
| af_nicole | Nicole | Female | Soft, gentle female voice |
| af_sarah | Sarah | Female | Professional female voice |
| af_sky | Sky | Female | Bright, energetic female voice |
| am_adam | Adam | Male | Deep, resonant male voice |
| am_michael | Michael | Male | Clear, authoritative male voice |
| am_fenrir | Fenrir | Male | Strong, confident male voice |
| am_puck | Puck | Male | Playful, upbeat male voice |
| am_echo | Echo | Male | Calm, measured male voice |

### English (British)
| Voice ID | Name | Gender | Description |
|----------|------|--------|-------------|
| bf_emma | Emma | Female | Refined British female voice |
| bf_isabella | Isabella | Female | Elegant British female voice |
| bm_george | George | Male | Distinguished British male voice |
| bm_lewis | Lewis | Male | Natural British male voice |

### Japanese
| Voice ID | Name | Gender | Description |
|----------|------|--------|-------------|
| jf_alpha | Alpha | Female | Natural Japanese female voice |
| jm_kumo | Kumo | Male | Natural Japanese male voice |

### Chinese
| Voice ID | Name | Gender | Description |
|----------|------|--------|-------------|
| zf_xiaobei | Xiaobei | Female | Mandarin female voice |
| zm_yunxi | Yunxi | Male | Mandarin male voice |

### Spanish, French, Hindi, Italian, Portuguese, Korean
See `src/lib/kokoro/voices.ts` for the complete list.

---

## 8. Configuration

All settings are in `src/lib/kokoro/config.ts`:

```typescript
export const kokoroConfig = {
  apiUrl: process.env.KOKORO_API_URL || "http://localhost:8000",
  apiKey: process.env.KOKORO_API_KEY || "",
  defaultVoice: "af_heart",
  defaultSpeed: 1.0,
  minSpeed: 0.5,
  maxSpeed: 2.0,
  defaultFormat: "mp3",
  maxTextLength: 10000,
  timeoutMs: 60_000,
};
```

To change any setting, edit this file or update the corresponding environment variable.

---

## 9. Deployment

### Frontend (Vercel)
Deploy the Next.js app to Vercel as usual. Set `KOKORO_API_URL` in the Vercel environment variables to point to your production Kokoro server.

### Kokoro Server
Deploy the Kokoro server separately:
- **Railway**: Use a Dockerfile
- **Fly.io**: Use the Docker image
- **AWS/GCP**: Deploy as a container
- **Self-hosted**: Run on a VPS

### Environment Variables for Production

```env
KOKORO_API_URL=https://your-kokoro-server.example.com
KOKORO_API_KEY=your-api-key-if-needed
```

---

## 10. Troubleshooting

### "Kokoro TTS server is unavailable"
- Make sure the Kokoro server is running
- Check that `KOKORO_API_URL` is correct
- Verify the server is accessible: `curl http://localhost:8000/`

### "Voice generation failed"
- Check the Kokoro server logs
- Verify the voice ID is valid
- Try a different voice

### Audio not playing
- Check browser console for errors
- Try a different browser
- Verify the audio format is supported

### Slow generation
- First request may be slow as the model loads
- Subsequent requests should be faster
- Consider using a GPU-enabled Kokoro server

---

## 11. Adding Custom Voices

To add voices to the UI, edit `src/lib/kokoro/voices.ts`:

```typescript
export const KOKORO_VOICES: KokoroVoice[] = [
  // Add your custom voice here
  { id: "my_voice", name: "My Voice", language: "English", languageCode: "en", gender: "female", description: "My custom voice" },
];
```

The voice must also be available on the Kokoro server.

---

## 12. API Reference

### POST /api/tts

Generate speech from text.

**Request Body:**
```json
{
  "text": "Hello world",
  "voice": "af_heart",
  "speed": 1.0,
  "language": "en",
  "format": "mp3"
}
```

**Response:**
- Success: Audio binary data with `Content-Type: audio/mpeg`
- Error: JSON with error details

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please enter some text first."
  }
}
```
