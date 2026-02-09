import { useState, useEffect, useRef } from 'react';
import { MobileLayout } from '../../components/layout/MobileLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PERSONAS, generateSystemInstruction, startSession, sendMessageToGemini } from '../../services/prompts/mirror';
import { loadProgress, recordSession } from '../../services/progress';
import type { Persona, MirrorMessage, MirrorLoadingStateType } from '../../types';
import { MirrorLoadingState } from '../../types';
import { ArrowLeft, Send, RefreshCw, User } from 'lucide-react';
import './MirrorPage.css';

interface MirrorPageProps {
  onBack: () => void;
}

export const MirrorPage: React.FC<MirrorPageProps> = ({ onBack }) => {
  const [persona, setPersona] = useState<Persona>(PERSONAS[0]);
  const [messages, setMessages] = useState<MirrorMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loadingState, setLoadingState] = useState<MirrorLoadingStateType>(MirrorLoadingState.IDLE);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeSession();
  }, [persona]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSession = async () => {
    setLoadingState(MirrorLoadingState.THINKING);
    setMessages([]);

    try {
      const systemInstruction = generateSystemInstruction(persona);
      const response = await startSession(systemInstruction);

      const parsedResponse = parseResponse(response);

      const initialMessage: MirrorMessage = {
        id: Date.now().toString(),
        role: 'model',
        content: parsedResponse.nextTopic || response,
        timestamp: new Date(),
        analysis: parsedResponse.analysis,
        nextTopic: parsedResponse.nextTopic,
      };

      setMessages([initialMessage]);
      setLoadingState(MirrorLoadingState.IDLE);
    } catch (error) {
      console.error('Error initializing session:', error);
      setLoadingState(MirrorLoadingState.ERROR);
    }
  };

  const parseResponse = (response: string): { analysis?: string; nextTopic?: string } => {
    // Parse Markdown format from AI response
    const analysisMatch = response.match(/##\s*📊\s*分析レポート\s*([\s\S]*?)(?=##|$)/);
    const nextTopicMatch = response.match(/##\s*🗣️\s*次の話題\s*([\s\S]*?)(?=##|$)/);

    return {
      analysis: analysisMatch ? analysisMatch[1].trim() : undefined,
      nextTopic: nextTopicMatch ? nextTopicMatch[1].trim() : response,
    };
  };

  const handleSend = async () => {
    if (!inputValue.trim() || loadingState === MirrorLoadingState.THINKING) return;

    const userMessage: MirrorMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoadingState(MirrorLoadingState.THINKING);

    try {
      const systemInstruction = generateSystemInstruction(persona);
      const response = await sendMessageToGemini(messages, inputValue, systemInstruction);

      const parsedResponse = parseResponse(response);

      const aiMessage: MirrorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: parsedResponse.nextTopic || response,
        timestamp: new Date(),
        analysis: parsedResponse.analysis,
        nextTopic: parsedResponse.nextTopic,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Record progress if there's analysis (indicates a scored exchange)
      if (parsedResponse.analysis) {
        const scoreMatch = parsedResponse.analysis.match(/\*\*スコア\*\*:\s*(\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 70;
        const progress = loadProgress();
        recordSession(progress, 'mirror', score);
      }

      setLoadingState(MirrorLoadingState.IDLE);
    } catch (error) {
      console.error('Error sending message:', error);
      setLoadingState(MirrorLoadingState.ERROR);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePersonaChange = (newPersona: Persona) => {
    setPersona(newPersona);
  };

  const renderAnalysis = (analysis: string) => {
    const lines = analysis.split('\n').filter(line => line.trim());
    const sections: { [key: string]: string } = {};

    lines.forEach(line => {
      if (line.includes('**スコア**:')) {
        sections.score = line.replace(/\*\*スコア\*\*:\s*/, '');
      } else if (line.includes('**Good**:')) {
        sections.good = line.replace(/\*\*Good\*\*:\s*/, '');
      } else if (line.includes('**Advice**:')) {
        sections.advice = line.replace(/\*\*Advice\*\*:\s*/, '');
      } else if (line.includes('**Model Answer**:')) {
        sections.modelAnswer = line.replace(/\*\*Model Answer\*\*:\s*/, '');
      }
    });

    return (
      <div className="analysis-panel">
        <h3 className="analysis-title">📊 分析レポート</h3>
        {sections.score && (
          <div className="analysis-item">
            <span className="analysis-label">スコア:</span>
            <span className="analysis-score">{sections.score}</span>
          </div>
        )}
        {sections.good && (
          <div className="analysis-item">
            <span className="analysis-label">✓ 良かった点:</span>
            <p className="analysis-text">{sections.good}</p>
          </div>
        )}
        {sections.advice && (
          <div className="analysis-item">
            <span className="analysis-label">→ アドバイス:</span>
            <p className="analysis-text">{sections.advice}</p>
          </div>
        )}
        {sections.modelAnswer && (
          <div className="analysis-item model-answer-item">
            <span className="analysis-label">💡 お手本:</span>
            <p className="analysis-text">{sections.modelAnswer}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <MobileLayout>
      <div className="mirror-page fade-in">
        {/* Header */}
        <header className="mirror-header">
          <Button variant="secondary" onClick={onBack} className="back-button">
            <ArrowLeft size={20} />
            戻る
          </Button>
          <div className="header-info">
            <h1 className="page-title">ミラー</h1>
            <p className="page-subtitle">質問力の徹底強化</p>
          </div>
        </header>

        {/* Persona Selector */}
        <Card className="persona-selector">
          <label className="persona-label">会話相手を選択</label>
          <div className="persona-grid">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                className={`persona-button ${persona.id === p.id ? 'active' : ''}`}
                onClick={() => handlePersonaChange(p)}
              >
                <span className="persona-icon">{p.icon}</span>
                <span className="persona-name">{p.name}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Messages */}
        <div className="messages-container">
          {messages.map((message, index) => (
            <div key={message.id}>
              <div className={`message-bubble ${message.role === 'user' ? 'user' : 'ai'} fade-in-up`}>
                <div className="message-header">
                  {message.role === 'user' ? (
                    <>
                      <User size={16} />
                      <span>あなた</span>
                    </>
                  ) : (
                    <>
                      <span>{persona.icon}</span>
                      <span>{persona.name}</span>
                    </>
                  )}
                </div>
                <div className="message-content">{message.content}</div>
              </div>

              {/* Show analysis after AI response */}
              {message.role === 'model' && message.analysis && index > 0 && (
                <Card className="analysis-card fade-in-up">
                  {renderAnalysis(message.analysis)}
                </Card>
              )}
            </div>
          ))}

          {loadingState === MirrorLoadingState.THINKING && (
            <div className="message-bubble ai typing fade-in">
              <div className="message-header">
                <span>{persona.icon}</span>
                <span>{persona.name}</span>
              </div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <Card className="input-card">
          <div className="input-wrapper">
            <textarea
              className="textarea chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="リアクション + 質問で返答してください..."
              rows={2}
              disabled={loadingState === MirrorLoadingState.THINKING}
            />
            <div className="input-actions">
              <Button
                variant="secondary"
                onClick={initializeSession}
                disabled={loadingState === MirrorLoadingState.THINKING}
                className="reset-button"
              >
                <RefreshCw size={18} />
                リセット
              </Button>
              <Button
                variant="primary"
                onClick={handleSend}
                disabled={!inputValue.trim() || loadingState === MirrorLoadingState.THINKING}
              >
                <Send size={18} />
                送信
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </MobileLayout>
  );
};
