"""
VoxClone TTS Server — Edge TTS (free Microsoft voices).
Deploy on Railway for free high-quality TTS.
"""
import io
import asyncio
import json
import edge_tts
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

app = FastAPI(title="VoxClone TTS Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TtsRequest(BaseModel):
    text: str
    voice: str = "en-US-JennyNeural"
    speed: float = 1.0
    format: str = "mp3"


@app.get("/")
async def root():
    return {"status": "ok", "message": "VoxClone TTS server running"}


@app.get("/v1/voices")
async def list_voices():
    voices = await edge_tts.list_voices()
    result = []
    for v in voices:
        result.append({
            "id": v["ShortName"],
            "name": v["FriendlyName"],
            "language": v["Locale"].split("-")[0],
            "languageCode": v["Locale"],
            "gender": v["Gender"].lower(),
        })
    return {"voices": result}


@app.post("/v1/tts")
async def generate_tts(req: TtsRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")

    if req.speed == 1.0:
        speed_str = "+0%"
    elif req.speed > 1.0:
        speed_str = f"+{int((req.speed - 1) * 100)}%"
    else:
        speed_str = f"-{int((1 - req.speed) * 100)}%"

    try:
        communicate = edge_tts.Communicate(
            text=req.text.strip(),
            voice=req.voice,
            rate=speed_str,
        )

        buf = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                buf.write(chunk["data"])

        if buf.tell() == 0:
            raise HTTPException(status_code=500, detail="No audio generated")

        buf.seek(0)
        return Response(
            content=buf.read(),
            media_type="audio/mpeg",
            headers={"Cache-Control": "no-store"},
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
