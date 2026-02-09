import { useState, useEffect } from 'react';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { generateScenario, evaluateQuestion } from '../../services/prompts/icebreaker';
import { loadProgress, recordSession } from '../../services/progress';
import type { Scenario, IcebreakerEvaluation, IcebreakerStateType } from '../../types';
import { IcebreakerState } from '../../types';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import './IcebreakerPage.css';

interface IcebreakerPageProps {
  onBack: () => void;
}

export const IcebreakerPage: React.FC<IcebreakerPageProps> = ({ onBack }) => {
  const [state, setState] = useState<IcebreakerStateType>(IcebreakerState.IDLE);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [userQuestion, setUserQuestion] = useState('');
  const [evaluation, setEvaluation] = useState<IcebreakerEvaluation | null>(null);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    loadNewScenario();
  }, []);

  const loadNewScenario = async () => {
    setState(IcebreakerState.LOADING_SCENARIO);
    setEvaluation(null);
    setUserQuestion('');

    try {
      const newScenario = await generateScenario();
      setScenario(newScenario);
      setState(IcebreakerState.WAITING_FOR_INPUT);
    } catch (error) {
      console.error('Error loading scenario:', error);
      setState(IcebreakerState.IDLE);
    }
  };

  const handleSubmit = async () => {
    if (!userQuestion.trim() || !scenario) return;

    setState(IcebreakerState.EVALUATING);

    try {
      const result = await evaluateQuestion(scenario, userQuestion);
      setEvaluation(result);
      setSessionCount(prev => prev + 1);

      // Record progress (score is 1-5, convert to 0-100 scale)
      const progress = loadProgress();
      recordSession(progress, 'icebreaker', result.score * 20);

      setState(IcebreakerState.SHOWING_FEEDBACK);
    } catch (error) {
      console.error('Error evaluating question:', error);
      setState(IcebreakerState.WAITING_FOR_INPUT);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const renderScore = (score: number) => {
    const stars = '★'.repeat(score) + '☆'.repeat(5 - score);
    return <span className="score-stars">{stars}</span>;
  };

  return (
    <MobileLayout>
      <div className="icebreaker-page fade-in">
        {/* Header */}
        <header className="icebreaker-header">
          <Button variant="secondary" onClick={onBack} className="back-button">
            <ArrowLeft size={20} />
            戻る
          </Button>
          <div className="header-info">
            <h1 className="page-title">アイスブレイカー</h1>
            <p className="page-subtitle">瞬発力と適応力</p>
            <div className="session-count">セッション: {sessionCount}</div>
          </div>
        </header>

        {/* Loading State */}
        {state === IcebreakerState.LOADING_SCENARIO && (
          <Card size="lg" className="loading-card">
            <div className="loading-content">
              <Loader2 className="spinner" size={48} />
              <p>シナリオを生成中...</p>
            </div>
          </Card>
        )}

        {/* Scenario Display */}
        {scenario && state !== IcebreakerState.LOADING_SCENARIO && (
          <Card size="lg" className="scenario-card fade-in-up">
            <div className="scenario-header">
              <span className="scenario-badge">{scenario.role}</span>
              <span className="scenario-context">{scenario.context}</span>
            </div>
            <div className="scenario-text">
              「{scenario.text}」
            </div>
          </Card>
        )}

        {/* Input Section */}
        {state === IcebreakerState.WAITING_FOR_INPUT && (
          <Card className="input-card fade-in-up" style={{ animationDelay: '0.1s' }}>
            <label className="input-label">
              フォローアップ質問を入力してください
            </label>
            <textarea
              className="textarea"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="例: それってどういうことですか？ もう少し詳しく聞かせてください。"
              rows={3}
              disabled={state !== IcebreakerState.WAITING_FOR_INPUT}
            />
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!userQuestion.trim() || state !== IcebreakerState.WAITING_FOR_INPUT}
              className="submit-button"
            >
              <Send size={20} />
              評価する
            </Button>
          </Card>
        )}

        {/* Evaluating State */}
        {state === IcebreakerState.EVALUATING && (
          <Card className="loading-card">
            <div className="loading-content">
              <Loader2 className="spinner" size={48} />
              <p>質問を評価中...</p>
            </div>
          </Card>
        )}

        {/* Evaluation Results */}
        {state === IcebreakerState.SHOWING_FEEDBACK && evaluation && (
          <div className="evaluation-section fade-in-up">
            <Card size="lg" className="evaluation-card">
              <h2 className="evaluation-title">評価結果</h2>

              <div className="evaluation-score">
                <span className="score-label">スコア</span>
                <div className="score-value">
                  {renderScore(evaluation.score)}
                  <span className="score-number">{evaluation.score}/5</span>
                </div>
              </div>

              <div className="evaluation-section-item">
                <h3 className="section-title">✓ 良かった点</h3>
                <p className="section-content">{evaluation.goodPoints}</p>
              </div>

              <div className="evaluation-section-item">
                <h3 className="section-title">→ 改善のヒント</h3>
                <p className="section-content">{evaluation.improvementSuggestions}</p>
              </div>

              <div className="evaluation-section-item model-answer">
                <h3 className="section-title">💡 お手本</h3>
                <p className="section-content">{evaluation.exampleQuestion}</p>
              </div>
            </Card>

            <div className="action-buttons">
              <Button variant="gold" onClick={loadNewScenario} className="next-button">
                次のシナリオ
              </Button>
              <Button variant="secondary" onClick={onBack}>
                ホームに戻る
              </Button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};
