'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useChatStore } from '@/lib/chat/store';
import { USER } from '@/lib/data/user';
import { buildEvReport } from '@/lib/data/computations';
import { exportPdf } from '@/lib/pdf/export';
import { ReportWebView } from '@/report/web/ReportWebView';

// EvPanel — full pixel-perfect EV report rebuilt against Figma 1476:9452.
// Replaces the old card-stack EV summary; now uses the same ReportWebView
// pipeline as the solar / bill explainer reports. The panel just wires the
// report data, the PDF download handler, and the scroll container — all
// section rendering lives in ReportWebView.
//
// Numbers come from the EV chat flow's collected answers (evInputs) when
// available, so the report reflects exactly what the user picked; falls
// back to the fixed Figma-default scenario if the panel is somehow opened
// without running the flow.
export default function EvPanel() {
  const reportRef = useRef<HTMLDivElement>(null);
  const setPanelDownloadHandler = useChatStore((s) => s.setPanelDownloadHandler);
  const evInputs = useChatStore((s) => s.evInputs);

  const report = useMemo(() => buildEvReport(USER, evInputs ?? undefined), [evInputs]);

  useEffect(() => {
    setPanelDownloadHandler(async () => {
      if (reportRef.current) {
        await exportPdf(reportRef.current, `ev-report-${USER.name.toLowerCase()}`);
      }
    });
    return () => setPanelDownloadHandler(null);
  }, [setPanelDownloadHandler]);

  return (
    <div ref={reportRef}>
      <ReportWebView report={report} />
    </div>
  );
}
