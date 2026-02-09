import { useState, useEffect, useRef } from 'react';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { generateCharacter, getFirstLine, chatWithSubordinate, getFeedback } from '../../services/prompts/manager';
import { loadProgress, recordSession } from '../../services/progress';
import type { CharacterProfile, ManagerMessage, ManagerFeedback, ManagerPhaseType } from '../../types';
import { ManagerPhase } from '../../types';
import { ArrowLeft, Loader2, Send, MessageCircle, Award, RefreshCw } from 'lucide-react';
import './ManagerPage.css';

interface ManagerPageProps {
  onBack: () => void;
}

export const ManagerPage: React.FC<ManagerPageProps> = ({ onBack }) => {
  const [phase, setPhase] = useState<ManagerPhaseType>(ManagerPhase.INITIALIZING);
  const [profile, setProfile] = useState<CharacterProfile | null>(null);
  const [messages, setMessages] = useState<ManagerMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [trustLevel, setTrustLevel] = useState(20);
  const [feedback, setFeedback] = useState<ManagerFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseTrustFromResponse = (text: string): { trust: number; thought: string; message: string } => {
    const trustMatch = text.match(/\[思考:\s*(\d+)/);
    const trust = trustMatch ? parseInt(trustMatch[1], 10) : trustLevel;
    const thoughtMatch = text.match(/\[思考:[^\]]+\]/);
    const thought = thoughtMatch ? thoughtMatch[0] : '';
    const message = text.replace(/\[思考:[^\]]+\]\s*/g, '').trim();
    return { trust, thought, message };
  };

  const initializeSession = async () => {
    setPhase(ManagerPhase.INITIALIZING);
    setMessages([]);
    setFeedback(null);
    setIsLoading(true);

    try {
      const newProfile = await generateCharacter();
      setProfile(newProfile);
      setTrustLevel(newProfile.initialTrust);

      const firstLine = await getFirstLine(newProfile);
      const { trust, thought, message } = parseTrustFromResponse(firstLine);

      setTrustLevel(trust);
      setMessages([{
        role: 'ai',
        content: message,
        thought,
        trustLevel: trust
      }]);
      setPhase(ManagerPhase.ROLEPLAY);
    } catch (error) {
      console.error('Error initializing session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !profile || isLoading) return;

    const newUserMessage: ManagerMessage = {
      role: 'user',
      content: userInput
    };

    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await chatWithSubordinate(
        profile,
        [...messages, newUserMessage],
        userInput,
        trustLevel
      );

      const { trust, thought, message } = parseTrustFromResponse(response);

      setTrustLevel(trust);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: message,
        thought,
        trustLevel: trust
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
    if (!profile || messages.length < 2) return;

    setIsLoading(true);
    try {
      const result = await getFeedback(profile, messages);
      setFeedback(result);

      // Record progress
      const progress = loadProgress();
      recordSession(progress, 'manager', result.totalScore);

      // Check for empathy master badge (trust >= 80)
      if (trustLevel >= 80) {
        // Badge is handled by recordSession based on score
      }

      setPhase(ManagerPhase.FEEDBACK);
    } catch (error) {
      console.error('Error getting feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrustColor = (trust: number): string => {
    if (trust >= 80) return 'var(--success)';
    if (trust >= 50) return 'var(--warning)';
    return 'var(--error)';
  };

  return (
    <MobileLayout>
      <div className="manager-page fade-in">
        {/* Header */}
        <header className="manager-header">
          <Button variant="secondary" onClick={onBack} className="back-button">
            <ArrowLeft size={20} />
            戻る
          </Button>
          <div className="header-info">
            <h1 className="page-title">マネージャー</h1>
            <p className="page-subtitle">信頼を築く対話術</p>
          </div>
        </header>

        {/* Trust Meter */}
        {phase === ManagerPhase.ROLEPLAY && (
          <div className="trust-meter fade-in-up">
            <div className="trust-label">
              <span>信頼度</span>
              <span style={{ color: getTrustColor(trustLevel) }}>{trustLevel}/100</span>
            </div>
            <div className="trust-bar">
              <div
                className="trust-fill"
                style={{
                  width: `${trustLevel}%`,
                  backgroundColor: getTrustColor(trustLevel)
                }}
              />
            </div>
            {trustLevel >= 80 && (
              <p className="trust-hint">本音を打ち明けてくれるかもしれません...</p>
            )}
          </div>
        )}

        {/* Loading State */}
        {phase === ManagerPhase.INITIALIZING && (
          <Card size="lg" className="loading-card">
            <div className="loading-content">
              <Loader2 className="spinner" size={48} />
              <p>部下のキャラクターを生成中...</p>
            </div>
          </Card>
        )}

        {/* Chat Area */}
        {phase === ManagerPhase.ROLEPLAY && (
          <div className="chat-container fade-in-up">
            <div className="messages-area">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  {msg.role === 'ai' && (
                    <div className="message-avatar">
                      <MessageCircle size={20} />
                    </div>
                  )}
                  <div className="message-bubble">
                    <p className="message-content">{msg.content}</p>
                    {msg.thought && (
                      <p className="message-thought">{msg.thought}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message ai">
                  <div className="message-avatar">
                    <MessageCircle size={20} />
                  </div>
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
            <div className="input-area">
              <textarea
                className="chat-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="上司として返答してください..."
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
                  終了して評価
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
          </div>
        )}

        {/* Feedback Section */}
        {phase === ManagerPhase.FEEDBACK && feedback && (
          <div className="feedback-section fade-in-up">
            <Card size="lg" className="feedback-card">
              <h2 className="feedback-title">
                <Award size={24} />
                セッション評価
              </h2>

              <div className="feedback-score">
                <span className="score-label">トータルスコア</span>
                <span className="score-value">{feedback.totalScore}/100</span>
              </div>

              <div className="feedback-item">
                <h3>本音の的中度</h3>
                <p>{feedback.truthAccuracy}</p>
              </div>

              <div className="feedback-item good">
                <h3>Good Point</h3>
                <p>{feedback.goodPoint}</p>
              </div>

              <div className="feedback-item bad">
                <h3>改善点</h3>
                <p>{feedback.badPoint}</p>
              </div>

              <div className="feedback-item advice">
                <h3>次回へのアドバイス</h3>
                <p>{feedback.advice}</p>
              </div>

              {profile && (
                <div className="feedback-reveal">
                  <h3>部下の設定（種明かし）</h3>
                  <ul>
                    <li><strong>名前:</strong> {profile.name}</li>
                    <li><strong>部署:</strong> {profile.department}</li>
                    <li><strong>性格:</strong> {profile.personality}</li>
                    <li><strong>隠された本音:</strong> {profile.hiddenTruth}</li>
                  </ul>
                </div>
              )}
            </Card>

            <div className="action-buttons">
              <Button variant="gold" onClick={initializeSession}>
                <RefreshCw size={18} />
                もう一度挑戦
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
