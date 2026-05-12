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
  const [paused, setPaused] = React.useState(false);

  const [phase, setPhase] = React.useState('Pronto');
  const [timeLeft, setTimeLeft] = React.useState(0);

  const [history, setHistory] = React.useState(() => {
    return JSON.parse(
      localStorage.getItem('walkHistory') || '[]'
    );
  });

  const intervalRef = React.useRef(null);
  const beepRef = React.useRef(null);

  const audioContextRef = React.useRef(null);

  const workoutRef = React.useRef({
    stage: 'warmup',
    rep: 0,
  });

  React.useEffect(() => {
    audioContextRef.current = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(beepRef.current);

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const totalMinutes =
    warmup +
    cooldown +
    reps * (phase1 + phase2);

  const beep = (
    frequency = 880,
    duration = 0.06
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

  const stopBeeps = () => {
    clearInterval(beepRef.current);
  };

  const startBeeps = (bpm) => {
    stopBeeps();

    if (!bpm) return;

    const interval =
      (60 / bpm) * 1000;

    beep();

    beepRef.current = setInterval(() => {
      beep();
    }, interval);
  };

  const finalAlert = async () => {
    stopBeeps();

    for (let i = 0; i < 3; i++) {
      beep(1400, 0.2);

      await new Promise((r) =>
        setTimeout(r, 400)
      );
    }
  };

  const saveHistory = () => {
    const updated = [
      {
        id: Date.now(),
        date: new Date().toLocaleString('pt-BR'),
        warmup,
        reps,
        phase1,
        bpm1,
        phase2,
        bpm2,
        cooldown,
        totalMinutes,
      },
      ...history,
    ].slice(0, 20);

    setHistory(updated);

    localStorage.setItem(
      'walkHistory',
      JSON.stringify(updated)
    );
  };

  const deleteHistoryItem = (id) => {
    const updated = history.filter(
      (item) => item.id !== id
    );

    setHistory(updated);

    localStorage.setItem(
      'walkHistory',
      JSON.stringify(updated)
    );
  };

  const restoreWorkout = (item) => {
    setWarmup(item.warmup);
    setReps(item.reps);

    setPhase1(item.phase1);
    setPhase2(item.phase2);

    setBpm1(item.bpm1);
    setBpm2(item.bpm2);

    setCooldown(item.cooldown);
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

  const goToNextStage = () => {
    const state = workoutRef.current;

    if (state.stage === 'warmup') {
      state.stage = 'firm';

      setPhase(
        `Firme ${state.rep + 1}/${reps}`
      );

      setTimeLeft(phase1 * 60);

      startBeeps(bpm1);

      return;
    }

    if (state.stage === 'firm') {
      state.stage = 'strong';

      setPhase(
        `Forte ${state.rep + 1}/${reps}`
      );

      setTimeLeft(phase2 * 60);

      startBeeps(bpm2);

      return;
    }

    if (state.stage === 'strong') {
      state.rep += 1;

      if (state.rep >= reps) {
        state.stage = 'cooldown';

        setPhase('Desaquecimento');

        setTimeLeft(cooldown * 60);

        stopBeeps();

        return;
      }

      state.stage = 'firm';

      setPhase(
        `Firme ${state.rep + 1}/${reps}`
      );

      setTimeLeft(phase1 * 60);

      startBeeps(bpm1);

      return;
    }

    if (state.stage === 'cooldown') {
      finishWorkout();
    }
  };

  const finishWorkout = async () => {
    clearInterval(intervalRef.current);

    stopBeeps();

    setRunning(false);

    setPaused(false);

    setPhase('Treino Finalizado');

    setTimeLeft(0);

    saveHistory();

    await finalAlert();
  };

  const startWorkout = async () => {
    if (running) return;

    if (
      audioContextRef.current &&
      audioContextRef.current.state === 'suspended'
    ) {
      await audioContextRef.current.resume();
    }

    workoutRef.current = {
      stage: 'warmup',
      rep: 0,
    };

    setRunning(true);

    setPaused(false);

    setPhase('Aquecimento');

    setTimeLeft(warmup * 60);

    stopBeeps();

    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          goToNextStage();

          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  const pauseWorkout = () => {
    clearInterval(intervalRef.current);

    stopBeeps();

    setPaused(true);

    setRunning(false);

    setPhase('Treino pausado');
  };

  const continueWorkout = () => {
    if (!paused) return;

    setRunning(true);

    setPaused(false);

    const state = workoutRef.current;

    if (state.stage === 'firm') {
      startBeeps(bpm1);
    }

    if (state.stage === 'strong') {
      startBeeps(bpm2);
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          goToNextStage();

          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  const stopWorkout = () => {
    clearInterval(intervalRef.current);

    stopBeeps();

    setRunning(false);

    setPaused(false);

    setPhase('Treino Encerrado');

    setTimeLeft(0);
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
              fontSize: 28,
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
              marginTop: 14,
              fontSize: 20,
              color: '#d1d5db',
            }}
          >
            Total do treino:
            {' '}
            {totalMinutes} min
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
              fontSize: 20,
              fontWeight: 'bold',
            }}
          >
            ▶ INICIAR
          </button>

          <button
            onClick={pauseWorkout}
            style={{
              background: '#f59e0b',
              color: '#fff',
              border: 'none',
              padding: 20,
              borderRadius: 20,
              fontSize: 20,
              fontWeight: 'bold',
            }}
          >
            ❚❚ PAUSAR
          </button>

          <button
            onClick={continueWorkout}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              padding: 20,
              borderRadius: 20,
              fontSize: 20,
              fontWeight: 'bold',
            }}
          >
            ▶ CONTINUAR
          </button>

          <button
            onClick={stopWorkout}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: 20,
              borderRadius: 20,
              fontSize: 20,
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
              textAlign: 'center',
              fontSize: 24,
              marginBottom: 18,
              color: '#111827',
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

          {history.map((item) => (
            <div
              key={item.id}
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
                  marginBottom: 8,
                }}
              >
                {item.date}
              </div>

              <div
                style={{
                  lineHeight: 1.6,
                  color: '#374151',
                  marginBottom: 12,
                }}
              >
                Total {item.totalMinutes}m •
                Aq {item.warmup}m •
                Firme {item.phase1}m/{item.bpm1} •
                Forte {item.phase2}m/{item.bpm2} •
                Rep {item.reps} •
                Desaquec {item.cooldown}m
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                }}
              >
                <button
                  onClick={() =>
                    restoreWorkout(item)
                  }
                  style={{
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 16px',
                    fontWeight: 'bold',
                  }}
                >
                  RETOMAR
                </button>

                <button
                  onClick={() =>
                    deleteHistoryItem(item.id)
                  }
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 16px',
                    fontWeight: 'bold',
                  }}
                >
                  EXCLUIR
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
