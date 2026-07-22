'use client';

import { useChatStore } from '@/lib/chat/store';
import { advanceFlowStep } from '@/lib/chat/flows/advance';
import { getEvStep } from '@/lib/chat/flows/ev';
import { getSolarRefineStep } from '@/lib/chat/flows/solar';
import { dispatchInput } from '@/lib/chat/responses';
import type { ChatMessage, MessageOption } from '@/lib/chat/types';
import ChatWidgetRenderer from './widgets/ChatWidgetRenderer';

interface Props {
  message: ChatMessage;
  isLast: boolean;
}

function formatText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

// Document-with-bars glyph used inside the report-card icon container.
// Strokes inherit currentColor so the parent CSS controls the glyph color
// across the inactive/active states.
function ReportCardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      {/* Outer document outline with a folded top-right corner */}
      <path
        d="M3.5 2 H11 L14.5 5.5 V16 H3.5 Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M11 2 V5.5 H14.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      {/* Three ascending bars inside the document — small chart motif */}
      <path d="M6 12 V13.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M9 10 V13.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M12 8 V13.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export default function MessageBubble({ message, isLast }: Props) {
  const {
    addMessage,
    setIsTyping,
    openPanel,
    activePanel,
    flow,
    flowStep,
    flowData,
    advanceFlow,
    setFlow,
    resetFlow,
    setEvInputs,
    setSolarInputs,
  } = useChatStore();

  function handleOption(opt: MessageOption) {
    // Append the user's choice as a chat bubble first
    addMessage({
      id: Math.random().toString(36).slice(2),
      role: 'user',
      text: opt.label,
      timestamp: Date.now(),
    });
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      // 1. Advance the active flow if there is one
      const advanced = advanceFlowStep(opt.value, flow, flowStep, flowData);
      if (advanced) {
        advanceFlow(advanced.nextStep, advanced.nextData);
        addMessage(advanced.message);
        if (advanced.evInputs) setEvInputs(advanced.evInputs);
        if (advanced.solarInputs) setSolarInputs(advanced.solarInputs);
        if (advanced.done) resetFlow();
        if (advanced.openPanel) openPanel(advanced.openPanel.key, advanced.openPanel.title);
        return;
      }

      // 2. Reset sentinel — clear flow + show menu
      if (opt.value === '__reset__') {
        resetFlow();
        const result = dispatchInput('__reset__');
        addMessage(result.message);
        return;
      }

      // 3. Everything else (panel-open sentinels, free-text intents) → dispatcher
      const result = dispatchInput(opt.value);
      if (result.startFlow === 'ev') {
        setFlow('ev', 0, {});
        addMessage(getEvStep(0, {}));
      } else if (result.startFlow === 'solar') {
        setFlow('solar', 0, {});
        addMessage(getSolarRefineStep(0, {}));
      } else {
        addMessage(result.message);
        if (result.followUp) addMessage(result.followUp);
        if (result.openPanel) openPanel(result.openPanel.key, result.openPanel.title);
      }
    }, 600);
  }

  function handleReportCard() {
    if (message.reportCard) {
      openPanel(message.reportCard.panel, message.reportCard.panelTitle);
    }
  }

  if (message.role === 'user') {
    return (
      <div className="message-group user-group">
        <div className="user-bubble">{message.text}</div>
      </div>
    );
  }

  if (!message.text && !message.reportCard && !message.options?.length && !message.widget) return null;

  return (
    <div className="message-group ai-group">
      {message.text && <div className="ai-body">{formatText(message.text)}</div>}

      {message.widget && <ChatWidgetRenderer widget={message.widget} />}

      {message.reportCard && (
        // Active state = the report's panel is currently open. Visuals shift
        // (per Figma 1476:11195): pill bg → Web/Primary/200, icon container
        // bg → Web/Primary/500 solid, glyph → pale-blue. Inactive uses white
        // pill + pale-blue icon container + blue glyph (Figma 1476:11177).
        <button
          className={`chat-report-card${activePanel === message.reportCard.panel ? ' active' : ''}`}
          onClick={handleReportCard}
        >
          <div className="chat-report-card-icon">
            <ReportCardIcon />
          </div>
          <div className="chat-report-card-title">{message.reportCard.panelTitle}</div>
        </button>
      )}

      {isLast && message.options && message.options.length > 0 && (
        <div className="msg-options">
          {message.options.map((opt) => (
            <button
              key={opt.value}
              className="msg-option"
              onClick={() => handleOption(opt)}
            >
              {opt.label}
              {opt.note && <span className="msg-option-note">{opt.note}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
