'use client';

import { useState } from 'react';
import { getFakeChatHistoryPage, groupHistoryByDate } from '@/lib/chat/fakeChatHistory';

const PAGE_SIZE = 20;

function ChatRowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v8a1.5 1.5 0 0 1-1.5 1.5H8l-3.5 3v-3H4.5A1.5 1.5 0 0 1 3 12.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M6.5 7.5h7M6.5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ChatHistorySidebar — left column listing past conversations, grouped under
// date-bucket headers (Today / Yesterday / Previous 7 Days / Previous 30
// Days / month name / bare year — see fakeChatHistory.ts for the bucketing
// spec). Rows aren't clickable yet; this is the sidebar list itself. Data is
// fake (no real chat persistence exists), fetched 20 at a time, with "Load
// more" extending the same continuously-descending fake timeline.
export default function ChatHistorySidebar() {
  const [loadedCount, setLoadedCount] = useState(PAGE_SIZE);
  // Captured once per mount so bucket labels (and "Today"/"Yesterday" in
  // particular) stay stable while the user loads more, rather than
  // potentially reclassifying earlier items if `now` ticked past midnight
  // mid-session.
  const [now] = useState(() => new Date());

  const items = getFakeChatHistoryPage(0, loadedCount, now);
  const rows = groupHistoryByDate(items, now);

  return (
    <div className="chat-history-list">
      {rows.map((row, i) =>
        row.type === 'header' ? (
          <div key={`h-${i}`} className="chat-history-header">
            {row.label}
          </div>
        ) : (
          <div key={row.item.id} className="chat-history-row">
            <ChatRowIcon />
            <span className="chat-history-title">{row.item.title}</span>
          </div>
        )
      )}
      <button
        type="button"
        className="chat-history-load-more"
        onClick={() => setLoadedCount((c) => c + PAGE_SIZE)}
      >
        Load more chats
      </button>
    </div>
  );
}
