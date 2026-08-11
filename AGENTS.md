# VoxClone Development Rules

## Deployment Protocol

When the user asks to deploy to Vercel, follow these steps IN ORDER:

1. **Start Kokoro TTS server locally** (for local testing):
   ```powershell
   Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\HOME\Desktop\Kokoro-FastAPI'; python server.py"
   ```
   Wait for "Model loaded" message before continuing.

2. **Start Next.js dev server** (for local testing):
   ```powershell
   cd "C:\Users\HOME\Desktop\ai voice generator and text in voice website\voxclone"
   npm run dev
   ```

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

- **Kokoro TTS** runs locally on port 8000 (Python, `kokoro` pip package)
  - Only accessible from localhost, NOT from Vercel
  - Config: `C:\Users\HOME\Desktop\Kokoro-FastAPI\server.py`
  - Endpoint: `POST http://localhost:8000/v1/tts`
  
- **Vercel deployment** uses **browser SpeechSynthesis** as fallback
  - The TTS page auto-detects Kokoro availability
  - Badge shows "Kokoro TTS" or "Browser TTS" in the UI
  
- **Neon DB** for persistent storage (PostgreSQL)
  - Connection string set as `DATABASE_URL` env var in Vercel
  
- **Voice provider** is mock (no ElevenLabs key)
  - `useClientTts: true` flag, browser SpeechSynthesis used in Studio

## Key Commands

| Task | Command |
|------|---------|
| Start Kokoro server | `cd C:\Users\HOME\Desktop\Kokoro-FastAPI; python server.py` |
| Start Next.js dev | `cd ...voxclone; npm run dev` |
| Start both | `.\start-dev.ps1` |
| Build | `npm run build` |
| Deploy | `git add -A; git commit -m "..."; git push` |
| Test Kokoro locally | `curl -X POST http://localhost:8000/v1/tts -H "Content-Type: application/json" -d '{"text":"hello","voice":"af_heart","speed":1.0,"lang":"a","format":"mp3"}'` |
