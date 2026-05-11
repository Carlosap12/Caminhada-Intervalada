import React, { useState, useEffect } from 'react';

export default function IntervalWalkApp() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('Caminhada');
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    let interval = null;

    if (running) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (phase === 'Caminhada') {
              setPhase('Corrida');
              return 30;
            } else {
              setPhase('Caminhada');
              return 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [running, phase]);

  const startWorkout = () => {
    setRunning(true);
  };

  const stopWorkout = () => {
    setRunning(false);
  };

  const resetWorkout = () => {
    setRunning(false);
    setTime(0);
    setPhase('Caminhada');
    setSecondsLeft(60);
  };

  return (
    <div style={{
      fontFamily: 'Arial',
      textAlign: 'center',
      padding: 30
    }}>
      <h1>Caminhada Intervalada</h1>

      <h2>{phase}</h2>

      <p>Tempo restante: {secondsLeft}s</p>

      <p>Tempo total: {time}s</p>

      <button onClick={startWorkout}>
        Iniciar
      </button>

      <button onClick={stopWorkout} style={{ marginLeft: 10 }}>
        Pausar
      </button>

      <button onClick={resetWorkout} style={{ marginLeft: 10 }}>
        Resetar
      </button>
    </div>
  );
}
