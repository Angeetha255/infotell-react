import { useEffect, useRef } from "react";

export default function FloatingDust() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Read colors from the root context or fall back to theme defaults
    const styles = getComputedStyle(document.documentElement);
    const colorPrimary = styles.getPropertyValue('--primary').trim() || "#29a71a";
    const colorSecondary = styles.getPropertyValue('--secondary').trim() || "#0046ad";
    
    // Vibrant, playful light-friendly palette
    const particleColors = [
      colorPrimary, 
      colorSecondary, 
      "#ff5e7e", // Playful pink
      "#ffbe0b", // Cheerful yellow
      "#00f5d4"  /* Neon teal */
    ];

    // Generate larger, interactive-looking playful floaters
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height + canvas.height, // Start spread out and lower down
      r: Math.random() * 6 + 3, // Much larger size range (3px to 9px) for clean visibility
      speed: Math.random() * 0.6 + 0.3, // Noticeably faster up-drift
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      angle: Math.random() * Math.PI * 2, // Used for the wavy horizontal swagger
      wobbleSpeed: Math.random() * 0.03 + 0.01,
      wobbleRange: Math.random() * 1.5 + 0.5, // How far left/right they sway
      opacity: Math.random() * 0.25 + 0.35, // High daylight visibility (35% to 60% opacity)
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.angle += p.wobbleSpeed;
        p.y -= p.speed;
        // This math adds a playful, lazy sway back and forth as they float upwards
        p.x += Math.sin(p.angle) * p.wobbleRange; 
        
        // Loop around cleanly when leaving top, reset to absolute bottom
        if (p.y < -20) { 
          p.y = canvas.height + 20; 
          p.x = Math.random() * canvas.width; 
        }
        // Boundaries tracking to keep waves on screen
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      });

      // Reset transparency for safety
      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => { 
      cancelAnimationFrame(animId); 
      window.removeEventListener("resize", resize); 
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: "absolute", 
        inset: 0, 
        width: "100%", 
        height: "100%", 
        pointerEvents: "none",
        zIndex: 1
      }} 
    />
  );
}