import { useState, useEffect, useRef } from 'react';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { generateScenario, sendChatMessage, generateFeedback } from '../../services/prompts/socialite';
import { loadProgress, recordSession } from '../../services/progress';
import type { SocialiteScenario, SocialiteMessage, SocialiteFeedback, SocialiteStatus } from '../../types';
import { ArrowLeft, Loader2, Send, Users, Award, RefreshCw, MapPin, User } from 'lucide-react';
import './SocialitePage.css';

interface SocialitePageProps {
  onBack: () => void;
}

export const SocialitePage: React.FC<SocialitePageProps> = ({ onBack }) => {
  const [status, setStatus] = useState<SocialiteStatus>('idle');
  const [scenario, setScenario] = useState<SocialiteScenario | null>(null);
  const [messages, setMessages] = useState<SocialiteMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<SocialiteFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startNewScenario();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewScenario = async () => {
    setStatus('generating_scenario');
    setMessages([]);
    setFeedback(null);
    setIsLoading(true);

    try {
      const newScenario = await generateScenario();
      setScenario(newScenario);

      // Add the first message from the character
      setMessages([{
        id: Date.now().toString(),
        role: 'model',
        text: newScenario.firstMessage,
        timestamp: Date.now()
      }]);

      setStatus('active');
    } catch (error) {
      console.error('Error generating scenario:', error);
      setStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !scenario || isLoading) return;

    const newMessage: SocialiteMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userInput,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(scenario, messages, userInput);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndSession = async () => {
    if (!scenario || messages.length < 3) return;

    setStatus('analyzing');
    setIsLoading(true);

    try {
      const result = await generateFeedback(scenario, messages);
      setFeedback(result);

      // Record progress
      const progress = loadProgress();
      recordSession(progress, 'socialite', result.score);

      setStatus('feedback');
    } catch (error) {
      console.error('Error generating feedback:', error);
      setStatus('active');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--error)';
  };

  return (
    <MobileLayout>
      <div className="socialite-page fade-in">
        {/* Header */}
        <header className="socialite-header">
          <Button variant="secondary" onClick={onBack} className="back-button">
            <ArrowLeft size={20} />
            戻る
          </Button>
          <div className="header-info">
            <h1 className="page-title">ソーシャライト</h1>
            <p className="page-subtitle">関係性の構築力</p>
          </div>
        </header>

        {/* Loading State */}
        {status === 'generating_scenario' && (
          <Card size="lg" className="loading-card">
            <div className="loading-content">
              <Loader2 className="spinner" size={48} />
              <p>シナリオを生成中...</p>
            </div>
          </Card>
        )}

        {/* Scenario Info */}
        {scenario && status !== 'generating_scenario' && status !== 'feedback' && (
          <Card className="scenario-info-card fade-in-up">
            <div className="scenario-badges">
              <span className="badge">
                <User size={14} />
                {scenario.gender} / {scenario.personality}
              </span>
              <span className="badge">
                <Users size={14} />
                {scenario.relationship}
              </span>
              <span className="badge">
                <MapPin size={14} />
                {scenario.place}
              </span>
            </div>
            <p className="contact-info">{scenario.contactCount}</p>
          </Card>
        )}

        {/* Chat Area */}
        {(status === 'active' || status === 'analyzing') && (
          <div className="chat-container fade-in-up">
            <div className="messages-area">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role === 'user' ? 'user' : 'model'}`}>
                  <div className="message-bubble">
                    <p className="message-content">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message model">
                  <div className="message-bubble typing">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {status === 'active' && (
              <div className="input-area">
                <textarea
                  className="chat-input"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="会話を続けてください..."
                  rows={2}
                  disabled={isLoading}
                />
                <div className="input-actions">
                  <Button
                    variant="secondary"
                    onClick={handleEndSession}
                    disabled={isLoading || messages.length < 4}
                  >
                    <Award size={18} />
                    評価する
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || isLoading}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            )}

            {status === 'analyzing' && (
              <div className="analyzing-overlay">
                <Loader2 className="spinner" size={32} />
                <p>会話を分析中...</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback Section */}
        {status === 'feedback' && feedback && (
          <div className="feedback-section fade-in-up">
            <Card size="lg" className="feedback-card">
              <h2 className="feedback-title">
                <Award size={24} />
                会話評価
              </h2>

              <div className="feedback-score" style={{ borderColor: getScoreColor(feedback.score) }}>
                <span className="score-label">スコア</span>
                <span className="score-value" style={{ color: getScoreColor(feedback.score) }}>
                  {feedback.score}/100
                </span>
              </div>

              <div className="feedback-item good">
                <h3>良かった点</h3>
                <p>{feedback.pros}</p>
              </div>

              <div className="feedback-item improve">
                <h3>改善点</h3>
                <p>{feedback.cons}</p>
              </div>

              <div className="feedback-item next">
                <h3>次のステップ</h3>
                <p>{feedback.nextStep}</p>
              </div>
            </Card>

            <div className="action-buttons">
              <Button variant="gold" onClick={startNewScenario}>
                <RefreshCw size={18} />
                新しいシナリオ
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
