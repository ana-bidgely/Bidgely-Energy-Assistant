'use client';

import { useState } from 'react';
import { useChatStore } from '@/lib/chat/store';
import { advanceFlowStep } from '@/lib/chat/flows/advance';
import { getEvStep } from '@/lib/chat/flows/ev';
import { getSolarRefineStep } from '@/lib/chat/flows/solar';
import { dispatchInput } from '@/lib/chat/responses';

export default function InputBar() {
  const [value, setValue] = useState('');
  const {
    addMessage,
    setIsTyping,
    openPanel,
    flow,
    flowStep,
    flowData,
    advanceFlow,
    setFlow,
    resetFlow,
    setEvInputs,
    setSolarInputs,
  } = useChatStore();

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const text = value.trim();
    if (!text) return;

    setValue('');

    addMessage({ id: Math.random().toString(36).slice(2), role: 'user', text, timestamp: Date.now() });
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      // 1. Advance the active flow if there is one
      const advanced = advanceFlowStep(text, flow, flowStep, flowData);
      if (advanced) {
        advanceFlow(advanced.nextStep, advanced.nextData);
        addMessage(advanced.message);
        if (advanced.evInputs) setEvInputs(advanced.evInputs);
        if (advanced.solarInputs) setSolarInputs(advanced.solarInputs);
        if (advanced.done) resetFlow();
        if (advanced.openPanel) openPanel(advanced.openPanel.key, advanced.openPanel.title);
        return;
      }

      // 2. Otherwise dispatch as free text
      const result = dispatchInput(text);
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
    }, 700);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const hasText = !!value.trim();

  return (
    <div id="chat-input-bar">
      <div className="chat-input-row">
        <input
          type="text"
          className="chat-input"
          placeholder="Ask a follow-up..."
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className={`send-btn${hasText ? ' has-text' : ''}`}
          title="Send"
          onClick={() => handleSubmit()}
        >
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M3 10h14M10 3l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <p className="disclaimer" style={{ marginTop: 6, fontSize: 12, textAlign: 'center' }}>
        Energy Assistant is an AI and may occasionally make mistakes.
      </p>
    </div>
  );
}
