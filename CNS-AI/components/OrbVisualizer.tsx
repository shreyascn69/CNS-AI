
import React, { useEffect, useRef } from 'react';

interface OrbVisualizerProps {
  analyser: AnalyserNode | null;
  inputAnalyser?: AnalyserNode | null;
  isActive: boolean;
  color?: string;
}

const OrbVisualizer: React.FC<OrbVisualizerProps> = ({ analyser, inputAnalyser, isActive, color = '#a5b4fc' }) => {
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
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = 80;

      ctx.clearRect(0, 0, width, height);

      let scale = 1;
      let dataArray = new Uint8Array(0);
      let average = 0;

      if (isActive) {
        // Handle Output Audio (Agent Speaking)
        let outputAvg = 0;
        if (analyser) {
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            const sliceSize = Math.floor(bufferLength * 0.5); 
            for (let i = 0; i < sliceSize; i++) {
            sum += dataArray[i];
            }
            outputAvg = sum / sliceSize;
        }

        // Handle Input Audio (User Speaking)
        let inputAvg = 0;
        if (inputAnalyser) {
            const inputBufferLength = inputAnalyser.frequencyBinCount;
            const inputDataArray = new Uint8Array(inputBufferLength);
            inputAnalyser.getByteFrequencyData(inputDataArray);

            let sum = 0;
            const sliceSize = Math.floor(inputBufferLength * 0.5);
            for (let i = 0; i < sliceSize; i++) {
                sum += inputDataArray[i];
            }
            inputAvg = sum / sliceSize;
        }

        // Combine energies (User vs Agent) - take the stronger signal
        average = Math.max(outputAvg, inputAvg);

        // Map average (0-255) to a scale factor (1.0 - 1.4)
        scale = 1 + (average / 256) * 0.6;
      } else {
        // Breathing animation when silent
        const time = Date.now() / 1000;
        scale = 1 + Math.sin(time * 2) * 0.05;
      }

      // Draw Outer Glow/Rings (Backlight)
      if (isActive && (analyser || inputAnalyser)) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, baseRadius * scale * 1.2, 0, 2 * Math.PI);
          ctx.fillStyle = `${color}22`; // Very transparent
          ctx.fill();

          ctx.beginPath();
          ctx.arc(centerX, centerY, baseRadius * scale * 1.5, 0, 2 * Math.PI);
          ctx.fillStyle = `${color}11`; // Ultra transparent
          ctx.fill();
      }

      // NOTE: Main Orb solid fill removed to allow React Component Logo to sit in center
      
      // Optional: Draw visualization bars around the circle
      // We use the dataArray from output if available, otherwise just scale effect for input
      if ((analyser || inputAnalyser) && isActive && average > 10) {
          const bars = 60;
          const step = (Math.PI * 2) / bars;
          const radius = baseRadius * scale;
          
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';

          for (let i = 0; i < bars; i++) {
              // Simple visualization effect derived from scale if raw data isn't perfect for rings
              const barHeight = (scale - 1) * 100 * (Math.random() * 0.5 + 0.5); 
              
              const angle = i * step;
              const x1 = centerX + Math.cos(angle) * (radius + 10);
              const y1 = centerY + Math.sin(angle) * (radius + 10);
              const x2 = centerX + Math.cos(angle) * (radius + 10 + barHeight);
              const y2 = centerY + Math.sin(angle) * (radius + 10 + barHeight);

              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
          }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, inputAnalyser, isActive, color]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="w-[300px] h-[300px] md:w-[400px] md:h-[400px]"
    />
  );
};

export default OrbVisualizer;
