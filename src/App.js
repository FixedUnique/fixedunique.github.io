import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Dice } from './Dice';
import { calculateScore } from './gameLogic';
import { useState } from 'react';

function App() {
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [rollsLeft, setRollsLeft] = useState(3);

  const handleRollComplete = (results) => {
    const newPlayers = [...players];
    newPlayers[currentPlayer] = {
      ...newPlayers[currentPlayer],
      score: results.score,
      special: results.special
    };
    setPlayers(newPlayers);
    setRollsLeft(prev => prev - 1);
  };

  return (
    <div className="App">
      <Canvas camera={{ position: [0, 10, 15], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Physics gravity={[0, -30, 0]}>
          <Dice position={[-2, 5, 0]} onRollResult={handleRollComplete} />
          <Dice position={[2, 5, 0]} onRollResult={handleRollComplete} />
        </Physics>
      </Canvas>
      
      <div className="hud">
        <h2>Rolls Left: {rollsLeft}</h2>
        <button 
          onClick={() => setRollsLeft(3)}
          disabled={rollsLeft > 0}
        >
          Next Player
        </button>
        {players.map((player, index) => (
          <div key={index}>
            Player {index + 1}: {player?.score || 0}
            {player?.special && ` (${player.special})`}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;