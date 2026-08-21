"use client";

import { useEffect, useRef } from "react";

export function HeroWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rawCtx = canvas.getContext("2d");
    if (!rawCtx) return;
    const ctx: CanvasRenderingContext2D = rawCtx;

    let animId: number;
    let t = 0;
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;

    function draw() {
      ctx.clearRect(0, 0, size, size);

      const bars = 48;
      const innerR = 45;
      const maxBarLen = 28;

      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const wave1 = Math.sin(t * 2 + i * 0.3) * 0.5 + 0.5;
        const wave2 = Math.sin(t * 1.5 + i * 0.15) * 0.3 + 0.3;
        const wave3 = Math.sin(t * 3 + i * 0.5) * 0.2;
        const barLen = (wave1 + wave2 + wave3) * maxBarLen;
        const barWidth = 2.5;

        const x1 = cx + Math.cos(angle) * innerR;
        const y1 = cy + Math.sin(angle) * innerR;
        const x2 = cx + Math.cos(angle) * (innerR + barLen);
        const y2 = cy + Math.sin(angle) * (innerR + barLen);

        const alpha = 0.4 + wave1 * 0.6;
        const hue = 240 + i * 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `hsla(${hue}, 80%, 70%, ${alpha})`;
        ctx.lineWidth = barWidth;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      const pulseR = innerR + 5 + Math.sin(t * 1.5) * 3;
      const pulseGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR);
      pulseGrad.addColorStop(0, "rgba(99, 102, 241, 0.15)");
      pulseGrad.addColorStop(1, "rgba(99, 102, 241, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.fillStyle = pulseGrad;
      ctx.fill();

      const ringAlpha = 0.1 + Math.sin(t) * 0.05;
      ctx.beginPath();
      ctx.arc(cx, cy, innerR + 2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(99, 102, 241, ${ringAlpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      t += 0.03;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative mb-10 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="h-[200px] w-[200px]"
        style={{ imageRendering: "auto" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className="h-10 w-10 text-[#818cf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </div>
    </div>
  );
}
