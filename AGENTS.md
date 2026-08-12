# VoxClone Development Rules

## Deployment Protocol

When the user asks to deploy to Vercel, follow these steps IN ORDER:

1. **Start Edge TTS server locally** (for local testing):
   ```powershell
   Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\HOME\Desktop\ai voice generator and text in voice website\voxclone\tts-server'; python server.py"
   ```

2. **Start Next.js dev server** (for local testing):
   ```powershell
   cd "C:\Users\HOME\Desktop\ai voice generator and text in voice website\voxclone"
   npm run dev
   ```
   Or use the shortcut: `.\start-dev.ps1`

3. **Build the project**:
   ```powershell
   npm run build
   ```

4. **Git commit and push** (triggers Vercel auto-deploy):
   ```powershell
   git add -A
   git commit -m "<description of changes>"
   git push
   ```

5. **Vercel auto-deploys** from the push. Check status at:
   https://vercel.com/abubakkarlaiba-9098s-projects/voxclone

## Architecture Notes

- **Edge TTS server** runs locally on port 8000 (Python + edge-tts package)
  - 50+ free Microsoft voices, multiple languages
  - Config: `tts-server/server.py`
  - Endpoints: `POST /v1/tts`, `GET /v1/voices`
  - For Vercel: deploy on Railway using `tts-server/Dockerfile`
  
- **Vercel deployment** proxies TTS to the Edge TTS server
  - TTS page fetches voices from `/api/tts/voices`
  - Falls back to browser SpeechSynthesis if server unavailable
  
- **Neon DB** for persistent storage (PostgreSQL)
  - Connection string set as `DATABASE_URL` env var in Vercel
  
- **Voice provider** is mock (no ElevenLabs key)
  - `useClientTts: true` flag, browser SpeechSynthesis used in Studio

## Key Commands

| Task | Command |
|------|---------|
| Start TTS server | `cd ...tts-server; python server.py` |
| Start Next.js dev | `cd ...voxclone; npm run dev` |
| Start both | `.\start-dev.ps1` |
| Build | `npm run build` |
| Deploy | `git add -A; git commit -m "..."; git push` |
| Test TTS locally | `curl -X POST http://localhost:8000/v1/tts -H "Content-Type: application/json" -d '{"text":"hello","voice":"en-US-JennyNeural","speed":1.0,"format":"mp3"}'` |

## Railway Deployment (for TTS server)

1. Push `tts-server/` to a separate GitHub repo
2. Go to https://railway.app
3. New Project > Deploy from GitHub repo
4. Railway auto-detects the Dockerfile
5. Set environment variable `TTS_SERVER_URL` in Vercel to the Railway URL
