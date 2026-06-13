import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";

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

  const buttonCount = stages[stage]
  const cols = useMemo(() => getGridCols(buttonCount), [buttonCount])

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
    const first = Math.floor(Math.random() * stages[0]) + 1
    setSequence([first])
  }

  useEffect(() => {
    if (!started || gameOver || sequence.length === 0) return
    setPlayerIndex(0)
    setShowing(true)
  }, [started, gameOver, sequence.length])

  useEffect(() => {
    if (!showing || sequence.length === 0) return
    let i = 0
    const interval = setInterval(() => {
      setHighlighted(sequence[i])
      setTimeout(() => setHighlighted(null), 1000)
      i++
      if (i >= sequence.length) {
        clearInterval(interval)
        setTimeout(() => setShowing(false), 1200)
      }
    }, 1300)
    return () => clearInterval(interval)
  }, [showing])

  function handleClick(n) {
    if (showing || gameOver) return
    if (n !== sequence[playerIndex]) {
      const score = level - 1
      const best = localStorage.getItem('memory_high_score')
      if (!best || score > Number(best)) {
        localStorage.setItem('memory_high_score', score)
      }
      setGameOver(true)
      return
    }
    const next = playerIndex + 1
    setPlayerIndex(next)
    if (next === sequence.length) {
      if (level === 10 && stage < stages.length - 1) {
        setStage(prev => prev + 1)
        setLevel(1)
      } else {
        setLevel(prev => prev + 1)
      }
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
