import { HashRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { GameProvider } from './services/gameContext';
import Menu from './components/Menu';
import Game from './components/Game';

function App() {
  return (
    <GameProvider>
      <HashRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </div>
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;
