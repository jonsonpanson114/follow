import { MobileLayout } from '../components/layout/MobileLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import './ModePlaceholder.css';

interface ModePlaceholderProps {
  mode: string;
  title: string;
  onBack: () => void;
}

export const ModePlaceholder: React.FC<ModePlaceholderProps> = ({ mode, title, onBack }) => {
  return (
    <MobileLayout>
      <div className="mode-placeholder fade-in">
        <Card size="lg">
          <h2 className="mode-placeholder-title">{title}</h2>
          <p className="mode-placeholder-text">
            Mode: <strong>{mode}</strong>
          </p>
          <p className="mode-placeholder-text">
            このモードは現在実装中です。
          </p>
          <Button onClick={onBack} variant="secondary" className="mode-placeholder-btn">
            ホームに戻る
          </Button>
        </Card>
      </div>
    </MobileLayout>
  );
};
