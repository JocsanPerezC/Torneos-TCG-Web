import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Coins, Crown, Dices, RotateCcw, Settings2, Skull } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

const STORAGE_KEY = 'torneos-tcg.counter';
const PLAYER_OPTIONS = [2, 3, 4, 5, 6] as const;
const LIFE_OPTIONS = [20, 30, 40] as const;
const SEAT_COLORS = ['blue', 'red', 'green', 'violet', 'orange', 'teal'] as const;
const HOLD_DELAY = 450;

type CounterState = { players: number; startingLife: number; lives: number[] };
type ToolKind = 'die' | 'coin' | 'first';
type ToolResult = { label: string; value: string; kind: ToolKind; rolling: boolean; id: number };

function freshState(players: number, startingLife: number): CounterState {
  return { players, startingLife, lives: Array(players).fill(startingLife) };
}

function loadState(): CounterState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as CounterState | null;
    if (
      saved &&
      PLAYER_OPTIONS.includes(saved.players as 2) &&
      Array.isArray(saved.lives) &&
      saved.lives.length === saved.players
    )
      return saved;
  } catch {
    // Sin almacenamiento disponible: se empieza una partida nueva.
  }
  return freshState(4, 40);
}

/**
 * Giro de cada asiento para que mire a su jugador con el teléfono en el centro de la mesa.
 * Con 2 jugadores quedan enfrentados; con más, en dos columnas laterales y, si sobra uno,
 * en la cabecera inferior.
 */
function seatRotation(index: number, players: number) {
  if (players === 2) return index === 0 ? 180 : 0;
  if (players % 2 === 1 && index === players - 1) return 0;
  return index % 2 === 0 ? 90 : 270;
}

function random(max: number) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return (values[0] % max) + 1;
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SPIN_DURATION = 1000;

/** Pausas de una ruleta que arranca rápido y frena al final; siempre suman 1 segundo. */
function spinDelays(steps: number) {
  const weights = Array.from({ length: steps }, (_, step) => 1 + (step / steps) ** 2.4 * 6);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => (weight / total) * SPIN_DURATION);
}

function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | undefined;
    const request = async () => {
      try {
        if (document.visibilityState === 'visible' && 'wakeLock' in navigator)
          lock = await navigator.wakeLock.request('screen');
      } catch {
        // El navegador puede negarlo (batería baja, sin permiso); el contador sigue funcionando.
      }
    };
    void request();
    document.addEventListener('visibilitychange', request);
    return () => {
      document.removeEventListener('visibilitychange', request);
      void lock?.release().catch(() => undefined);
    };
  }, []);
}

function Seat({
  index,
  players,
  life,
  startingLife,
  highlighted,
  landed,
  onChange,
}: {
  index: number;
  players: number;
  life: number;
  startingLife: number;
  highlighted: boolean;
  /** Cambia cuando la ruleta de "¿Quién empieza?" se detiene en este asiento. */
  landed: number;
  onChange: (delta: number) => void;
}) {
  const { t } = useTranslation();
  const [recent, setRecent] = useState(0);
  const recentTimer = useRef<number>(undefined);
  const holdTimer = useRef<number>(undefined);
  const held = useRef(false);
  const rotation = seatRotation(index, players);
  const spansRow = players > 2 && players % 2 === 1 && index === players - 1;

  useEffect(
    () => () => {
      window.clearTimeout(recentTimer.current);
      window.clearInterval(holdTimer.current);
    },
    [],
  );

  const apply = (delta: number) => {
    onChange(delta);
    setRecent((value) => value + delta);
    window.clearTimeout(recentTimer.current);
    recentTimer.current = window.setTimeout(() => setRecent(0), 1600);
  };

  // Tocar suma o resta 1; mantener presionado suma o resta de a 10.
  const press = (sign: 1 | -1) => ({
    onPointerDown: () => {
      held.current = false;
      holdTimer.current = window.setTimeout(() => {
        held.current = true;
        apply(sign * 10);
        holdTimer.current = window.setInterval(() => apply(sign * 10), 600);
      }, HOLD_DELAY);
    },
    onPointerUp: () => window.clearInterval(holdTimer.current),
    onPointerLeave: () => window.clearInterval(holdTimer.current),
    onPointerCancel: () => window.clearInterval(holdTimer.current),
    onClick: () => {
      window.clearInterval(holdTimer.current);
      if (!held.current) apply(sign);
      held.current = false;
    },
    onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
  });

  const name = t('app.counter.player', { number: index + 1 });
  return (
    <section
      key={landed ? `landed-${landed}` : undefined}
      className={`counter-seat counter-seat--${SEAT_COLORS[index]}${life <= 0 ? ' is-out' : ''}${highlighted ? ' is-highlighted' : ''}${landed ? ' is-chosen' : ''}`}
      style={{ gridColumn: spansRow ? '1 / -1' : undefined } as CSSProperties}
      aria-label={name}
    >
      <div
        className={`counter-seat__face${rotation % 180 ? ' is-sideways' : ''}`}
        style={{ '--seat-rotation': `${rotation}deg` } as CSSProperties}
      >
        <button
          type="button"
          className="counter-seat__half is-minus"
          aria-label={t('app.counter.lose', { name })}
          {...press(-1)}
        >
          <span aria-hidden="true">−</span>
        </button>
        <div className="counter-seat__life" aria-live="polite">
          <span className="counter-seat__name">{name}</span>
          <strong>{life}</strong>
          {life <= 0 ? (
            <Skull aria-label={t('app.counter.out')} className="counter-seat__skull" />
          ) : (
            recent !== 0 && (
              <em className={recent > 0 ? 'is-gain' : 'is-loss'}>
                {recent > 0 ? `+${recent}` : recent}
              </em>
            )
          )}
          {life > startingLife && <small aria-hidden="true">▲</small>}
        </div>
        <button
          type="button"
          className="counter-seat__half is-plus"
          aria-label={t('app.counter.gain', { name })}
          {...press(1)}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </section>
  );
}

export function CounterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = useState(loadState);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [result, setResult] = useState<ToolResult>();
  const [firstPlayer, setFirstPlayer] = useState<number>();
  const [rolling, setRolling] = useState(false);
  const [landed, setLanded] = useState(0);
  const animationTimer = useRef<number>(undefined);
  useWakeLock();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Sin almacenamiento, la partida vive solo mientras la pantalla siga abierta.
    }
  }, [state]);

  const restart = (players = state.players, startingLife = state.startingLife) => {
    stopAnimation();
    setState(freshState(players, startingLife));
    setFirstPlayer(undefined);
    setResult(undefined);
  };
  const change = (index: number, delta: number) =>
    setState((current) => ({
      ...current,
      lives: current.lives.map((life, seat) => (seat === index ? life + delta : life)),
    }));
  const stopAnimation = () => {
    window.clearTimeout(animationTimer.current);
    setRolling(false);
  };
  useEffect(() => () => window.clearTimeout(animationTimer.current), []);

  // Recorre valores al azar con pausas crecientes y termina en el resultado real.
  const animate = (steps: number, frame: (step: number) => void, done: () => void) => {
    window.clearTimeout(animationTimer.current);
    if (prefersReducedMotion()) {
      done();
      return;
    }
    setRolling(true);
    const delays = spinDelays(steps);
    const tick = (step: number) => {
      if (step === steps) {
        setRolling(false);
        done();
        return;
      }
      frame(step);
      animationTimer.current = window.setTimeout(() => tick(step + 1), delays[step]);
    };
    tick(0);
  };

  const showResult = (label: string, kind: ToolKind, value: string, rollingFrame: boolean) =>
    setResult((current) => ({
      label,
      kind,
      value,
      rolling: rollingFrame,
      id: rollingFrame ? (current?.id ?? 0) : (current?.id ?? 0) + 1,
    }));

  const roll = (sides: number) => {
    const label = t('app.counter.die', { sides });
    const value = String(random(sides));
    animate(
      12,
      () => showResult(label, 'die', String(random(sides)), true),
      () => showResult(label, 'die', value, false),
    );
  };
  const flip = () => {
    const label = t('app.counter.coin');
    const faces = [t('app.counter.heads'), t('app.counter.tails')];
    const value = faces[random(2) - 1];
    animate(
      10,
      (step) => showResult(label, 'coin', faces[step % 2], true),
      () => showResult(label, 'coin', value, false),
    );
  };
  // Se cierra el panel y un resaltado recorre los asientos como una ruleta.
  const chooseFirst = () => {
    const seat = random(state.players) - 1;
    // Dos vueltas completas y el último paso cae justo en el asiento elegido.
    const steps = state.players * 2 + seat + 1;
    setToolsOpen(false);
    setResult(undefined);
    animate(
      steps,
      (step) => setFirstPlayer(step % state.players),
      () => {
        setFirstPlayer(seat);
        setLanded((value) => value + 1);
        showResult(
          t('app.counter.firstPlayer'),
          'first',
          t('app.counter.player', { number: seat + 1 }),
          false,
        );
      },
    );
  };

  return (
    <div className="counter-page">
      <h1 className="sr-only">{t('app.shell.counter')}</h1>
      <p className="sr-only" aria-live="polite">
        {result?.kind === 'first' && !rolling ? `${result.label}: ${result.value}` : ''}
      </p>

      <div
        className={`counter-board counter-board--${state.players}`}
        style={
          { '--rows': state.players === 2 ? 2 : Math.ceil(state.players / 2) } as CSSProperties
        }
      >
        {state.lives.map((life, index) => (
          <Seat
            key={index}
            index={index}
            players={state.players}
            life={life}
            startingLife={state.startingLife}
            highlighted={firstPlayer === index}
            landed={firstPlayer === index && !rolling ? landed : 0}
            onChange={(delta) => change(index, delta)}
          />
        ))}
        <button
          type="button"
          className="counter-board__hub"
          aria-label={t('app.counter.tools')}
          onClick={() => setToolsOpen(true)}
        >
          <Settings2 aria-hidden="true" />
        </button>
      </div>

      {toolsOpen && (
        <Modal
          title={t('app.counter.tools')}
          onClose={() => setToolsOpen(false)}
          dialogClassName="counter-tools"
        >
          {result && (
            <output
              className={`counter-tools__result is-${result.kind}${result.rolling ? ' is-rolling' : ''}`}
              aria-live={result.rolling ? 'off' : 'polite'}
            >
              <span>{result.label}</span>
              <strong key={result.rolling ? 'rolling' : result.id}>{result.value}</strong>
            </output>
          )}
          <div className="counter-tools__actions">
            <button type="button" disabled={rolling} onClick={() => roll(6)}>
              <Dices aria-hidden="true" />
              {t('app.counter.die', { sides: 6 })}
            </button>
            <button type="button" disabled={rolling} onClick={() => roll(20)}>
              <Dices aria-hidden="true" />
              {t('app.counter.die', { sides: 20 })}
            </button>
            <button type="button" disabled={rolling} onClick={flip}>
              <Coins aria-hidden="true" />
              {t('app.counter.coin')}
            </button>
            <button type="button" disabled={rolling} onClick={chooseFirst}>
              <Crown aria-hidden="true" />
              {t('app.counter.firstPlayer')}
            </button>
          </div>

          <fieldset className="counter-tools__option">
            <legend>{t('app.counter.players')}</legend>
            <div>
              {PLAYER_OPTIONS.map((players) => (
                <button
                  type="button"
                  key={players}
                  aria-pressed={state.players === players}
                  onClick={() => restart(players)}
                >
                  {players}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="counter-tools__option">
            <legend>{t('app.counter.startingLife')}</legend>
            <div>
              {LIFE_OPTIONS.map((life) => (
                <button
                  type="button"
                  key={life}
                  aria-pressed={state.startingLife === life}
                  onClick={() => restart(state.players, life)}
                >
                  {life}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            className="app-button app-button--secondary counter-tools__reset"
            onClick={() => {
              restart();
              setToolsOpen(false);
            }}
          >
            <RotateCcw aria-hidden="true" />
            {t('app.counter.reset')}
          </button>
          <button
            type="button"
            className="app-button app-button--secondary counter-tools__back"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/dashboard'))}
          >
            <ArrowLeft aria-hidden="true" />
            {t('app.counter.back')}
          </button>
        </Modal>
      )}
    </div>
  );
}
