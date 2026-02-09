import React, { useEffect, useState } from 'react';
import { loadProgress, updateStreak, type UserProgress } from '../../services/progress';
import type { Mode } from '../../types';
import { Flame } from 'lucide-react';
import './ProgressDashboard.css';

interface ProgressDashboardProps {
  compact?: boolean;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ compact = false }) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    const loaded = loadProgress();
    const updated = updateStreak(loaded);
    setProgress(updated);
  }, []);

  if (!progress) return null;

  if (compact) {
    return (
      <div className="compact-stats">
        <div className="streak-pill">
          <Flame size={16} className={progress.streaks.current >= 3 ? 'flame-glow' : ''} />
          <span>{progress.streaks.current}日連続</span>
        </div>
      </div>
    );
  }

  // Get current week dates
  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="dashboard-container">
      {/* Growth Garden */}
      <div className="garden-section">
        <div className="garden-visual">
          <GrowthTree level={progress.gardenLevel} />
        </div>
        <div className="garden-info">
          <h2 className="garden-title">成長の庭</h2>
          <p className="garden-subtitle">日々の対話</p>
          <div className="garden-level">
            <span>レベル {progress.gardenLevel}</span>
            <div className="level-progress-bar">
              <div
                className="level-progress-fill"
                style={{ width: `${(progress.totalSessions % 10) * 10}%` }}
              />
            </div>
            <span className="level-progress-text">次の段階まであと {(progress.totalSessions % 10) * 10}%</span>
          </div>
        </div>
      </div>

      {/* Streak Calendar */}
      <div className="streak-section">
        <div className="calendar-grid">
          {dayNames.map((day, i) => (
            <div key={`header-${i}`} className="calendar-header">{day}</div>
          ))}
          {weekDates.map((date) => {
            const dateStr = date.toISOString().split('T')[0];
            const isToday = dateStr === today;
            const isPast = date < new Date(today);
            const isActive = isPast || isToday; // Simplified - would need actual tracking

            return (
              <div
                key={dateStr}
                className={`calendar-day ${isToday ? 'today' : ''} ${isActive ? 'active' : ''}`}
              >
                <span className="day-number">{date.getDate()}</span>
                {isActive && <div className="day-glow" />}
              </div>
            );
          })}
        </div>
        <div className="streak-info">
          <div className="streak-count-row">
            <Flame size={24} className="flame-glow" />
            <span>現在の継続日数: <strong>{progress.streaks.current} 日</strong></span>
          </div>
          <span className="streak-message">この調子で続けていきましょう。</span>
        </div>
      </div>

      {/* Mode Progress Cards */}
      <div className="modes-section">
        <h3 className="section-title">記録</h3>
        {(Object.entries(progress.modes) as [Mode, typeof progress.modes.manager][]).map(([mode, data]) => (
          <ModeCard key={mode} mode={mode} data={data} />
        ))}
      </div>

      {/* Badges */}
      {progress.badges.length > 0 && (
        <div className="badges-section">
          <h3 className="section-title">獲得した実績</h3>
          <div className="badges-scroll">
            {progress.badges.map((badge) => (
              <div key={badge.id} className="badge-card">
                <span className="badge-icon">{badge.icon}</span>
                <span className="badge-name">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Growth Tree Component
// Growth Tree Component with Fractal Logic
const GrowthTree: React.FC<{ level: number }> = ({ level }) => {
  // Config for fractal generation
  const maxDepth = Math.min(Math.floor(level / 2) + 2, 6);
  const startLength = 40;
  const startStroke = 4;

  // Recursive function to generate branches
  const generateBranches = (
    x: number,
    y: number,
    length: number,
    angle: number,
    depth: number,
    branchIndex: number
  ): React.ReactNode[] => {
    if (depth === 0) return [];

    const endX = x + length * Math.cos((angle * Math.PI) / 180);
    const endY = y + length * Math.sin((angle * Math.PI) / 180);

    // Calculate control point for curve (Quadratic Bezier)
    // Add some organic randomness based on depth/index
    const curveOffset = (depth % 2 === 0 ? 10 : -10) * (depth / maxDepth);
    const cpX = (x + endX) / 2 + curveOffset * Math.cos(((angle + 90) * Math.PI) / 180);
    const cpY = (y + endY) / 2 + curveOffset * Math.sin(((angle + 90) * Math.PI) / 180);

    const elements: React.ReactNode[] = [];

    // Draw Branch
    elements.push(
      <path
        key={`b-${depth}-${branchIndex}-${x}-${y}`}
        d={`M${x} ${y} Q${cpX} ${cpY} ${endX} ${endY}`}
        stroke="url(#treeGradient)"
        strokeWidth={Math.max(startStroke * (depth / maxDepth), 1)}
        fill="none"
        filter="url(#glow)"
        className="fractal-branch"
        style={{
          opacity: 0.4 + (depth / maxDepth) * 0.6,
          strokeLinecap: 'round',
          animationDelay: `${(maxDepth - depth) * 0.2}s`
        }}
      />
    );

    // Add leaf/bloom at tip if it's a terminal branch or randomly
    if (depth <= 2 || Math.random() > 0.6) {
      elements.push(
        <circle
          key={`l-${depth}-${branchIndex}-${x}-${y}`}
          cx={endX}
          cy={endY}
          r={depth <= 2 ? 3 : 2}
          fill="url(#treeGradient)"
          className="fractal-leaf"
          style={{ animationDelay: `${(maxDepth - depth + 1) * 0.2}s` }}
        />
      );
    }

    // Recursive calls for left and right branches
    // Reduce length and change angle for next iteration
    const newLength = length * 0.75;
    const spreadAngle = 25 + Math.random() * 10; // slightly random spread

    elements.push(...generateBranches(endX, endY, newLength, angle - spreadAngle, depth - 1, branchIndex * 2));
    elements.push(...generateBranches(endX, endY, newLength, angle + spreadAngle, depth - 1, branchIndex * 2 + 1));

    return elements;
  };

  const branches = generateBranches(100, 180, startLength, -90, maxDepth, 0);

  // Particle effects
  const particles = Array.from({ length: 12 }).map((_, i) => (
    <circle
      key={`p-${i}`}
      cx={100 + (Math.random() - 0.5) * 120}
      cy={100 + (Math.random() - 0.5) * 120}
      r={Math.random() * 2}
      fill="#fff"
      className="floating-particle"
      style={{
        animationDuration: `${3 + Math.random() * 4}s`,
        animationDelay: `${Math.random() * 2}s`
      }}
    />
  ));

  return (
    <svg viewBox="0 0 200 200" className="tree-svg">
      <defs>
        <linearGradient id="treeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#64ffda" />
          <stop offset="50%" stopColor="#7c4dff" />
          <stop offset="100%" stopColor="#ff4081" />
        </linearGradient>
        <filter id="glow" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow orb */}
      <circle
        cx="100"
        cy="120"
        r="60"
        fill="url(#treeGradient)"
        opacity={0.08}
        filter="url(#glow)"
        className="pulse-glow"
      />

      {branches}
      {particles}
    </svg>
  );
};

// Mode Card Component
const ModeCard: React.FC<{
  mode: Mode;
  data: { level: number; xp: number; sessionsCompleted: number; bestScore: number };
}> = ({ mode, data }) => {
  const modeInfo: Record<Mode, { name: string; color: string }> = {
    manager: { name: 'マネージャー', color: '#667eea' },
    icebreaker: { name: 'アイスブレイカー', color: '#f6ad55' },
    socialite: { name: 'ソーシャライト', color: '#ed64a6' },
    mirror: { name: 'ミラー', color: '#48bb78' },
  };

  const info = modeInfo[mode];
  const progressPercent = (data.xp / 100) * 100;

  return (
    <div className="mode-card-dashboard">
      <div className="mode-card-left">
        <span className="mode-level-badge" style={{ background: info.color }}>
          レベル {data.level}
        </span>
        <h4 className="mode-card-title">{info.name}</h4>
        <p className="mode-card-subtitle">対話の質を高め、新たな自分へ</p>
        <span className="mode-card-link">レベル {data.level * 10} &gt;</span>
      </div>
      <div className="mode-card-right">
        <div className="circular-progress" style={{ '--progress-color': info.color } as React.CSSProperties}>
          <svg viewBox="0 0 100 100">
            <circle className="progress-bg" cx="50" cy="50" r="40" />
            <circle
              className="progress-fill"
              cx="50"
              cy="50"
              r="40"
              style={{
                strokeDasharray: `${progressPercent * 2.51} 251`,
                stroke: info.color,
              }}
            />
          </svg>
          <div className="progress-text">
            <span className="progress-value">{data.xp}</span>
            <span className="progress-label">進捗</span>
          </div>
        </div>
      </div>
    </div>
  );
};
