'use client';

import { useChatStore } from '@/lib/chat/store';
import SolarDynamicPanel from './SolarDynamicPanel';
import EvPanel from './EvPanel';
import BillPanel from './BillPanel';
import BillReportPanel from './BillReportPanel';
import RatePanel from './RatePanel';
import RatePlanPanel from './RatePlanPanel';
import OptimizerPanel from './OptimizerPanel';
import BillToolPlaceholderPanel from './BillToolPlaceholderPanel';
import HighBillAnalyzerPanel from './HighBillAnalyzerPanel';
import MonthlySummaryWidget from '@/components/widgets/miraki/MonthlySummaryWidget';
import EnergyDetailsWidget from '@/components/widgets/miraki/EnergyDetailsWidget';

export default function RightPanel() {
  const { activePanel, panelTitle, panelLoading, closePanel, panelDownloadHandler } = useChatStore();

  function renderPanel() {
    switch (activePanel) {
      case 'solar-dynamic': return <SolarDynamicPanel />;
      case 'ev':            return <EvPanel />;
      case 'bill':          return <BillPanel />;
      case 'bill-report':   return <BillReportPanel />;
      case 'rate':          return <RatePanel />;
      case 'rate-report':   return <RatePlanPanel />;
      case 'optimizer':     return <OptimizerPanel />;
      case 'usage':             return <BillPanel showUsage />;
      case 'monthly-summary':   return <MonthlySummaryWidget />;
      case 'energy-details':    return <EnergyDetailsWidget />;
      case 'bill-tool':         return <BillToolPlaceholderPanel title={panelTitle || 'Widget'} />;
      case 'high-bill-analyzer': return <HighBillAnalyzerPanel />;
      default:              return null;
    }
  }

  // Any panel rendered through ReportWebView (or that wants the FBFBFC
  // canvas treatment) — strip the body's default 24px padding + white
  // background so the report fills edge-to-edge against the panel wash.
  // Previously only solar got this; now EV, bill-report, optimizer, and
  // rate-report all share the same canvas treatment.
  const isReportMode = activePanel === 'solar-dynamic'
    || activePanel === 'ev'
    || activePanel === 'bill-report'
    || activePanel === 'optimizer'
    || activePanel === 'rate-report'
    || activePanel === 'high-bill-analyzer';

  return (
    <div className={`right-panel-inner${isReportMode ? ' report-canvas-mode' : ''}`}>
      <div className="right-panel-header">
        <span className="right-panel-title">{panelTitle || 'Report'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {panelDownloadHandler && !panelLoading && (
            <button className="panel-pdf-btn" onClick={() => panelDownloadHandler()} title="Download PDF">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 1v8M4 6l3 3 3-3M2 11h10" />
              </svg>
              PDF
            </button>
          )}
          <button className="right-panel-close" onClick={closePanel} title="Close">
            <svg viewBox="0 0 18 18" fill="none">
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      <div className={`right-panel-body${isReportMode ? ' report-canvas' : ''}`}>
        {panelLoading ? (
          <div className="panel-loading">
            <div className="panel-loading-spinner" />
            <div className="panel-loading-text">
              Generating your report<span className="panel-loading-dots" />
            </div>
          </div>
        ) : (
          renderPanel()
        )}
      </div>
    </div>
  );
}
