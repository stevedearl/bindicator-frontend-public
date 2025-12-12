import { motion, useAnimation } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import BlueBinIcon from './icons/BlueBinIcon.jsx';
import GreenBinIcon from './icons/GreenBinIcon.jsx';
import BlackBinIcon from './icons/BlackBinIcon.jsx';
import useBinAnimations from '../hooks/useBinAnimations.js';

const GLANCE_TTL_MS = 1400;
const glanceRegistry = new Map();

const makeGlanceKey = (groupId, laneId, position) => `${groupId}:${laneId}:${position}`;
const randomFrom = (options = []) => options[Math.floor(Math.random() * options.length)] ?? 'center';

function registerGlance(detail) {
  const key = makeGlanceKey(detail.groupId, detail.laneId, detail.position);
  const payload = { ...detail, key };
  glanceRegistry.set(key, payload);
  setTimeout(() => {
    const current = glanceRegistry.get(key);
    if (current && current.timestamp === detail.timestamp) {
      glanceRegistry.delete(key);
    }
  }, GLANCE_TTL_MS);
  return payload;
}

function findPairTargets(detail) {
  const targets = [];
  const now = Date.now();

  const oppositeHorizontal = detail.horizontal === 'left' ? 'right' : detail.horizontal === 'right' ? 'left' : null;
  if (oppositeHorizontal) {
    const neighborPos = detail.horizontal === 'left' ? detail.position - 1 : detail.position + 1;
    const neighborKey = makeGlanceKey(detail.groupId, detail.laneId, neighborPos);
    const neighbor = glanceRegistry.get(neighborKey);
    if (neighbor && neighbor.horizontal === oppositeHorizontal && now - neighbor.timestamp < 900) {
      targets.push({ key: neighbor.key, laneId: neighbor.laneId, position: neighbor.position });
    }
  }

  if (detail.vertical === 'up' || detail.vertical === 'down') {
    const expected = detail.vertical === 'up' ? 'down' : 'up';
    for (const entry of glanceRegistry.values()) {
      if (
        entry.groupId === detail.groupId &&
        entry.position === detail.position &&
        entry.laneId !== detail.laneId &&
        entry.vertical === expected &&
        now - entry.timestamp < 900
      ) {
        targets.push({ key: entry.key, laneId: entry.laneId, position: entry.position });
      }
    }
  }

  return targets;
}

const iconMap = {
  blue: BlueBinIcon,
  green: GreenBinIcon,
  black: BlackBinIcon,
};

const colorMap = {
  blue: {
    ring: 'ring-blue-300',
    text: 'text-blue-700 dark:text-blue-300',
    alt: 'Blue recycling bin',
    arm: '#1c2f4d',
    hand: '#1d4ed8',
  },
  green: {
    ring: 'ring-green-300',
    text: 'text-green-700 dark:text-green-300',
    alt: 'Green garden bin',
    arm: '#1c3a24',
    hand: '#15803d',
  },
  black: {
    ring: 'ring-gray-400',
    text: 'text-gray-800 dark:text-gray-300',
    alt: 'Black rubbish bin',
    arm: '#1f1f24',
    hand: '#1f1f24',
  },
};

const LEFT_EYE = { x: 188, y: 188 };
const RIGHT_EYE = { x: 338, y: 188 };

// Hand positioning - positioned from bin's right side, middle height
const HAND_BASE = { x: 420, y: 350 };

export default function BinCard({
  color,
  compact = false,
  active = false,
  glanceBias = 'both',
  groupId = 'default-group',
  laneId = 'lane-default',
  position = 0,
  verticalBias = 'straight',
}) {
  const {
    ring,
    text,
    alt,
    arm: armColor = colorMap.black.arm,
    hand: handColor = armColor,
  } = colorMap[color] || colorMap.black;
  const Icon = iconMap[color] || BlackBinIcon;
  const frameSize = compact ? 'w-20 h-20 md:w-24 md:h-24' : 'w-24 h-24 md:w-28 md:h-28';
  const imgSize = compact ? 'h-16 md:h-20' : 'h-20 md:h-24';
  const maxW = compact ? 'max-w-[6.5rem]' : 'max-w-[7.5rem]';

  const { eyesTick, waveTick } = useBinAnimations({ active });
  const [pupilShift, setPupilShift] = useState({ x: 0, y: 0 });
  const [showHand, setShowHand] = useState(false);
  const handControls = useAnimation();
  const wavingRef = useRef(false);
  const identityKey = useMemo(() => makeGlanceKey(groupId, laneId, position), [groupId, laneId, position]);
  const horizontalDirections = useMemo(() => {
    switch (glanceBias) {
      case 'left':
        return ['left', 'left', 'center', 'left', 'center'];
      case 'right':
        return ['right', 'right', 'center', 'right', 'center'];
      case 'straight':
        return ['center'];
      default:
        return ['center', 'left', 'right', 'center', 'left', 'right'];
    }
  }, [glanceBias]);

  const verticalDirections = useMemo(() => {
    switch (verticalBias) {
      case 'down':
        return ['center', 'down', 'center', 'down'];
      case 'up':
        return ['center', 'up', 'center', 'up'];
      default:
        return ['center', 'center', 'down', 'up', 'center'];
    }
  }, [verticalBias]);

  const triggerWave = useCallback(() => {
    if (wavingRef.current) return;
    wavingRef.current = true;
    setShowHand(true);

    const startAnimation = () =>
      handControls
        .start({
          rotate: [0, 18, -12, 16, -6, 0],
          opacity: [0, 1, 1, 1, 0],
          transition: { duration: 1.6, ease: 'easeInOut' },
        })
        .finally(() => {
          setShowHand(false);
          wavingRef.current = false;
        });

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => startAnimation());
    } else {
      startAnimation();
    }
  }, [handControls]);

  useEffect(() => {
    const glanceProbability = active ? 0.55 : 0.35;
    const shouldGlance = Math.random() < glanceProbability;
    const horizontalPool = horizontalDirections.filter((dir) => dir !== 'center');
    const verticalPool = verticalDirections.filter((dir) => dir !== 'center');

    const horizontalDir = shouldGlance ? randomFrom(horizontalPool.length ? horizontalPool : ['center']) : 'center';
    const verticalDir =
      shouldGlance && Math.random() < 0.45
        ? randomFrom(verticalPool.length ? verticalPool : ['center'])
        : 'center';

    const x =
      horizontalDir === 'left'
        ? -(26 + Math.random() * 6)
        : horizontalDir === 'right'
          ? 26 + Math.random() * 6
          : Math.random() * 1.2 - 0.6;
    const y =
      verticalDir === 'up'
        ? -(12 + Math.random() * 3)
        : verticalDir === 'down'
          ? 12 + Math.random() * 3
          : Math.random() * 0.8 - 0.4;

    setPupilShift({ x, y });

    if (horizontalDir === 'center' && verticalDir === 'center') {
      return;
    }

    const timestamp = Date.now();
    const glanceDetail = {
      groupId,
      laneId,
      position,
      horizontal: horizontalDir,
      vertical: verticalDir,
      timestamp,
    };

    const pairTargets = findPairTargets(glanceDetail);
    registerGlance(glanceDetail);

    window.dispatchEvent(new CustomEvent('bindicator-bin-glance', { detail: glanceDetail }));

    if (pairTargets.length) {
      const targetKeys = new Set([identityKey, ...pairTargets.map((target) => target.key)]);
      window.dispatchEvent(
        new CustomEvent('bindicator-bin-wave', { detail: { groupId, targets: Array.from(targetKeys) } }),
      );
    }
  }, [active, groupId, horizontalDirections, identityKey, laneId, position, verticalDirections, eyesTick]);

  useEffect(() => {
    triggerWave();
  }, [waveTick, triggerWave]);

  useEffect(() => {
    const glanceHandler = (event) => {
      const detail = event.detail || {};
      if (detail.groupId !== groupId) return;

      const sameLane = detail.laneId === laneId;
      const nextToEachOther = Math.abs(detail.position - position) === 1;
      const horizontalWave =
        sameLane &&
        nextToEachOther &&
        detail.horizontal &&
        detail.horizontal !== 'center' &&
        ((detail.position < position && detail.horizontal === 'right') ||
          (detail.position > position && detail.horizontal === 'left'));

      const verticalWave =
        detail.position === position &&
        detail.laneId !== laneId &&
        detail.vertical &&
        detail.vertical !== 'center' &&
        ((detail.vertical === 'down' && verticalBias === 'up') ||
          (detail.vertical === 'up' && verticalBias === 'down'));

      if (horizontalWave || verticalWave) {
        triggerWave();
      }
    };

    const waveHandler = (event) => {
      const detail = event.detail || {};
      if (detail.groupId !== groupId) return;
      if (!Array.isArray(detail.targets)) return;
      if (detail.targets.includes(identityKey)) {
        triggerWave();
      }
    };

    window.addEventListener('bindicator-bin-glance', glanceHandler);
    window.addEventListener('bindicator-bin-wave', waveHandler);
    return () => {
      window.removeEventListener('bindicator-bin-glance', glanceHandler);
      window.removeEventListener('bindicator-bin-wave', waveHandler);
    };
  }, [groupId, identityKey, laneId, position, triggerWave, verticalBias]);
  
  // Calculate hand scale and position based on compact mode
  const handScale = compact ? 0.7 : 0.85;
  const handX = HAND_BASE.x;
  const handY = HAND_BASE.y;

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
      initial={{ opacity: 0, scale: 0.95, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`flex flex-col items-center flex-none ${maxW}`}
      role="group"
      aria-label={alt}
    >
      <div
        className={`relative rounded-xl bg-white dark:bg-[#0f1a2e] ring-2 ${ring} ring-offset-2 ring-offset-white dark:ring-offset-[#0f172a] shadow-sm ${frameSize} grid place-items-center overflow-visible transition-transform`}
        style={{ willChange: 'transform' }}
      >
        <Icon className={`${imgSize} w-auto`} />

        {/* SVG overlay for eyes/hand so scaling matches bin asset */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 526 768" preserveAspectRatio="xMidYMid meet">

          {/* Eyes */}
          <g>
            <circle cx={LEFT_EYE.x} cy={LEFT_EYE.y} r="58" fill="#fff" stroke="#0f172a" strokeWidth="8" />
            <circle cx={RIGHT_EYE.x} cy={RIGHT_EYE.y} r="58" fill="#fff" stroke="#0f172a" strokeWidth="8" />
            <motion.circle
              r="24"
              fill="#111"
              animate={{ cx: LEFT_EYE.x + pupilShift.x, cy: LEFT_EYE.y + pupilShift.y }}
              transition={{ type: 'spring', damping: 12, stiffness: 90 }}
            />
            <motion.circle
              r="24"
              fill="#111"
              animate={{ cx: RIGHT_EYE.x + pupilShift.x * 0.95, cy: RIGHT_EYE.y + pupilShift.y * 0.92 }}
              transition={{ type: 'spring', damping: 12, stiffness: 90 }}
            />
          </g>

          {/* Waving hand - positioned from right side of bin, middle height */}
          {showHand && (
            <motion.g
              initial={{ opacity: 0, rotate: 0 }}
              animate={handControls}
              style={{ transformOrigin: '0 0' }}
              transform={`translate(${handX} ${handY}) scale(${handScale})`}
            >
              {/* Arm connection point */}
              <circle cx="0" cy="0" r="14" fill={armColor} />
              
              {/* Arm */}
              <path 
                d="M0 0 Q18 -8 36 -10 T70 -8" 
                stroke={armColor} 
                strokeWidth="18" 
                strokeLinecap="round" 
                fill="none" 
              />
              
              {/* Hand palm */}
              <path
                d="M72 -8 Q95 -14 110 2 L112 52 Q113 68 102 75 L78 67 Q63 61 62 46 Z"
                fill={handColor}
                stroke={armColor}
                strokeWidth="3"
                strokeLinejoin="round"
              />
              
              {/* Fingers */}
              <path d="M78 -4 L82 -36" stroke={handColor} strokeWidth="9" strokeLinecap="round" />
              <path d="M90 -3 L95 -35" stroke={handColor} strokeWidth="9" strokeLinecap="round" />
              <path d="M103 1 L110 -27" stroke={handColor} strokeWidth="8" strokeLinecap="round" />
              <path d="M116 9 L124 -8" stroke={handColor} strokeWidth="7" strokeLinecap="round" />
              
              {/* Highlight on palm */}
              <path 
                d="M74 48 Q92 58 108 50" 
                stroke="rgba(255,255,255,0.25)" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />
            </motion.g>
          )}
        </svg>

      </div>
      <span className={`text-sm font-semibold mt-2 capitalize ${text}`}>{color}</span>
    </motion.div>
  );
}