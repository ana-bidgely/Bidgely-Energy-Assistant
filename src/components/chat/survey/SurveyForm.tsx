'use client';

import { useMemo, useState } from 'react';
import { useChatStore } from '@/lib/chat/store';
import { buildSolarInputs } from '@/lib/chat/flows/solar';
import { buildEvInputs } from '@/lib/chat/flows/ev';
import type { ChatMessage } from '@/lib/chat/types';
import { Art } from './illustrations';
import {
  EV_SURVEY,
  SOLAR_SURVEY,
  describeAnswer,
  evAnswersToData,
  isComplete,
  isVisible,
  maskRangeText,
  parseCustom,
  sanitize,
  solarAnswersToData,
  type Answers,
  type Mask,
  type Question,
  type SurveyDef,
} from './surveyConfig';

const uid = () => Math.random().toString(36).slice(2);

function OptionCard({
  label,
  sub,
  badge,
  art,
  muted,
  selected,
  onSelect,
}: {
  label: string;
  sub?: string;
  badge?: string;
  art?: Parameters<typeof Art>[0]['name'];
  muted?: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`sv-card${selected ? ' selected' : ''}${muted ? ' muted' : ''}${art ? '' : ' plain'}`}
    >
      {art && <span className="sv-card-art"><Art name={art} /></span>}
      {badge && <span className="sv-badge">{badge}</span>}
      <span className="sv-card-label">{label}</span>
      {sub && <span className="sv-card-sub">{sub}</span>}
      <span className="sv-check" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="12" height="12"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </button>
  );
}

function MaskedInput({ mask, value, onChange }: { mask: Mask; value: string; onChange: (v: string) => void }) {
  const [touched, setTouched] = useState(false);
  const valid = parseCustom(value, mask) !== null;
  const showError = touched && value !== '' && !valid;
  return (
    <div className="sv-custom">
      <div className={`sv-input-wrap${showError ? ' error' : ''}${valid ? ' valid' : ''}`}>
        {mask.prefix && <span className="sv-adorn">{mask.prefix}</span>}
        <input
          autoFocus
          inputMode={mask.decimals > 0 ? 'decimal' : 'numeric'}
          autoComplete="off"
          value={value}
          placeholder={mask.placeholder}
          maxLength={mask.maxLen}
          onChange={(e) => onChange(sanitize(e.target.value, mask))}
          onBlur={() => setTouched(true)}
          aria-invalid={showError}
        />
        <span className="sv-adorn right">{mask.suffix}</span>
      </div>
      <span className={`sv-custom-hint${showError ? ' error' : ''}`}>
        {showError ? `Please enter a value between ${maskRangeText(mask)}` : `Allowed: ${maskRangeText(mask)}`}
      </span>
    </div>
  );
}

function QuestionBlock({
  q,
  index,
  answer,
  onChoice,
  onCustom,
}: {
  q: Question;
  index: number;
  answer: Answers[string] | undefined;
  onChoice: (v: string) => void;
  onCustom: (v: string) => void;
}) {
  const choice = answer?.choice;
  const cards = q.options.filter((o) => !o.muted);
  const skips = q.options.filter((o) => o.muted);
  return (
    <div className="sv-question">
      <div className="sv-q-head">
        <span className="sv-q-num">{index}</span>
        <h3 className="sv-q-title">{q.title}</h3>
      </div>
      <div
        className="sv-grid"
        style={{
          ['--n' as string]: Math.min(5, Math.max(2, cards.length + (q.custom ? 1 : 0))),
          // Two big picture cards stretch absurdly wide — keep them card-sized.
          maxWidth: cards.length + (q.custom ? 1 : 0) <= 2 ? 520 : undefined,
        }}
        role="radiogroup"
        aria-label={q.title}
      >
        {cards.map((o) => (
          <OptionCard key={o.value} {...o} selected={choice === o.value} onSelect={() => onChoice(o.value)} />
        ))}
        {q.custom && (
          <OptionCard
            label="Custom"
            art={q.plain ? undefined : 'custom'}
            selected={choice === 'custom'}
            onSelect={() => onChoice('custom')}
          />
        )}
      </div>
      {skips.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={choice === o.value}
          className={`sv-skip${choice === o.value ? ' selected' : ''}`}
          onClick={() => onChoice(o.value)}
        >
          <span className="sv-skip-mark">?</span>
          {o.label}
        </button>
      ))}
      {q.custom && choice === 'custom' && (
        <MaskedInput mask={q.custom} value={answer?.custom ?? ''} onChange={onCustom} />
      )}
    </div>
  );
}

export default function SurveyForm({ kind }: { kind: 'solar' | 'ev' }) {
  const def: SurveyDef = kind === 'solar' ? SOLAR_SURVEY : EV_SURVEY;
  const closeSurvey = useChatStore((s) => s.closeSurvey);
  const addMessage = useChatStore((s) => s.addMessage);
  const openPanel = useChatStore((s) => s.openPanel);
  const setSolarInputs = useChatStore((s) => s.setSolarInputs);
  const setEvInputs = useChatStore((s) => s.setEvInputs);
  const answers = useChatStore((s) => s.surveyAnswers[kind]);
  const setSurveyAnswers = useChatStore((s) => s.setSurveyAnswers);
  const setAnswers = (fn: (a: Answers) => Answers) =>
    setSurveyAnswers(kind, fn(useChatStore.getState().surveyAnswers[kind]));

  const visibleQuestions = useMemo(
    () => def.sections.flatMap((s) => s.questions).filter((q) => isVisible(q, answers)),
    [def, answers],
  );
  const doneCount = visibleQuestions.filter((q) => isComplete(q, answers)).length;
  const allDone = doneCount === visibleQuestions.length;

  function setChoice(q: Question, value: string) {
    setAnswers((a) => ({ ...a, [q.id]: { choice: value, custom: value === 'custom' ? a[q.id]?.custom ?? '' : undefined } }));
  }
  function setCustom(q: Question, value: string) {
    setAnswers((a) => ({ ...a, [q.id]: { choice: 'custom', custom: value } }));
  }

  /** Leaving mid-survey: say something useful and offer a way back in. */
  function goBack() {
    const started = Object.keys(answers).length > 0;
    const label = kind === 'solar' ? 'Solar' : 'EV';
    const text = started
      ? `No problem — I’ve saved your answers, so you can pick up the ${label} check right where you left off.`
      : `No problem — whenever you’re ready, the ${label} check takes about a minute and I’ll build your report straight after.`;
    closeSurvey();
    addMessage({
      id: uid(),
      role: 'assistant',
      timestamp: Date.now(),
      text,
      options: [
        { label: started ? `Continue ${label} survey` : `Open ${label} survey`, value: `__open_survey_${kind}__` },
      ],
    });
  }

  function submit() {
    if (!allDone) return;
    const recap = (ids: string[], labels: string[]) =>
      ids.map((id, i) => {
        const q = def.sections.flatMap((s) => s.questions).find((x) => x.id === id)!;
        return { icon: '•', label: labels[i], value: describeAnswer(def, q, answers) };
      });

    let message: ChatMessage;
    if (kind === 'solar') {
      setSolarInputs(buildSolarInputs(solarAnswersToData(answers)));
      message = {
        id: uid(),
        role: 'assistant',
        timestamp: Date.now(),
        text: 'Thanks — I’ve built your Solar Savings Report from your answers.',
        widget: {
          type: 'analysis-profile',
          sections: [
            {
              heading: 'Your answers',
              rows: recap(['roof', 'orientation', 'shade', 'cost'], ['Roof space', 'Roof direction', 'Shade', 'Install price']),
            },
          ],
        },
        reportCard: { label: 'View Solar Savings Report', panel: 'solar-dynamic', panelTitle: 'Solar Savings Report' },
      };
      closeSurvey();
      addMessage(message);
      openPanel('solar-dynamic', 'Solar Savings Report');
    } else {
      setEvInputs(buildEvInputs(evAnswersToData(answers)));
      const ids = ['miles', 'mpg', 'charging'];
      const labels = ['Miles per month', 'Current fuel economy', 'Charging'];
      if (answers.charging?.choice === 'home') {
        ids.push('offpeak');
        labels.push('Off-peak charging');
      }
      message = {
        id: uid(),
        role: 'assistant',
        timestamp: Date.now(),
        text: 'Thanks — I’ve put together your EV side-by-side breakdown from your answers.',
        widget: { type: 'analysis-profile', sections: [{ heading: 'Your answers', rows: recap(ids, labels) }] },
        reportCard: { label: 'View EV Savings Analysis', panel: 'ev', panelTitle: 'EV Savings Analysis' },
      };
      closeSurvey();
      addMessage(message);
      openPanel('ev', 'EV Savings Analysis');
    }
  }

  let counter = 0;
  return (
    <div className="sv-root">
      <div className="sv-scroll">
        <div className="sv-inner">
          <button type="button" className="sv-back" onClick={goBack}>
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Back to chat
          </button>

          <div className="sv-hero">
            <span className="sv-hero-icon">
              {/* Same markup as the home-screen chip, so the icon renders identically. */}
              <span className="chip-icon" style={{ width: 28, height: 28 }}>
                <img src={def.icon} alt="" width={28} height={28} style={{ width: 28, height: 28 }} />
              </span>
            </span>
            <h2 className="sv-title">{def.title}</h2>
          </div>

          {def.sections.map((section) => {
            const qs = section.questions.filter((q) => isVisible(q, answers));
            if (qs.length === 0) return null;
            return (
              <section key={section.title} className="sv-section">
                <div className="sv-section-head">
                  <h3>{section.title}</h3>
                </div>
                {qs.map((q) => {
                  counter += 1;
                  return (
                    <QuestionBlock
                      key={q.id}
                      q={q}
                      index={counter}
                      answer={answers[q.id]}
                      onChoice={(v) => setChoice(q, v)}
                      onCustom={(v) => setCustom(q, v)}
                    />
                  );
                })}
              </section>
            );
          })}
        </div>
      </div>

      <div className="sv-footer">
        <div className="sv-footer-inner">
          <div className="sv-progress" aria-live="polite">
            <div className="sv-progress-bar"><span style={{ width: `${(doneCount / visibleQuestions.length) * 100}%` }} /></div>
            <span className="sv-progress-text">{doneCount} of {visibleQuestions.length} answered</span>
          </div>
          <button type="button" className="sv-submit" disabled={!allDone} onClick={submit}>
            {def.submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
