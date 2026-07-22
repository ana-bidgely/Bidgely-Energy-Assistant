'use client';

import { useChatStore } from '@/lib/chat/store';

export default function Header() {
  const { resetFlow, closePanel, closeModal, toggleSidebar } = useChatStore();

  function resetToWelcome() {
    resetFlow();
    closePanel();
    useChatStore.setState({ messages: [], chatMode: false });
  }

  return (
    <header id="header">
      <div className="header-left">
        <button
          className="sidebar-toggle-btn"
          title="Toggle chat history"
          aria-label="Toggle chat history sidebar"
          onClick={toggleSidebar}
        >
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2.5" y="3.5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7.5 4v12" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
        <div className="header-logo" onClick={resetToWelcome} title="New Chat">
          <svg className="logo-icon" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 1L13.5 8.5L21 11L13.5 13.5L11 21L8.5 13.5L1 11L8.5 8.5L11 1Z" fill="#1e232e" />
            <path d="M18 3L19 5.5L21.5 6.5L19 7.5L18 10L17 7.5L14.5 6.5L17 5.5L18 3Z" fill="#1e232e" opacity="0.4" />
          </svg>
          <div className="logo-text">
            <span className="logo-name">Energy Assistant</span>
            <span className="beta-badge">Beta</span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button className="header-btn" title="Chat History" onClick={toggleSidebar}>
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 3a7 7 0 1 0 0 14A7 7 0 0 0 10 3zM1.5 10a8.5 8.5 0 1 1 17 0 8.5 8.5 0 0 1-17 0z" fill="currentColor" />
            <path d="M10 5.75a.75.75 0 0 1 .75.75v3.69l2.28 2.28a.75.75 0 1 1-1.06 1.06l-2.5-2.5A.75.75 0 0 1 9.25 10.5V6.5a.75.75 0 0 1 .75-.75z" fill="currentColor" />
          </svg>
          Chat History
        </button>
        <button className="header-btn" title="New Chat" onClick={resetToWelcome}>
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6l-3.5 3V4z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
            <path d="M6.5 8h7M6.5 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          New Chat
        </button>
        <button className="header-btn header-btn-icon" title="Close" aria-label="Close Energy Assistant" onClick={closeModal}>
          <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
