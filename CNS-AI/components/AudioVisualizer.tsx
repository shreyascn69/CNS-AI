
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  color?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isActive, color = '#60a5fa' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Draw baseline
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.strokeStyle = isActive ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)';
      ctx.stroke();

      if (!analyser || !isActive) {
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      // Draw mirrored wave
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // 0 to 2
        const amplitude = (v - 1) * (height / 3); // Scale amplitude
        
        // Enhance the wave effect
        const y = (height / 2) + amplitude;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Smooth curves
          const prevX = x - sliceWidth;
          const prevY = (height / 2) + ((dataArray[i-1] / 128.0 - 1) * (height / 3));
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      
      // Add a glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isActive, color]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={200}
      className="w-full max-w-2xl h-48"
    />
  );
};

export default AudioVisualizer;
