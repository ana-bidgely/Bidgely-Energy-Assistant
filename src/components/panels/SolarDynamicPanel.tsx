'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/chat/store';
import { buildDynamicSolarReport } from '@/lib/data/computations';
import { USER } from '@/lib/data/user';
import { ReportWebView } from '@/report/web/ReportWebView';
import { exportPdf } from '@/lib/pdf/export';

export default function SolarDynamicPanel() {
  const flowData = useChatStore((s) => s.flowData);
  const solarInputs = useChatStore((s) => s.solarInputs);
  const setPanelDownloadHandler = useChatStore((s) => s.setPanelDownloadHandler);
  const reportRef = useRef<HTMLDivElement>(null);

  // Roof/shade/orientation/cost each live-preview from the in-progress
  // refine flow's answers (flowData) as soon as they're picked, falling back
  // to the last fully-completed run (solarInputs) once the flow resets, and
  // to the original auto-detected defaults if neither is set yet.
  const roof = (flowData.roof as 'small' | 'medium' | 'large') ?? solarInputs?.roof ?? 'medium';
  const shade = (flowData.shade as 'none' | 'partial' | 'heavy') ?? solarInputs?.shade ?? 'none';
  const orientation = (flowData.orientation as 'south' | 'east' | 'west' | 'north' | undefined) ?? solarInputs?.orientation;
  const installCostPerW = (flowData.installCostPerW as number | undefined) ?? solarInputs?.installCostPerW;
  const report = buildDynamicSolarReport(roof, shade, USER, {
    orientation,
    installCostPerW,
    refined: !!solarInputs,
    provided: solarInputs?.provided,
  });

  useEffect(() => {
    setPanelDownloadHandler(async () => {
      if (reportRef.current) {
        await exportPdf(reportRef.current, `solar-report-${USER.name.toLowerCase()}`);
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
