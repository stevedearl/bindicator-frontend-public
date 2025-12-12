import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import BlueBinIcon from './icons/BlueBinIcon.jsx';
import GreenBinIcon from './icons/GreenBinIcon.jsx';
import BlackBinIcon from './icons/BlackBinIcon.jsx';
import useBinAnimations from '../hooks/useBinAnimations.js';

const GLANCE_TTL_MS = 1400;
const glanceRegistry = new Map();

const makeGlanceKey = (groupId, laneId, position) => `${groupId}:${laneId}:${position}`;
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
    eyelid: '#1f4ed8',
  },
  green: {
    ring: 'ring-green-300',
    text: 'text-green-700 dark:text-green-300',
    alt: 'Green garden bin',
    eyelid: '#1f7a44',
  },
  black: {
    ring: 'ring-gray-400',
    text: 'text-gray-800 dark:text-gray-300',
    alt: 'Black rubbish bin',
    eyelid: '#1f1f24',
  },
};

const LEFT_EYE = { x: 188, y: 188 };
const RIGHT_EYE = { x: 338, y: 188 };
const EYE_RADIUS = 58;
const EYE_TOP = LEFT_EYE.y - EYE_RADIUS;
const EYELID_HEIGHT = EYE_RADIUS * 2;

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
    eyelid: eyelidColor = '#1f1f24',
  } = colorMap[color] || colorMap.black;
  const Icon = iconMap[color] || BlackBinIcon;
  const frameSize = compact ? 'w-20 h-20 md:w-24 md:h-24' : 'w-24 h-24 md:w-28 md:h-28';
  const imgSize = compact ? 'h-16 md:h-20' : 'h-20 md:h-24';
  const maxW = compact ? 'max-w-[6.5rem]' : 'max-w-[7.5rem]';

  const { eyesTick } = useBinAnimations({ active });
  const [pupilShift, setPupilShift] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const glanceTimeoutRef = useRef();
  const blinkTimeoutRef = useRef();
  const doubleBlinkTimeoutRef = useRef();
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

  useEffect(() => {
    const horizontalPool = horizontalDirections.filter((dir) => dir !== 'center');
    const verticalPool = verticalDirections.filter((dir) => dir !== 'center');
    const hasHorizontal = horizontalPool.length > 0;
    const hasVertical = verticalPool.length > 0;

    const chooseFrom = (pool, fallback = 'center') =>
      pool.length ? pool[Math.floor(Math.random() * pool.length)] : fallback;

    let horizontalDir = 'center';
    if (hasHorizontal && Math.random() < (active ? 0.6 : 0.45)) {
      horizontalDir = chooseFrom(horizontalPool);
    }

    let verticalDir = 'center';
    if (hasVertical && Math.random() < (active ? 0.4 : 0.3)) {
      verticalDir = chooseFrom(verticalPool);
    }

    if (verticalDir === 'center' && hasVertical && (horizontalDir !== 'center' ? Math.random() < 0.35 : true)) {
      verticalDir = chooseFrom(verticalPool);
    }

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

    if (glanceTimeoutRef.current) {
      clearTimeout(glanceTimeoutRef.current);
    }
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

    glanceTimeoutRef.current = setTimeout(() => {
      setPupilShift({ x: 0, y: 0 });
    }, 1500 + Math.random() * 1200);

    window.dispatchEvent(new CustomEvent('bindicator-bin-glance', { detail: glanceDetail }));

    if (pairTargets.length) {
      const targetKeys = new Set([identityKey, ...pairTargets.map((target) => target.key)]);
      window.dispatchEvent(
        new CustomEvent('bindicator-bin-wave', { detail: { groupId, targets: Array.from(targetKeys) } }),
      );
    }
  }, [active, groupId, horizontalDirections, identityKey, laneId, position, verticalDirections, eyesTick]);

  useEffect(() => () => glanceTimeoutRef.current && clearTimeout(glanceTimeoutRef.current), []);

  useEffect(() => {
    let cancelled = false;

    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        if (!cancelled) {
          setIsBlinking(false);
        }
      }, 200);
    };

    const scheduleBlink = () => {
      const delay = 3000 + Math.random() * 4000;
      blinkTimeoutRef.current = setTimeout(() => {
        if (cancelled) return;
        triggerBlink();
        if (Math.random() < 0.12) {
          doubleBlinkTimeoutRef.current = setTimeout(() => {
            if (!cancelled) triggerBlink();
          }, 280);
        }
        if (!cancelled) scheduleBlink();
      }, delay);
    };

    scheduleBlink();

    return () => {
      cancelled = true;
      clearTimeout(blinkTimeoutRef.current);
      clearTimeout(doubleBlinkTimeoutRef.current);
    };
  }, []);

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
      initial={{ opacity: 0, scale: 0.95, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`bin-card flex flex-col items-center flex-none ${maxW}`}
      role="group"
      aria-label={alt}
    >
      <div
      className={`relative rounded-xl bg-white dark:bg-[#0f1a2e] ring-2 ${ring} ring-offset-2 ring-offset-white dark:ring-offset-[#0f172a] shadow-sm ${frameSize} grid place-items-center overflow-visible transition-transform`}
      style={{ willChange: 'transform' }}
    >
        <Icon className={`${imgSize} w-auto bin-image`} />

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

          <motion.rect
            x={LEFT_EYE.x - EYE_RADIUS}
            y={EYE_TOP}
            width={EYE_RADIUS * 2}
            height={EYELID_HEIGHT}
            rx={EYE_RADIUS}
            fill={eyelidColor}
            style={{ originY: 0 }}
            animate={{ scaleY: isBlinking ? 1 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          />
          <motion.rect
            x={RIGHT_EYE.x - EYE_RADIUS}
            y={EYE_TOP}
            width={EYE_RADIUS * 2}
            height={EYELID_HEIGHT}
            rx={EYE_RADIUS}
            fill={eyelidColor}
            style={{ originY: 0 }}
            animate={{ scaleY: isBlinking ? 1 : 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          />

        </svg>

      </div>
      <span className={`text-sm font-semibold mt-2 capitalize ${text} bin-label`}>{color}</span>
    </motion.div>
  );
}
