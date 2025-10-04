import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { ControlsApi } from '../hooks/useKeyboardControls';

type TouchControlsProps = {
  controls: ControlsApi;
  disabled?: boolean;
};

export const TouchControls = ({ controls, disabled = false }: TouchControlsProps) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const boundsRef = useRef<DOMRect | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const threshold = useMemo(() => 0.25, []);

  const resetJoystick = useCallback(() => {
    pointerIdRef.current = null;
    boundsRef.current = null;
    setOffset({ x: 0, y: 0 });
    controls.reset();
  }, [controls]);

  useEffect(() => {
    if (disabled) {
      resetJoystick();
    }
  }, [disabled, resetJoystick]);

  const applyVector = useCallback(
    (x: number, y: number) => {
      controls.setControlState('forward', -y > threshold);
      controls.setControlState('backward', y > threshold);
      controls.setControlState('left', x < -threshold);
      controls.setControlState('right', x > threshold);
    },
    [controls, threshold],
  );

  const handlePointerMove = (clientX: number, clientY: number) => {
    const base = joystickRef.current;
    if (!base) return;

    const rect = boundsRef.current ?? base.getBoundingClientRect();
    boundsRef.current = rect;

    const radius = rect.width / 2;
    if (radius === 0) return;

    const centerX = rect.left + radius;
    const centerY = rect.top + radius;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.min(Math.hypot(deltaX, deltaY), radius);

    const angle = Math.atan2(deltaY, deltaX);
    const clampedX = Math.cos(angle) * distance;
    const clampedY = Math.sin(angle) * distance;

    const normalizedX = clampedX / radius;
    const normalizedY = clampedY / radius;

    setOffset({ x: clampedX, y: clampedY });
    applyVector(normalizedX, normalizedY);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) {
      resetJoystick();
      return;
    }

    const base = joystickRef.current;
    if (!base) return;

    pointerIdRef.current = event.pointerId;
    boundsRef.current = base.getBoundingClientRect();
    base.setPointerCapture(event.pointerId);
    event.preventDefault();
    handlePointerMove(event.clientX, event.clientY);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    handlePointerMove(event.clientX, event.clientY);
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    const base = joystickRef.current;
    if (base) {
      base.releasePointerCapture(event.pointerId);
    }
    event.preventDefault();
    resetJoystick();
  };

  const knobStyle = useMemo(
    () =>
      ({
        '--offset-x': `${offset.x}px`,
        '--offset-y': `${offset.y}px`,
      }) as CSSProperties & { '--offset-x': string; '--offset-y': string },
    [offset],
  );

  return (
    <div className="touch-controls" aria-hidden="true">
      <div
        ref={joystickRef}
        className="touch-controls__joystick"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onPointerLeave={onPointerEnd}
      >
        <div className="touch-controls__ring" />
        <div className="touch-controls__knob" style={knobStyle} />
      </div>
    </div>
  );
};

TouchControls.displayName = 'TouchControls';
