import React, { useState, useEffect } from 'react';

export default function IntervalWalkingApp() {
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

    return () => clearInterval(timer);
  }, [running, timeLeft]);

  const startWorkout = () => {
    setPhase('AQUECIMENTO');
    setTimeLeft(warmup * 60);
    setRunning(true);
  };

  const stopWorkout = () => {
    setRunning(false);
    setPhase('PARADO');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');

    const s = (seconds % 60)
      .toString()
      .padStart(2, '0');

    return `${m}:${s}`;
  };

  const Box = ({ label, value, setValue }) => (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          fontSize: 14,
          marginBottom: 10,
          color: '#666',
          fontWeight: 'bold',
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => setValue(Math.max(0, value - 1))}
          style={{
            width: 45,
            height: 45,
            borderRadius: 12,
            border: 'none',
            background: '#e5e7eb',
            fontSize: 24,
            fontWeight: 'bold',
          }}
        >
          -
        </button>

        <div
          style={{
            fontSize: 28,
            fontWeight: 'bold',
          }}
        >
          {value}
        </div>

        <button
          onClick={() => setValue(value + 1)}
          style={{
            width: 45,
            height: 45,
            borderRadius: 12,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontSize: 24,
            fontWeight: 'bold',
          }}
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        background: '#f3f4f6',
        minHeight: '100vh',
        padding: 20,
        fontFamily: 'Arial',
      }}
    >
      <div
        style={{
          maxWidth: 500,
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            fontSize: 34,
            marginBottom: 25,
          }}
        >
          Caminhada Intervalada
        </h1>

        <Box
          label="Aquecimento (min)"
          value={warmup}
          setValue={setWarmup}
        />

        <Box
          label="Repetições"
          value={reps}
          setValue={setReps}
        />

        <Box
          label="Fase firme (min)"
          value={phase1}
          setValue={setPhase1}
        />

        <Box
          label="Fase forte (min)"
          value={phase2}
          setValue={setPhase2}
        />

        <Box
          label="Desaceleração (min)"
          value={cooldown}
          setValue={setCooldown}
        />

        <div
          style={{
            background: '#111827',
            borderRadius: 25,
            padding: 30,
            marginTop: 25,
            textAlign: 'center',
            color: '#fff',
          }}
        >
          <div
            style={{
              fontSize: 18,
              marginBottom: 10,
            }}
          >
            {phase}
          </div>

          <div
            style={{
              fontSize: 70,
              fontWeight: 'bold',
              color: '#22c55e',
            }}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 15,
            marginTop: 20,
          }}
        >
          <button
            onClick={startWorkout}
            style={{
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              padding: 18,
              borderRadius: 18,
              fontSize: 20,
              fontWeight: 'bold',
            }}
          >
            ▶ INICIAR
          </button>

          <button
            onClick={stopWorkout}
            style={{
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              padding: 18,
              borderRadius: 18,
              fontSize: 20,
              fontWeight: 'bold',
            }}
          >
            ■ PARAR
          </button>
        </div>
      </div>
    </div>
  );
}
