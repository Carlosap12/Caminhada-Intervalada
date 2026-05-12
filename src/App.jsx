import React from 'react';

export default function IntervalWalkingApp() {
  const [warmup, setWarmup] = React.useState(5);
  const [reps, setReps] = React.useState(5);

  const [phase1, setPhase1] = React.useState(2);
  const [phase2, setPhase2] = React.useState(1);

  const [bpm1, setBpm1] = React.useState(130);
  const [bpm2, setBpm2] = React.useState(160);

  const [cooldown, setCooldown] = React.useState(5);

  const [running, setRunning] = React.useState(false);
  const [phase, setPhase] = React.useState('Pronto');
  const [timeLeft, setTimeLeft] = React.useState(0);

  const [history, setHistory] = React.useState(() => {
    return JSON.parse(localStorage.getItem('walkHistory') || '[]');
  });

  const intervalRef = React.useRef(null);
const beepRef = React.useRef(null);

const audioContextRef = React.useRef(null);
  React.useEffect(() => {
  audioContextRef.current = new (
    window.AudioContext ||
    window.webkitAudioContext
  )();

  return () => {
    clearInterval(beepRef.current);

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };
}, []);

const beep = (
  frequency = 1000,
  duration = 0.05
) => {
  const ctx = audioContextRef.current;

  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(
    0.5,
    ctx.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    ctx.currentTime + duration
  );

  oscillator.start();
  oscillator.stop(
    ctx.currentTime + duration
  );
};
  const totalMinutes =
    warmup +
    cooldown +
    reps * (phase1 + phase2);

  const saveHistory = () => {
    const updated = [
      {
        date: new Date().toLocaleString('pt-BR'),
        warmup,
        reps,
        phase1,
        phase2,
        cooldown,
        totalMinutes,
      },
      ...history,
    ].slice(0, 10);

    setHistory(updated);

    localStorage.setItem(
      'walkHistory',
      JSON.stringify(updated)
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');

    const secs = (seconds % 60)
      .toString()
      .padStart(2, '0');

    return `${mins}:${secs}`;
  };

  const startWorkout = () => {
    if (running) return;

    const totalSeconds = totalMinutes * 60;

    setTimeLeft(totalSeconds);

    setPhase('Treino em andamento');

    setRunning(true);
let currentBpm = bpm1;

beepRef.current = setInterval(() => {
  beep();

  currentBpm =
    currentBpm === bpm1
      ? bpm2
      : bpm1;

  clearInterval(beepRef.current);

  beepRef.current = setInterval(
    () => beep(),
    (60 / currentBpm) * 1000
  );
}, (60 / bpm1) * 1000);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);

          setRunning(false);

          setPhase('Treino Finalizado');

          saveHistory();

          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  const stopWorkout = () => {
    clearInterval(intervalRef.current);
clearInterval(beepRef.current);
    setRunning(false);

    setPhase('Treino pausado');
  };

  const Control = ({
    label,
    value,
    setValue,
  }) => (
    <div
      style={{
        background: '#f3f4f6',
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 12,
          color: '#374151',
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          onClick={() =>
            setValue(Math.max(0, value - 1))
          }
          style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            fontSize: 32,
            fontWeight: 'bold',
          }}
        >
          −
        </button>

        <div
          style={{
            fontSize: 36,
            fontWeight: 'bold',
            color: '#111827',
          }}
        >
          {value}
        </div>

        <button
          onClick={() => setValue(value + 1)}
          style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            border: 'none',
            background: '#22c55e',
            color: '#fff',
            fontSize: 32,
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
        minHeight: '100vh',
        background:
          'linear-gradient(to bottom, #111827, #1f2937)',
        padding: 20,
        fontFamily: 'Arial',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: 28,
            padding: 24,
            boxShadow:
              '0 0 25px rgba(0,0,0,0.25)',
          }}
        >
          <h1
            style={{
              textAlign: 'center',
              fontSize: 34,
              marginBottom: 25,
              color: '#111827',
            }}
          >
            Caminhada Intervalada
          </h1>

          <Control
            label="Aquecimento"
            value={warmup}
            setValue={setWarmup}
          />

          <Control
            label="Repetições"
            value={reps}
            setValue={setReps}
          />

          <Control
            label="Fase firme (min)"
            value={phase1}
            setValue={setPhase1}
          />

          <Control
            label="BPM firme"
            value={bpm1}
            setValue={setBpm1}
          />

          <Control
            label="Fase forte (min)"
            value={phase2}
            setValue={setPhase2}
          />

          <Control
            label="BPM forte"
            value={bpm2}
            setValue={setBpm2}
          />

          <Control
            label="Desaquecimento"
            value={cooldown}
            setValue={setCooldown}
          />
        </div>

        <div
          style={{
            background: '#111827',
            borderRadius: 28,
            padding: 30,
            textAlign: 'center',
            color: '#fff',
            boxShadow:
              '0 0 25px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              fontSize: 24,
              marginBottom: 10,
            }}
          >
            {phase}
          </div>

          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: '#4ade80',
            }}
          >
            {formatTime(timeLeft)}
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 20,
              color: '#d1d5db',
            }}
          >
            Total do treino: {totalMinutes} min
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
          }}
        >
          <button
            onClick={startWorkout}
            disabled={running}
            style={{
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              padding: 20,
              borderRadius: 20,
              fontSize: 22,
              fontWeight: 'bold',
            }}
          >
            ▶ INICIAR
          </button>

          <button
            onClick={stopWorkout}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: 20,
              borderRadius: 20,
              fontSize: 22,
              fontWeight: 'bold',
            }}
          >
            ■ PARAR
          </button>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 28,
            padding: 24,
            boxShadow:
              '0 0 25px rgba(0,0,0,0.15)',
          }}
        >
          <h2
            style={{
              fontSize: 24,
              marginBottom: 16,
              color: '#111827',
              textAlign: 'center',
            }}
          >
            Histórico
          </h2>

          {history.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                color: '#6b7280',
              }}
            >
              Nenhum treino salvo ainda.
            </div>
          )}

          {history.map((item, index) => (
            <div
              key={index}
              style={{
                background: '#f3f4f6',
                borderRadius: 18,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontWeight: 'bold',
                  marginBottom: 6,
                  color: '#111827',
                }}
              >
                {item.date}
              </div>

              <div
                style={{
                  color: '#374151',
                  lineHeight: 1.5,
                }}
              >
                Aq {item.warmup}m •
                Firme {item.phase1}m •
                Forte {item.phase2}m •
                Rep {item.reps} •
                Desaquec {item.cooldown}m
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
