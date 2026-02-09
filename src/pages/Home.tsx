import { useState } from 'react';
import { MobileLayout } from '../components/layout/MobileLayout';
import { Card } from '../components/ui/Card';
import { RippleEffect } from '../components/ui/RippleEffect';
import { ProgressDashboard } from '../components/dashboard/ProgressDashboard';
import type { Mode } from '../types';
import { BarChart3 } from 'lucide-react';
import './Home.css';

interface HomeProps {
  onModeSelect: (mode: Mode) => void;
}

const modes = [
  {
    id: 'manager' as Mode,
    title: 'マネージャー',
    subtitle: '傾聴と信頼構築',
    description: '表面的な言葉の奥にある「本音」を汲み取る訓練',
    icon: '👔',
    gradient: 'linear-gradient(135deg, rgba(26, 35, 126, 0.1), rgba(57, 73, 171, 0.05))',
  },
  {
    id: 'icebreaker' as Mode,
    title: 'アイスブレイカー',
    subtitle: '瞬発力と適応力',
    description: 'TPOに応じた最適な「問い」を放つ訓練',
    icon: '☕',
    gradient: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(201, 162, 39, 0.05))',
  },
  {
    id: 'socialite' as Mode,
    title: 'ソーシャライト',
    subtitle: '柔軟な対話訓練',
    description: '未知の文脈でキャラクターを演じ切る相手との対話',
    icon: '🎭',
    gradient: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1), rgba(123, 31, 162, 0.05))',
  },
  {
    id: 'mirror' as Mode,
    title: 'ミラー',
    subtitle: '質問力の徹底強化',
    description: '1往復ごとの即応フィードバックによる千本ノック',
    icon: '💭',
    gradient: 'linear-gradient(135deg, rgba(0, 150, 136, 0.1), rgba(0, 121, 107, 0.05))',
  },
];

export const Home: React.FC<HomeProps> = ({ onModeSelect }) => {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <MobileLayout>
      <div className="home fade-in">
        <header className="home-header">
          <div className="header-top">
            <div>
              <h1 className="home-title">Ripple</h1>
              <p className="home-subtitle">波紋</p>
            </div>
            <button
              className="dashboard-toggle"
              onClick={() => setShowDashboard(!showDashboard)}
              aria-label="Toggle dashboard"
            >
              <BarChart3 size={24} />
            </button>
          </div>
          {!showDashboard && (
            <p className="home-description">
              問いを立てる力と対話力を、
              <br />
              水面が波紋を広げるように静かに、
              <br />
              しかし確実に拡張する
            </p>
          )}
          {/* Compact stats when not showing full dashboard */}
          {!showDashboard && <ProgressDashboard compact />}
        </header>

        {/* Full Dashboard */}
        {showDashboard && <ProgressDashboard />}

        <div className="modes-grid">
          {modes.map((mode, index) => (
            <RippleEffect
              key={mode.id}
              onClick={() => onModeSelect(mode.id)}
            >
              <Card className="mode-card fade-in-up" style={{
                animationDelay: `${index * 0.1}s`,
                background: mode.gradient,
              }}>
                <div className="mode-icon">{mode.icon}</div>
                <h2 className="mode-title">{mode.title}</h2>
                <p className="mode-subtitle">{mode.subtitle}</p>
                <p className="mode-description">{mode.description}</p>
              </Card>
            </RippleEffect>
          ))}
        </div>

        <footer className="home-footer">
          <p className="home-quote">
            「準備は整った。あとは、あなたがこの水面に指を触れるだけだ。」
          </p>
        </footer>
      </div>
    </MobileLayout>
  );
};
