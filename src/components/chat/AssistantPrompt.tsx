'use client';

// AssistantPrompt — the visual welcome block (greeting + glowing input +
// "Explore energy checks" chip grid). Used by:
//   • WelcomeScreen.tsx  (inside the fullscreen modal)
//   • HomeAssistantWidget.tsx  (embedded on the home dashboard)
//
// Chips are direct-action: clicking one sends its prompt straight into the
// chat (opening the modal from the home surface), rather than opening a
// secondary suggestion dropdown. All styling comes from global classes in
// globals.css so both surfaces render pixel-identically.

import { useEffect, useState } from 'react';

// Each chip's label is also the message sent to the assistant — the labels are
// phrased as natural user utterances so dispatchInput() routes them correctly.
const CHIPS: { label: string; icon: string; size: number }[] = [
  { label: 'Analyse my latest bill', icon: '/welcome/bill.svg', size: 16 },
  { label: 'Find a better rate', icon: '/welcome/rate.svg', size: 16 },
  { label: 'Lower my energy costs', icon: '/welcome/leaf.svg', size: 16 },
  { label: 'Should I install solar?', icon: '/welcome/solar.svg', size: 18 },
  { label: 'Is an EV right for me?', icon: '/welcome/ev.svg', size: 16 },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

interface Props {
  /** Called when the user commits a message (typing + Enter, send button, or chip click). */
  onSend: (text: string) => void;
  /** Retained for call-site compatibility; no longer renders anything. */
  showAccountInfo?: boolean;
}

export default function AssistantPrompt({ onSend }: Props) {
  const [inputValue, setInputValue] = useState('');
  const [greeting, setGreeting] = useState('Good day');

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInputValue('');
    onSend(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') send(inputValue);
  }

  return (
    <div className="welcome-center">
      <h1 className="welcome-heading">
        <svg
          className="welcome-heading-mark"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="ea-sparkle-gradient"
              x1="25.4605"
              y1="42.5456"
              x2="40.2654"
              y2="40.2227"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#0F4184" />
              <stop offset="0.233409" stopColor="#1E62C1" />
              <stop offset="0.4" stopColor="#94207B" />
              <stop offset="0.6" stopColor="#E4194B" />
              <stop offset="0.8" stopColor="#E4194B" />
              <stop offset="1" stopColor="#F1774A" />
            </linearGradient>
          </defs>
          <path d="M15.9996 1.45459L19.6359 12.3637L30.545 16L19.6359 19.6364L15.9996 30.5455L12.3632 19.6364L1.4541 16L12.3632 12.3637L15.9996 1.45459Z" fill="url(#ea-sparkle-gradient)" />
          <path d="M26.1814 4.36368L27.6359 8.00004L31.2723 9.45459L27.6359 10.9091L26.1814 14.5455L24.7268 10.9091L21.0905 9.45459L24.7268 8.00004L26.1814 4.36368Z" fill="url(#ea-sparkle-gradient)" />
        </svg>
        <span>{greeting}, Alex!</span>
      </h1>

      <div className="input-section" data-assistant-input-section>
        <div className="input-wrapper">
          <div className="glow-bg" />
          <input
            type="text"
            className="chat-input welcome-input"
            placeholder="Ask about your energy"
            autoComplete="off"
            style={{ position: 'relative', zIndex: 1 }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className={`send-btn welcome-send-btn${inputValue.trim() ? ' has-text' : ''}`}
            title="Send"
            onClick={() => send(inputValue)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M2.34581 2.24485C2.49508 2.11519 2.67944 2.03268 2.87558 2.00776C3.07173 1.98284 3.27086 2.01663 3.44781 2.10485L21.4478 11.1049C21.6142 11.1878 21.7542 11.3155 21.8521 11.4736C21.9499 11.6317 22.0017 11.8139 22.0017 11.9999C22.0017 12.1858 21.9499 12.368 21.8521 12.5261C21.7542 12.6842 21.6142 12.8119 21.4478 12.8949L3.44781 21.8949C3.27088 21.9834 3.07165 22.0174 2.87536 21.9927C2.67906 21.968 2.49451 21.8856 2.34505 21.7559C2.1956 21.6263 2.08797 21.4552 2.03577 21.2644C1.98357 21.0736 1.98915 20.8715 2.05181 20.6839L4.61381 12.9999H10.0008C10.266 12.9999 10.5204 12.8945 10.7079 12.707C10.8955 12.5194 11.0008 12.2651 11.0008 11.9999C11.0008 11.7346 10.8955 11.4803 10.7079 11.2927C10.5204 11.1052 10.266 10.9999 10.0008 10.9999H4.61381L2.05081 3.31585C1.98847 3.12826 1.98313 2.92641 2.03546 2.73579C2.08779 2.54516 2.19644 2.37433 2.34581 2.24485Z" />
            </svg>
          </button>
        </div>

        <div className="explore-section">
          <p className="explore-label">Explore energy checks</p>
          <div className="chips-row">
            {CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                className="chip"
                onClick={() => send(chip.label)}
              >
                <span className="chip-icon" style={{ width: chip.size, height: chip.size }}>
                  <img src={chip.icon} alt="" width={chip.size} height={chip.size} />
                </span>
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
