import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, usePlane } from '@react-three/cannon';
import Dice from './Dice';
import { calculateScore, determineLoser } from './gameLogic';
import { Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import './styles/App.css';

function Table() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    material: { restitution: 0.2, friction: 0.5 }
  }));

  const woodTexture = new THREE.TextureLoader().load('/textures/wood_texture.jpg');
  woodTexture.wrapS = THREE.RepeatWrapping;
  woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(8, 8);

  return (
    <group>
      <mesh ref={ref} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial 
          map={woodTexture}
          roughness={0.8}
          metalness={0.2}
          color="#5d4037"
        />
      </mesh>
      <mesh position={[0, -0.5, 20]}>
        <boxGeometry args={[42, 1, 2]} />
        <meshStandardMaterial 
          map={woodTexture} 
          roughness={0.7} 
        />
      </mesh>
      <mesh position={[0, -0.5, -20]}>
        <boxGeometry args={[42, 1, 2]} />
        <meshStandardMaterial 
          map={woodTexture} 
          roughness={0.7} 
        />
      </mesh>
      <mesh position={[20, -0.5, 0]} rotation={[0, Math.PI/2, 0]}>
        <boxGeometry args={[42, 1, 2]} />
        <meshStandardMaterial 
          map={woodTexture}
          roughness={0.7} 
        />
      </mesh>
    </group>
  );
}

export default function App() {
  const [gamePhase, setGamePhase] = useState('setup');
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [startingPlayer, setStartingPlayer] = useState(0);
  const [knight, setKnight] = useState(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [rolling, setRolling] = useState(false);
  const [diceCompleted, setDiceCompleted] = useState(0);
  const [maxRolls, setMaxRolls] = useState(3);
  const [loser, setLoser] = useState(null);
  
  const dice1Ref = useRef();
  const dice2Ref = useRef();

  const startGame = () => {
    const initializedPlayers = Array(Math.max(2, Math.min(8, playerCount)))
      .fill()
      .map(() => ({
        rolls: 3,
        score: 0,
        special: null,
        finalScore: null
      }));
    setPlayers(initializedPlayers);
    setMaxRolls(3);
    setStartingPlayer(0);
    setCurrentPlayer(0);
    setGamePhase('playing');
  };

  const handlePlayerCountChange = (e) => {
    setPlayerCount(Math.max(2, Math.min(8, parseInt(e.target.value) || 2)))
  };

  const rollDice = () => {
    if (rolling || (players[currentPlayer]?.rolls ?? 0) <= 0) return;
    
    setDiceCompleted(0);
    setRolling(true);
    dice1Ref.current.rollDice();
    dice2Ref.current.rollDice();
  };

  const handleDiceComplete = () => {
    setDiceCompleted(prev => prev + 1);
  };

  useEffect(() => {
    if (diceCompleted === 2) {
      const die1 = dice1Ref.current?.lastValue || 1;
      const die2 = dice2Ref.current?.lastValue || 1;
      const results = calculateScore(die1, die2);

      setPlayers(prevPlayers => {
        const newPlayers = [...prevPlayers];
        const currentPlayerData = newPlayers[currentPlayer];
        
        if (!currentPlayerData) return newPlayers;

        if (results.instantLoss) {
          newPlayers[currentPlayer] = {
            ...currentPlayerData,
            score: results.score,
            finalScore: results.score,
            special: results.special,
            rolls: 0
          };
          setLoser(currentPlayer);
          setGamePhase('scoring');
        } else {
          newPlayers[currentPlayer] = {
            ...currentPlayerData,
            score: results.score,
            special: results.special,
            rolls: currentPlayerData.rolls - 1
          };
        }
        return newPlayers;
      });

      setRolling(false);
    }
  }, [diceCompleted],  [currentPlayer]);

  const endTurn = () => {
    setPlayers(prevPlayers => {
      const newPlayers = [...prevPlayers];
      const currentPlayerData = newPlayers[currentPlayer];
      
      if (!currentPlayerData) return newPlayers;

      const rollsUsed = currentPlayer === startingPlayer 
        ? 3 - currentPlayerData.rolls
        : maxRolls - currentPlayerData.rolls;

      newPlayers[currentPlayer] = {
        ...currentPlayerData,
        finalScore: currentPlayerData.score,
        rolls: 0
      };

      if (currentPlayer === startingPlayer) {
        setMaxRolls(rollsUsed);
      }

      return newPlayers;
    });
    
    nextPlayer();
  };

  const nextPlayer = () => {
    const nextPlayerIndex = (currentPlayer + 1) % players.length;
    
    if (currentPlayer === startingPlayer) {
      setPlayers(prevPlayers => {
        return prevPlayers.map((player, index) => 
          index === startingPlayer ? player : { ...player, rolls: maxRolls }
        );
      });
    }

    setCurrentPlayer(nextPlayerIndex);
    
    if (players.every(p => p.rolls <= 0 || p.finalScore !== null)) {
      setGamePhase('scoring');
    }
  };

  const nextRound = () => {
    const losers = determineLoser(players);
    const validLoser = losers.length > 0 ? losers[0].index : 0;
    
    setPlayers(prevPlayers => prevPlayers.map(p => ({
      ...p,
      rolls: 3,
      finalScore: null,
      score: 0,
      special: null
    })));
    
    setStartingPlayer(validLoser);
    setCurrentPlayer(validLoser);
    setMaxRolls(3);
    setGamePhase('playing');
    setLoser(null);
  };

  useEffect(() => {
    if (gamePhase === 'playing' && currentPlayer !== startingPlayer) {
      setPlayers(prevPlayers => {
        const newPlayers = [...prevPlayers];
        if (newPlayers[currentPlayer] && newPlayers[currentPlayer].rolls !== maxRolls) {
          newPlayers[currentPlayer].rolls = maxRolls;
        }
        return newPlayers;
      });
    }
  }, [currentPlayer, gamePhase, maxRolls, startingPlayer]);

  const currentLosers = determineLoser(players);

  if (gamePhase === 'setup') {
    return (
      <div className="setup-screen">
        <h1>🎲 Mexen 🍻</h1>
        <div className="setup-form">
          <label>
            Number of Players:
            <input 
              type="number" 
              min="2" 
              max="8" 
              value={playerCount}
              onChange={handlePlayerCountChange}
            />
          </label>
          <button onClick={startGame}>Start Game</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="dice-area">
        <Canvas shadows camera={{ position: [0, 15, 25], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight 
            position={[10, 20, 10]} 
            intensity={1.5} 
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <Physics gravity={[0, -30, 0]} defaultContactMaterial={{ restitution: 0.3 }}>
            <Table />
            <Dice ref={dice1Ref} position={[-4, 5, 0]} onRollComplete={handleDiceComplete} />
            <Dice ref={dice2Ref} position={[4, 5, 0]} onRollComplete={handleDiceComplete} />
          </Physics>
          <Environment preset="sunset" />
          <OrbitControls enableZoom={false} maxPolarAngle={Math.PI/2} />
        </Canvas>
      </div>

      <div className="game-hud">
        <div className="hud-header">
          <h2>Player {currentPlayer + 1}'s Turn</h2>
          <div className="round-status">
            {gamePhase === 'playing' ? (
              players[currentPlayer]?.rolls > 0 ? 
                `Rolls left: ${players[currentPlayer]?.rolls}` : 
                'Turn complete!'
            ) : 'Round Complete!'}
          </div>
        </div>

        {gamePhase === 'playing' ? (
          <div className="game-controls">
            <button 
              className={`action-button ${rolling ? 'rolling' : ''}`} 
              onClick={rollDice}
              disabled={rolling || (players[currentPlayer]?.rolls ?? 0) <= 0}
            >
              {rolling ? '🎲 Rolling...' : `🎲 Roll Dice (${players[currentPlayer]?.rolls || 0} left)`}
            </button>
            
            {(players[currentPlayer]?.rolls ?? 0) < maxRolls && (
              <button 
                className="action-button end-turn-button" 
                onClick={endTurn}
                disabled={rolling}
              >
                ✅ End Turn
              </button>
            )}
          </div>
        ) : (
          <div className="scoring-phase">
            <div className="loser-message">
              {currentLosers.length > 0 ? (
                currentLosers.map((loser, index) => {
                  const baseSips = 3;
                  let sips = baseSips;
                  
                  if (loser.special === 'DOUBLE') sips = baseSips * 2;
                  if (loser.special === 'MAX') sips = baseSips * 3;
                  if (loser.special === 'KNIGHT') sips = baseSips * 1.5;

                  return (
                    <div key={index} className="drink-warning">
                      🍻 Player {loser.index + 1} drinks {sips} sips! 🍻
                    </div>
                  );
                })
              ) : (
                <div className="drink-warning">
                  🎉 No one drinks this round! 🎉
                </div>
              )}
            </div>
            <button className="action-button" onClick={nextRound}>
              Next Round ➡️
            </button>
          </div>
        )}

        <div className="players-list">
          {players.map((player, index) => (
            <div key={index} className={`player-card ${index === currentPlayer ? 'active' : ''}`}>
              <h3>Player {index + 1}</h3>
              <div className="player-stats">
                <div>Score: {player.finalScore !== null ? player.finalScore : player.score}</div>
                {player.special === 'INSTANT_LOSE' ? (
                  <div className="special-effect instant-loss">AUTOMATIC LOSS</div>
                ) : (
                  <>
                    {gamePhase === 'playing' && <div>Rolls left: {player.rolls}</div>}
                    {player.special && <div className="special-effect">{player.special}</div>}
                  </>
                )}
                {knight === index && <div className="knight-badge">♘ Knight</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
