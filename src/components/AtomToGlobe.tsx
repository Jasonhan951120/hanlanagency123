import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

type Scene = "PRE_RESCUE" | "PULL_UP" | "COLLABORATION" | "DEPARTURE" | "FINAL";


export default function AtomToGlobe() {
  const [scene, setScene] = useState<Scene>("PRE_RESCUE");

  useEffect(() => {
    const sequence: { next: Scene; delay: number }[] = [
      { next: "PULL_UP", delay: 3000 },
      { next: "COLLABORATION", delay: 6000 },
      { next: "DEPARTURE", delay: 9000 },
      { next: "FINAL", delay: 12000 },
      { next: "PRE_RESCUE", delay: 16000 },
    ];

    const timeouts = sequence.map(({ next, delay }) => 
      setTimeout(() => setScene(next), delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 select-none overflow-hidden relative">

      <AnimatePresence>
        {scene === "PULL_UP" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-[#F8F4E8] to-[#F8E8F4] mix-blend-multiply pointer-events-none"
            transition={{ duration: 1 }}
          />
        )}
      </AnimatePresence>

      <svg
        viewBox="0 0 800 600"
        className="w-full h-full drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="hand-drawn">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
        </defs>


        <motion.path
          d="M 550 600 L 550 300 L 800 300"
          stroke="black"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#hand-drawn)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />


        <motion.g filter="url(#hand-drawn)">

          <motion.path
            stroke="black"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            animate={{
              d: scene === "PRE_RESCUE" 
                ? "M 530 350 L 530 420 M 530 350 L 550 310 M 530 420 L 510 480 M 530 420 L 550 480"
                : scene === "PULL_UP"
                ? "M 525 340 L 525 410 M 525 340 L 540 315 M 525 410 L 510 470 M 525 410 L 540 470"
                : scene === "COLLABORATION"
                ? "M 580 230 L 580 290 M 580 230 L 560 250 M 580 290 L 570 300 M 580 290 L 590 300"
                : scene === "DEPARTURE"
                ? "M 620 230 L 620 290 M 620 230 L 600 250 M 620 290 L 610 300 M 620 290 L 630 300"
                : "M 670 230 L 670 290 M 670 230 L 650 250 M 670 290 L 660 300 M 670 290 L 680 300"
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          <motion.circle
            r="12"
            stroke="black"
            strokeWidth="3"
            fill="white"
            animate={{
              cx: scene === "PRE_RESCUE" ? 530 : scene === "PULL_UP" ? 525 : scene === "COLLABORATION" ? 580 : scene === "DEPARTURE" ? 620 : 670,
              cy: scene === "PRE_RESCUE" ? 330 : scene === "PULL_UP" ? 320 : scene === "COLLABORATION" ? 210 : scene === "DEPARTURE" ? 210 : 210
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </motion.g>


        <motion.g filter="url(#hand-drawn)">
          <motion.path
            stroke="black"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            animate={{
              d: scene === "PRE_RESCUE"
                ? "M 630 230 L 630 290 M 630 230 L 610 260 M 630 290 L 620 300 M 630 290 L 640 300"
                : scene === "PULL_UP"
                ? "M 610 240 L 610 295 M 610 240 L 545 310 M 610 295 L 600 300 M 610 295 L 625 300"
                : scene === "COLLABORATION"
                ? "M 610 230 L 610 290 M 610 230 L 590 250 M 610 290 L 600 300 M 610 290 L 620 300"
                : scene === "DEPARTURE"
                ? "M 650 230 L 650 290 M 650 230 L 630 250 M 650 290 L 640 300 M 650 290 L 660 300"
                : "M 700 230 L 700 290 M 700 230 L 680 250 M 700 290 L 690 300 M 700 290 L 710 300"
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          <motion.circle
            r="12"
            stroke="black"
            strokeWidth="3"
            fill="white"
            animate={{
              cx: scene === "PRE_RESCUE" ? 630 : scene === "PULL_UP" ? 610 : scene === "COLLABORATION" ? 610 : scene === "DEPARTURE" ? 650 : 700,
              cy: 210
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </motion.g>


        <AnimatePresence>
          {scene === "PULL_UP" && (
            <motion.g 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >

              <circle cx="535" cy="312" r="6" fill="#F8E8F4" stroke="black" strokeWidth="1" />
              <circle cx="545" cy="312" r="6" fill="#F8E8F4" stroke="black" strokeWidth="1" />
              <line x1="535" y1="312" x2="545" y2="312" stroke="black" strokeWidth="1" strokeDasharray="2 2" />
              

              {[...Array(5)].map((_, i) => (
                <motion.circle
                  key={i}
                  r="2"
                  fill="black"
                  initial={{ cx: 540, cy: 312, opacity: 0 }}
                  animate={{ 
                    cx: 540 + (Math.random() - 0.5) * 60, 
                    cy: 312 + (Math.random() - 0.5) * 60,
                    opacity: [0, 0.5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                />
              ))}
            </motion.g>
          )}
        </AnimatePresence>


        <g fill="#4D4D4D" fontSize="10" fontFamily="monospace" opacity="0.6">
          <text x="560" y="320">DATA ASSIST // S_01</text>
          <text x="560" y="340">COORDINATE LOCK // C_04</text>
          
          <motion.text 
            x="560" 
            y="360"
            animate={{ opacity: scene === "PULL_UP" ? 1 : 0 }}
          >
            CONNECTION_SYNC: 98.4%
          </motion.text>
        </g>
      </svg>


      <div className="absolute bottom-10 left-10 font-mono text-[10px] text-black/20 uppercase tracking-widest">
        {scene.replace("_", " ")} SEQUENCE INITIATED
      </div>
    </div>
  );
}
