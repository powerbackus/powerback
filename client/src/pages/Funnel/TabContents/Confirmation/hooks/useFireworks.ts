/**
 * Triggers confetti when user lands on Confirmation tab; resets when they leave.
 * Resets trigger ref in cleanup so confetti runs under React Strict Mode.
 *
 * @module Confirmation/hooks/useFireworks
 */

import { useRef, useEffect } from 'react';
import { ALERT_TIMEOUT } from '@CONSTANTS';
import { useNavigation } from '@Contexts';
import confetti from 'canvas-confetti';

export default function useFireworks(): void {
  const { funnel: currentTab } = useNavigation();

  const confettiIntervalRef = useRef<NodeJS.Timeout | null>(null),
    confettiTimeoutRef = useRef<NodeJS.Timeout | null>(null),
    confettiTriggered = useRef<string | null>(null);

  useEffect(() => {
    if (currentTab !== 'confirmation') {
      return;
    }
    if (confettiTriggered.current === 'confirmation') {
      return;
    }
    confettiTriggered.current = 'confirmation';

    confettiTimeoutRef.current = setTimeout(() => {
      const duration = ALERT_TIMEOUT.celebrate;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 10000,
        colors: ['#FF0000', '#FFFFFF', '#0000FF'],
      };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      confetti({
        ...defaults,
        particleCount: 100,
        origin: { x: 0.5, y: 0.3 },
      });

      confettiIntervalRef.current = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          if (confettiIntervalRef.current) {
            clearInterval(confettiIntervalRef.current);
            confettiIntervalRef.current = null;
          }
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    }, 100);

    return () => {
      confettiTriggered.current = null;
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
        confettiTimeoutRef.current = null;
      }
      if (confettiIntervalRef.current) {
        clearInterval(confettiIntervalRef.current);
        confettiIntervalRef.current = null;
      }
    };
  }, [currentTab]);

  useEffect(() => {
    if (
      currentTab !== 'confirmation' &&
      confettiTriggered.current === 'confirmation'
    ) {
      confettiTriggered.current = null;
    }
  }, [currentTab]);
}
