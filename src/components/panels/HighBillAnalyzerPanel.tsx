'use client';

import { useEffect, useRef, useState } from 'react';

// Matches the `.report { width: 794px; }` fixed design width baked into the
// static export (public/hba-report/index.html) — used to compute the scale
// factor below.
const REPORT_WIDTH = 794;

// HighBillAnalyzerPanel — renders the standalone "HBA Report — By Cause"
// static HTML export inside the right panel via an iframe. Unlike the other
// reports (built from the shared Report/ReportWebView data model, which are
// fluid/responsive), this is a pre-built fixed-794px-wide design export. A
// plain 100%-wide iframe doesn't make fixed-width content reflow — it just
// leaves the content clipped with an internal horizontal scrollbar whenever
// the panel is narrower than 794px. Instead we measure the available width
// and apply a CSS scale transform so the report always fills the panel edge
// to edge, the same way the other (responsive) reports do.
export default function HighBillAnalyzerPanel() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setScale(width / REPORT_WIDTH);
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  function handleLoad() {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    // The static export is designed to be viewed as its own standalone page —
    // a white "floating card" (with its own box-shadow + rounded corners) on
    // a gray page background. Embedded inside our panel that reads as an
    // unintegrated page-within-a-page (a gray gutter + shadow bleeding in at
    // the top/sides). Override just those wrapper styles so the report's
    // content fills the panel flush, matching how the other reports render;
    // the report's own internal styling is untouched.
    const style = doc.createElement('style');
    style.textContent = `
      body { background: #FBFBFC !important; padding: 0 !important; }
      .report { box-shadow: none !important; border-radius: 0 !important; margin: 0 !important; }
    `;
    doc.head.appendChild(style);

    setContentHeight(doc.documentElement.scrollHeight);

    // The report's "By Cause" section is an accordion — opening/closing a
    // cause changes the document's height after load, so a one-time measure
    // isn't enough (the wrapper below clips to a stale height). Keep
    // measuring as the iframe's own content resizes.
    const resizeObserver = new ResizeObserver(() => {
      setContentHeight(doc.documentElement.scrollHeight);
    });
    resizeObserver.observe(doc.documentElement);
  }

  return (
    <div
      ref={wrapperRef}
      style={{ width: '100%', height: contentHeight ? contentHeight * scale : '100%', overflow: 'hidden', position: 'relative' }}
    >
      <iframe
        ref={iframeRef}
        src="/hba-report/index.html"
        title="High Bill Analyzer"
        onLoad={handleLoad}
        style={{
          width: REPORT_WIDTH,
          height: contentHeight || '100%',
          border: 0,
          display: 'block',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
}
