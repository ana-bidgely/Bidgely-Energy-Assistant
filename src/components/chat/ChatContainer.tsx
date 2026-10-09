'use client';

import { useChatStore } from '@/lib/chat/store';
import Header from './Header';
import WelcomeScreen from './WelcomeScreen';
import MessageThread from './MessageThread';
import InputBar from './InputBar';
import ChatHistorySidebar from './ChatHistorySidebar';
import RightPanel from '@/components/panels/RightPanel';
import SurveyForm from './survey/SurveyForm';

export default function ChatContainer() {
  const { chatMode, activePanel, sidebarOpen, survey } = useChatStore();

  return (
    <div id="app">
      <Header />
      <div id="content-area">
        <div id="history-sidebar" className={sidebarOpen ? 'open' : ''}>
          <ChatHistorySidebar />
        </div>
        <div id="main-panel">
          {survey ? (
            <SurveyForm key={survey} kind={survey} />
          ) : chatMode ? (
            <div id="chat-screen" className="visible">
              <MessageThread />
              <InputBar />
            </div>
          ) : (
            <WelcomeScreen />
          )}
        </div>
        <div id="right-panel" className={activePanel ? 'open' : ''}>
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
