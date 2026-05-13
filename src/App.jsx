import React from 'react';

export default function IntervalWalkingApp() {
  const [tab, setTab] = React.useState('config');

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
  const [currentBpm, setCurrentBpm] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(0);

  const [history, setHistory] = React.useState(() => {
    return JSON.parse(localStorage.getItem('walkHistory') || '[]');
  });

  const intervalRef = React.useRef(null);
  const beepRef = React.useRef(null);
  const warningRef = React.useRef(false);

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

    setCurrentBpm(bpm);

    const interval =
      (60 / bpm) * 1000;

    beep();

    beepRef.current = setInterval(() => {
      beep();
    }, interval);
  };

  const transitionAlert = async () => {
    for (let i = 0; i < 3; i++) {
      beep(1200, 0.08);

      await new Promise((r) =>
        setTimeout(r, 300)
      );
    }
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

    setTab('config');
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
    warningRef.current = false;

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

        setCurrentBpm(0);

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

    warningRef.current = false;

    setRunning(true);

    setPaused(false);

    setTab('train');

    setPhase('Aquecimento');

    setCurrentBpm(0);

    setTimeLeft(warmup * 60);

    stopBeeps();

    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (
          prev <= 4 &&
          prev > 1 &&
          !warningRef.current
        ) {
          warningRef.current = true;

          transitionAlert();
        }

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

    warningRef.current = false;

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
        if (
          prev <= 4 &&
          prev > 1 &&
          !warningRef.current
        ) {
          warningRef.current = true;

          transitionAlert();
        }

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
        >
          −
        </button>

        <div>{value}</div>

        <button
          onClick={() => setValue(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );

  const TabButton = ({
    label,
    active,
    onClick,
  }) => (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: 'transparent',
        border: 'none',
        color: active ? '#22c55e' : '#9ca3af',
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#111827',
        padding: 20,
        color: 'white',
        fontFamily: 'Arial',
        paddingBottom: 100,
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
        }}
      >
        {tab === 'config' && (
          <div>
            <h1>Configuração</h1>

            <Control label='Aquecimento' value={warmup} setValue={setWarmup} />
            <Control label='Repetições' value={reps} setValue={setReps} />
            <Control label='Fase firme' value={phase1} setValue={setPhase1} />
            <Control label='BPM firme' value={bpm1} setValue={setBpm1} />
            <Control label='Fase forte' value={phase2} setValue={setPhase2} />
            <Control label='BPM forte' value={bpm2} setValue={setBpm2} />
            <Control label='Desaquecimento' value={cooldown} setValue={setCooldown} />

            <div>
              Total do treino: {totalMinutes} min
            </div>
          </div>
        )}

        {tab === 'train' && (
          <div>
            <h1>{phase}</h1>

            <div>
              {currentBpm > 0
                ? `BPM atual: ${currentBpm}`
                : 'Sem BPM'}
            </div>

            <div
              style={{
                fontSize: 88,
                fontWeight: 'bold',
              }}
            >
              {formatTime(timeLeft)}
            </div>

            <button onClick={startWorkout}>
              INICIAR
            </button>

            <button onClick={pauseWorkout}>
              PAUSAR
            </button>

            <button onClick={continueWorkout}>
              CONTINUAR
            </button>

            <button onClick={stopWorkout}>
              PARAR
            </button>
          </div>
        )}

        {tab === 'history' && (
          <div>
            <h1>Histórico</h1>

            {history.map((item) => (
              <div key={item.id}>
                <div>{item.date}</div>

                <div>
                  {item.totalMinutes} min
                </div>

                <button
                  onClick={() =>
                    restoreWorkout(item)
                  }
                >
                  RETOMAR
                </button>

                <button
                  onClick={() =>
                    deleteHistoryItem(item.id)
                  }
                >
                  EXCLUIR
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-around',
          background: '#1f2937',
          padding: 12,
        }}
      >
        <TabButton
          label='Config'
          active={tab === 'config'}
          onClick={() => setTab('config')}
        />

        <TabButton
          label='Treino'
          active={tab === 'train'}
          onClick={() => setTab('train')}
        />

        <TabButton
          label='Histórico'
          active={tab === 'history'}
          onClick={() => setTab('history')}
        />
      </div>
    </div>
  );
}
