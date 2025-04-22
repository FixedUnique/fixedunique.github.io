import { forwardRef, useState, useEffect, useCallback } from 'react';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';

const FACE_VALUES = {
  right: 6,
  left: 1,
  top: 5,
  bottom: 2,
  front: 3,
  back: 4
};

const faceRotations = [
  new THREE.Euler(0, Math.PI / 2, 0),
  new THREE.Euler(0, -Math.PI / 2, 0),
  new THREE.Euler(-Math.PI / 2, 0, 0),
  new THREE.Euler(Math.PI / 2, 0, 0),
  new THREE.Euler(0, 0, 0),
  new THREE.Euler(0, Math.PI, 0),
];

const getDotPosition = (num, index) => {
  const positions = {
    1: [[0, 0]],
    2: [[-0.6, -0.6], [0.6, 0.6]],
    3: [[-0.6, -0.6], [0, 0], [0.6, 0.6]],
    4: [[-0.6, -0.6], [-0.6, 0.6], [0.6, -0.6], [0.6, 0.6]],
    5: [[-0.6, -0.6], [-0.6, 0.6], [0.6, -0.6], [0.6, 0.6], [0, 0]],
    6: [[-0.6, -0.6], [-0.6, 0], [-0.6, 0.6], [0.6, -0.6], [0.6, 0], [0.6, 0.6]],
  };
  return new THREE.Vector2(...positions[num][index]);
};

const Dice = forwardRef(({ position, onRollComplete }, ref) => {
  const [localRef, api] = useBox(() => ({
    mass: 1.5,
    position: [position[0], position[1] + 5, position[2]],
    args: [2, 2, 2],
    material: { restitution: 0.4, friction: 0.3 },
    linearDamping: 0.5,
    angularDamping: 0.5
  }));
  
  const [lastValue, setLastValue] = useState(1);

  const rollDice = useCallback(() => {
    api.position.set(position[0], position[1] + 5, position[2]);
    api.velocity.set(0, 0, 0);
    api.angularVelocity.set(0, 0, 0);

    setTimeout(() => {
      api.velocity.set(
        (Math.random() - 0.5) * 10,
        -5 + Math.random() * 5,
        (Math.random() - 0.5) * 10
      );
      api.angularVelocity.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
    }, 50);

    setTimeout(() => {
      const quaternion = new THREE.Quaternion();
      localRef.current.getWorldQuaternion(quaternion);

      const value = getFaceValue(quaternion);
      setLastValue(value);
      onRollComplete();
    }, 3000);
  }, [api, position, onRollComplete, localRef]);

  const getFaceValue = (quaternion) => {
    const worldUp = new THREE.Vector3(0, 1, 0);
    const faces = [
      { normal: new THREE.Vector3(1, 0, 0), value: FACE_VALUES.right },
      { normal: new THREE.Vector3(-1, 0, 0), value: FACE_VALUES.left },
      { normal: new THREE.Vector3(0, 1, 0), value: FACE_VALUES.top },
      { normal: new THREE.Vector3(0, -1, 0), value: FACE_VALUES.bottom },
      { normal: new THREE.Vector3(0, 0, 1), value: FACE_VALUES.front },
      { normal: new THREE.Vector3(0, 0, -1), value: FACE_VALUES.back },
    ];

    return faces.reduce((closest, face) => {
      const normal = face.normal.clone().applyQuaternion(quaternion).normalize();
      const dot = normal.dot(worldUp);
      return dot > closest.dot ? { dot, value: face.value } : closest;
    }, { dot: -Infinity, value: 1 }).value;
  };

  useEffect(() => {
    if (ref) {
      ref.current = {
        rollDice,
        lastValue
      };
    }
  }, [ref, lastValue, rollDice]);

  return (
    <group ref={localRef}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
        {[
          FACE_VALUES.right,    // +X axis (6)
          FACE_VALUES.left,     // -X axis (1)
          FACE_VALUES.top,      // +Y axis (5)
          FACE_VALUES.bottom,   // -Y axis (2)
          FACE_VALUES.front,    // +Z axis (3)
          FACE_VALUES.back      // -Z axis (4)
        ].map((num, i) => (
          <group key={i} rotation={faceRotations[i]}>
            {Array.from({ length: num }).map((_, j) => {
              const pos = getDotPosition(num, j);
              return (
                <mesh position={[pos.x, pos.y, 1.01]} key={j}>
                  <circleGeometry args={[0.18, 32]} />
                  <meshStandardMaterial color="#000000" />
                </mesh>
              );
            })}
          </group>
        ))}
      </mesh>
    </group>
  );
});

export default Dice;
