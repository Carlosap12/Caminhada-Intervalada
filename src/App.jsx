import React from 'react';

export default function IntervalWalkingApp() {
  const [warmup, setWarmup] = React.useState(20);
  const [reps, setReps] = React.useState(10);
  const [phase1, setPhase1] = React.useState(2);
  const [phase2, setPhase2] = React.useState(1);
  const [cooldown, setCooldown] = React.useState(10);

  const [bpm1, setBpm1] = React.useState(130);
  const [bpm2, setBpm2] = React.useState(160);

  const [running, setRunning] = React.useState(false);
  const [phase, setPhase] = React.useState('Pronto');
  const [timeLeft, setTimeLeft] = React.useState(0);

  const wakeLockRef = React.useRef(null);
  const intervalRef = React.useRef(null);
  const beepRef = React.useRef(null);
  const audioContextRef = React.useRef(null);

  const [history, setHistory] = React.useState(() => {
    return JSON.parse(localStorage.getItem('walkHistory') || '[]');
  });

  React.useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(beepRef.current);

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const beep = (frequency = 800, duration = 0.08) => {
    const ctx = audioContextRef.current;

    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.type = 'sine';

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + duration,
    );

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  };

  const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const speakFinalMessage = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(
        'Treino finalizado.'
      );

      utterance.lang = 'pt-BR';
      utterance.rate = 1;
      utterance.pitch = 1.2;
      utterance.volume = 1;

      window.speechSynthesis.speak(utterance);
    }
  };

  const enableWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.log(err);
    }
  };

  const releaseWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch (err) {
      console.log(err);
    }
  };

  const runPhase = async (name, minutes, bpm = null) => {
    return new Promise((resolve) => {
      setPhase(name);

      let total = minutes * 60;
      setTimeLeft(total);

      const phaseFrequency = 1400;

      beep(phaseFrequency, 0.15);

      clearInterval(beepRef.current);

      if (bpm) {
        const intervalMs = (60 / bpm) * 1000;

        beepRef.current = setInterval(() => {
          beep(phaseFrequency, 0.05);
        }, intervalMs);
      }

      clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        total -= 1;
        setTimeLeft(total);

        if (total <= 0) {
          clearInterval(intervalRef.current);
          clearInterval(beepRef.current);
          resolve();
        }
      }, 1000);
    });
  };

  const saveHistory = () => {
    const updatedHistory = [
      {
        id: Date.now(),
        date: new Date().toLocaleString('pt-BR'),
        warmup,
        reps,
        phase1,
        phase2,
        cooldown,
      },
      ...history,
    ].slice(0, 20);

    localStorage.setItem(
      'walkHistory',
      JSON.stringify(updatedHistory),
    );

    setHistory(updatedHistory);
  };

  const deleteHistoryItem = (id) => {
    const updatedHistory = history.filter((item) => item.id !== id);

    localStorage.setItem(
      'walkHistory',
      JSON.stringify(updatedHistory),
    );

    setHistory(updatedHistory);
  };

  const startWorkout = async () => {
    if (running) return;

    setRunning(true);

    await enableWakeLock();

    await runPhase('Aquecimento', warmup);

    for (let i = 0; i < reps; i++) {
      await runPhase(`Andando Firme ${i + 1}/${reps}`, phase1, bpm1);

      await sleep(300);

      await runPhase(`Andando Forte ${i + 1}/${reps}`, phase2, bpm2);

      await sleep(300);
    }

    await runPhase('Desaceleração', cooldown);

    setPhase('Treino Finalizado');
    setTimeLeft(0);
    setRunning(false);

    clearInterval(intervalRef.current);
    clearInterval(beepRef.current);

    saveHistory();

    for (let i = 0; i < 3; i++) {
      beep(1600, 0.25);
      await sleep(500);
    }

    speakFinalMessage();

    await releaseWakeLock();
  };

  const stopWorkout = async () => {
    clearInterval(intervalRef.current);
    clearInterval(beepRef.current);

    setRunning(false);
    setPhase('Treino Encerrado');
    setTimeLeft(0);

    await releaseWakeLock();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');

    const secs = (seconds % 60)
      .toString()
      .padStart(2, '0');

    return `${minutes}:${secs}`;
  };

  const Input = ({ label, value, setValue, step = 1 }) => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type="number"
        value={value}
        step={step}
        min="0"
        onChange={(e) => setValue(Number(e.target.value))}
        className="rounded-2xl border p-3 text-lg"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <h1 className="mb-6 text-center text-3xl font-bold">
            Caminhada Intervalada
          </h1>

          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Aquecimento (min)"
              value={warmup}
              setValue={setWarmup}
            />

            <Input
              label="Repetições"
              value={reps}
              setValue={setReps}
            />

            <Input
              label="Fase firme (min)"
              value={phase1}
              setValue={setPhase1}
            />

            <Input
              label="BPM fase firme"
              value={bpm1}
              setValue={setBpm1}
            />

            <Input
              label="Fase forte (min)"
              value={phase2}
              setValue={setPhase2}
            />

            <Input
              label="BPM fase forte"
              value={bpm2}
              setValue={setBpm2}
            />

            <Input
              label="Desaceleração (min)"
              value={cooldown}
              setValue={setCooldown}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-black p-8 text-center shadow-lg">
          <div className="text-xl text-white">{phase}</div>

          <div className="mt-4 text-6xl font-bold text-green-400">
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={startWorkout}
            disabled={running}
            className="rounded-2xl bg-green-600 p-5 text-xl font-bold text-white shadow disabled:opacity-50"
          >
            ▶ INICIAR
          </button>

          <button
            onClick={stopWorkout}
            className="rounded-2xl bg-red-600 p-5 text-xl font-bold text-white shadow"
          >
            ■ PARAR
          </button>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold">Histórico</h2>

          <div className="space-y-3">
            {history.length === 0 && (
              <div className="text-gray-500">
                Nenhum treino salvo ainda.
              </div>
            )}

            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border p-4 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-bold">{item.date}</div>

                    <div>
                      Aquecimento: {item.warmup} min |
                      Repetições: {item.reps}
                    </div>

                    <div>
                      Fase firme: {item.phase1} min |
                      Fase forte: {item.phase2} min
                    </div>

                    <div>
                      Desaceleração: {item.cooldown} min
                    </div>
                  </div>

                  <button
                    onClick={() => deleteHistoryItem(item.id)}
                    className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white"
                  >
                    EXCLUIR
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

