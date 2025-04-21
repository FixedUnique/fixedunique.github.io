import { useRef, useState } from 'react';
import { useBox } from '@react-three/cannon';

export const Dice = ({ position, onRollResult }) => {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: [1, 1, 1],
    material: { friction: 0.1, restitution: 0.5 },
  }));

  const rollDice = () => {
    // Random rotation and force
    api.angularVelocity.set(
      Math.random() * 10,
      Math.random() * 10,
      Math.random() * 10
    );
    api.velocity.set(0, 10, 0);
    
    // Get final face after 2 seconds
    setTimeout(() => {
      const diceFaces = [6, 2, 1, 5, 3, 4]; // Three.js face mapping
      const currentRotation = ref.current.rotation;
      // Add face calculation logic here
    }, 2000);
  };

  return (
    <mesh ref={ref} castShadow receiveShadow onClick={rollDice}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  );
};