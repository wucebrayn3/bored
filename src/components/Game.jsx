import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";

import styles from '../styles/Game.module.css';

function getGridCols(n) {
  const sqrt = Math.sqrt(n);
  if (Number.isInteger(sqrt)) return sqrt;
  return Math.ceil(n / Math.floor(sqrt));
}

const stages = [4, 9, 16, 25]

export default function Game() {
  const navigate = useNavigate();

  const [started, setStarted] = useState(false)
  const [stage, setStage] = useState(0)
  const [level, setLevel] = useState(1)
  const [sequence, setSequence] = useState([])
  const [playerIndex, setPlayerIndex] = useState(0)
  const [showing, setShowing] = useState(false)
  const [highlighted, setHighlighted] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)

  const buttonCount = stages[stage]
  const cols = useMemo(() => getGridCols(buttonCount), [buttonCount])
  const maxTime = useMemo(() => 3 + Math.floor((level - 1) / 5) * 2, [level])

  const noteNames = [
    'F3', 'C4', 'Eb4', 'G4', 'Ab4', 'Bb4', 'Eb5', 'Ab3',
    'C4', 'Ab4', 'Bb4', 'Eb5', 'F5', 'G5', 'Eb5', 'C5',
    'C4', 'G4', 'Bb4', 'D5', 'Eb5', 'Ab5', 'Bb5', 'Eb4',
    'Bb4', 'D5', 'G5', 'C6', 'Bb5', 'Ab5', 'G5', 'Eb5'
  ]

  const freqs = useMemo(() => {
    const semitone = { 'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11 }
    return noteNames.map(name => {
      const m = name.match(/^([A-G][b#]?)(\d+)$/)
      const midi = 12 * (parseInt(m[2]) + 1) + semitone[m[1]]
      return 440 * Math.pow(2, (midi - 69) / 12)
    })
  }, [])

  const noteIndexRef = useRef(0)

  function playNextNote() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freqs[noteIndexRef.current % freqs.length]
    noteIndexRef.current++
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  }

  const endGame = useCallback(() => {
    const score = level - 1
    const best = localStorage.getItem('memory_high_score')
    if (!best || score > Number(best)) {
      localStorage.setItem('memory_high_score', score)
    }
    setGameOver(true)
  }, [level])

  function extendSequence() {
    const next = Math.floor(Math.random() * buttonCount) + 1
    setSequence(prev => [...prev, next])
  }

  function startGame() {
    setLevel(1)
    setStage(0)
    setGameOver(false)
    setPlayerIndex(0)
    setShowing(false)
    setHighlighted(null)
    setStarted(true)
    setTimeLeft(null)
    noteIndexRef.current = 0
    const first = Math.floor(Math.random() * stages[0]) + 1
    setSequence([first])
  }

  useEffect(() => {
    if (!started || gameOver || sequence.length === 0) return
    setPlayerIndex(0)
    noteIndexRef.current = 0
    setShowing(true)
  }, [started, gameOver, sequence.length])

  useEffect(() => {
    if (!showing || sequence.length === 0) return

    const steps = Math.floor((level - 1) / 5)
    const duration = Math.max(300, 1000 - steps * 100)
    const gap = Math.max(100, 300 - steps * 50)
    const intervalMs = duration + gap

    let i = 0
    const interval = setInterval(() => {
      setHighlighted(sequence[i])
      setTimeout(() => setHighlighted(null), duration)
      i++
      if (i >= sequence.length) {
        clearInterval(interval)
        setTimeout(() => setShowing(false), gap + 200)
      }
    }, intervalMs)
    return () => clearInterval(interval)
  }, [showing, level])

  useEffect(() => {
    if (showing) {
      setTimeLeft(maxTime)
    }
  }, [showing, maxTime])

  useEffect(() => {
    if (!started || gameOver || showing || timeLeft === null || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [started, gameOver, showing, timeLeft])

  useEffect(() => {
    if (!started || gameOver || showing || timeLeft !== 0) return
    endGame()
  }, [timeLeft])

  function playError() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = 120
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  }

  function handleClick(n) {
    if (showing || gameOver) return
    if (n !== sequence[playerIndex]) {
      playError()
      endGame()
      return
    }
    playNextNote()
    const next = playerIndex + 1
    setPlayerIndex(next)
    if (next === sequence.length) {
      if (level % 10 === 0 && stage < stages.length - 1) {
        setStage(prev => prev + 1)
      }
      setLevel(prev => prev + 1)
      extendSequence()
    }
  }

  return (
    <div className={styles.game}>
      <h1 className={styles.level}>Level {level}</h1>
      <button className={styles.navBtn} onClick={() => navigate('/')}>Back</button>
      <br />

      {!started ? (
        <button className={styles.navBtn} onClick={startGame}>Start</button>
      ) : (
        <>
          <div className={styles.timerTrack}>
            <div
              className={styles.timerFill}
              style={{ width: timeLeft !== null ? `${(timeLeft / maxTime) * 100}%` : '100%' }}
            />
          </div>
          <p className={styles.timerText}>{timeLeft ?? maxTime}s</p>
          <div
            className={styles.grid}
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
          {Array.from({ length: buttonCount }).map((_, index) => {
            const num = index + 1
            return (
              <button
                className={`${styles.btn} ${highlighted === num ? styles.highlight : ''} ${showing ? styles.disabled : ''}`}
                onClick={() => handleClick(num)}
                disabled={showing || gameOver}
                key={num}
              >
                {num}
              </button>
            )
          })}
        </div>
        </>
      )}

      {gameOver && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>Game Over</h2>
            <p>The sequence is {sequence.join(' ')}</p>
            <p>Score: {level - 1}</p>
            <p>Best: {localStorage.getItem('memory_high_score') ?? 0}</p>
            <button onClick={startGame}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  )
}
