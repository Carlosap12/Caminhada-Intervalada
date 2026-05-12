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

    for (let i = 0; i < 3; i++) {
      beep(1600, 0.25);
      await sleep(500);
    }

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

  const Input = ({ label, value, setValue }) => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>

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
      width: 54,
      height: 54,
      borderRadius: 18,
      border: 'none',
      background: '#ef4444',
      color: 'white',
      fontSize: 30,
      fontWeight: 'bold',
    }}
  >
    −
  </button>

  <div
    style={{
      fontSize: 34,
      fontWeight: 'bold',
      color: '#111827',
    }}
  >
    {value}
  </div>

  <button
    onClick={() => setValue(value + 1)}
    style={{
      width: 54,
      height: 54,
      borderRadius: 18,
      border: 'none',
      background: '#22c55e',
      color: 'white',
      fontSize: 30,
      fontWeight: 'bold',
    }}
  >
    +
  </button>
</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #111827, #1f2937)', padding: 20 }}>
      <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ background: '#ffffff', borderRadius: 28, padding: 24, boxShadow: '0 0 25px rgba(0,0,0,0.25)' }}>
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

        <div style={{ background: '#111827', borderRadius: 28, padding: 32, textAlign: 'center', boxShadow: '0 0 25px rgba(0,0,0,0.35)' }}>
          <div className="text-xl text-white">{phase}</div>

          <div style={{ marginTop: 20, fontSize: 72, fontWeight: 'bold', color: '#4ade80' }}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
      </div>
    </div>
  );
}
