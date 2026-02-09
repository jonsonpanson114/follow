import { useState } from 'react';
import { Home } from './pages/Home';
import { IcebreakerPage } from './features/icebreaker/IcebreakerPage';
import { MirrorPage } from './features/mirror/MirrorPage';
import { ManagerPage } from './features/manager/ManagerPage';
import { SocialitePage } from './features/socialite/SocialitePage';
import type { Mode } from './types';
import './styles/themes.css';
import './styles/animations.css';
import './styles/utilities.css';

function App() {
  const [currentMode, setCurrentMode] = useState<Mode | null>(null);

  const handleModeSelect = (mode: Mode) => {
    setCurrentMode(mode);
  };

  const handleBackToHome = () => {
    setCurrentMode(null);
  };

  if (currentMode) {
    switch (currentMode) {
      case 'manager':
        return <ManagerPage onBack={handleBackToHome} />;
      case 'icebreaker':
        return <IcebreakerPage onBack={handleBackToHome} />;
      case 'socialite':
        return <SocialitePage onBack={handleBackToHome} />;
      case 'mirror':
        return <MirrorPage onBack={handleBackToHome} />;
    }
  }

  return <Home onModeSelect={handleModeSelect} />;
}

export default App;
