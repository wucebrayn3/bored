import { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export function GameProvider({ children }) {
  const [gameMode, setGameMode] = useState(null);
  const [difficulty, setDifficulty] = useState(null);

  return (
    <GameContext.Provider value={{ gameMode, setGameMode, difficulty, setDifficulty }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
