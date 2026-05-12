import React, { useState, useEffect } from 'react';

export default function IntervalWalkApp() {
  const [warmup, setWarmup] = useState(20);
  const [reps, setReps] = useState(10);

  const [phase1, setPhase1] = useState(2);
  const [phase2, setPhase2] = useState(1);

  const [cooldown, setCooldown] = useState(10);

  const [running, setRunning] = useState(false);

  const [phase, setPhase] = useState('PRONTO');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let timer;

    if (running && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    if (running && timeLeft === 0) {
      nextPhase();
    }

    return () => clearInterval(timer);
  }, [running, timeLeft]);

  const nextPhase = () => {
    if (phase === 'PRONTO') {
      setPhase('AQUECIMENTO');
      setTimeLeft(warmup * 60);
      return;
    }

    if (phase === 'AQUECIMENTO') {
      setPhase('CORRIDA');
      setTimeLeft(phase1 * 60);
      return;
    }

    if (phase === 'CORRIDA') {
      setPhase('CAMINHADA');
      setTimeLeft(phase2 * 60);
      return;
    }

    if (phase === 'CAMINHADA') {
      if (reps > 1) {
        setReps(reps - 1);
        setPhase('CORRIDA');
        setTimeLeft(phase1 * 60);
      } else {
        setPhase('DESAQUECIMENTO');
        setTimeLeft(cooldown * 60);
      }
      return;
    }

    if (phase === 'DESAQUECIMENTO') {
      setPhase('FINALIZADO');
      setRunning(false);
    }
  };

  const formatTime = (secs) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;

    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const bgColor = () => {
    if (phase === 'CORRIDA') return '#ef4444';
    if (phase === 'CAMINHADA') return '#3b82f6';
    if (phase === 'AQUECIMENTO') return '#f59e0b';
    if (phase === 'DESAQUECIMENTO') return '#10b981';
    return '#111827';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #111827, #1f2937)',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#1f2937',
          borderRadius: 24,
          padding: 30,
          boxShadow: '0 0 25px rgba(0,0,0,0.4)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 32, marginBottom: 25 }}>
          Caminhada Intervalada
        </h1>

        <div
          style={{
            background: bgColor(),
            borderRadius: 20,
            padding: 25,
            marginBottom: 25,
          }}
        >
          <h2 style={{ fontSize: 28 }}>{phase}</h2>

          <div
            style={{
              fontSize: 60,
              fontWeight: 'bold',
              marginTop: 10,
            }}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setRunning(true)}
            style={buttonStyle('#22c55e')}
          >
            Iniciar
          </button>

          <button
            onClick={() => setRunning(false)}
            style={buttonStyle('#f59e0b')}
          >
            Pausar
          </button>

          <button
            onClick={() => window.location.reload()}
            style={buttonStyle('#ef4444')}
          >
            Resetar
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          <p>Aquecimento: {warmup} min</p>
          <p>Corrida: {phase1} min</p>
          <p>Caminhada: {phase2} min</p>
          <p>Repetições: {reps}</p>
          <p>Desaquecimento: {cooldown} min</p>
        </div>
      </div>
    </div>
  );
}

const buttonStyle = (bg) => ({
  background: bg,
  color: 'white',
  border: 'none',
  padding: '12px 18px',
  margin: '5px',
  borderRadius: 12,
  fontSize: 16,
  cursor: 'pointer',
  fontWeight: 'bold',
});
