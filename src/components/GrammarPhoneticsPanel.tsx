import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, Lightbulb, Volume2 } from 'lucide-react';
import { FormulaRole, GrammarPoint, PhoneticGuide } from '../types';
import { speakEnglish } from '../utils/speech';

interface GrammarPhoneticsPanelProps {
  grammar: GrammarPoint[];
  phonetics: PhoneticGuide;
  onOpenPhoneticsStudio?: (mode?: 'pronunciation' | 'stress') => void;
}

const ROLE_STYLES: Record<FormulaRole, string> = {
  subject: 'bg-sky-50 border-sky-200 text-sky-900',
  aux: 'bg-amber-50 border-amber-200 text-amber-900',
  verb: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  object: 'bg-slate-100 border-slate-200 text-slate-800',
  keyword: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  connector: 'bg-rose-50 border-rose-200 text-rose-900',
};

function renderHighlightedWord(word: string, highlight: string) {
  const idx = word.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return <span>{word}</span>;
  const before = word.slice(0, idx);
  const match = word.slice(idx, idx + highlight.length);
  const after = word.slice(idx + highlight.length);
  return (
    <span>
      {before}
      <span className="underline decoration-2 decoration-sky-600 underline-offset-4 text-sky-700 font-bold">
        {match}
      </span>
      {after}
    </span>
  );
}

export const GrammarPhoneticsPanel: React.FC<GrammarPhoneticsPanelProps> = ({
  grammar,
  phonetics,
  onOpenPhoneticsStudio,
}) => {
  // Track selected form tab per grammar card for interactive bite-sized learning
  const [selectedFormIdx, setSelectedFormIdx] = useState<Record<string, number>>({});

  return (
    <div className="space-y-8">
      {/* Visual Grammar Formula Cards */}
      <div className="space-y-5">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-900">
            Sơ đồ Ngữ pháp trọng tâm
          </h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Chạm từng dạng công thức để xem cấu trúc màu trực quan và bấm nghe ví dụ chuẩn.
          </p>
        </div>

        <div className="space-y-5">
          {grammar.map((point) => {
            const activeIdx = selectedFormIdx[point.id] ?? 0;
            const activeForm = point.forms[activeIdx] ?? point.forms[0];

            return (
              <div
                key={point.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h4 className="font-display text-lg font-bold text-slate-900">{point.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{point.summary}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-400 shrink-0">
                    {point.englishTitle}
                  </span>
                </div>

                {/* Form Tabs */}
                {point.forms.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
                    {point.forms.map((form, idx) => (
                      <button
                        key={form.label}
                        type="button"
                        onClick={() =>
                          setSelectedFormIdx((prev) => ({ ...prev, [point.id]: idx }))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                          idx === activeIdx
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {form.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Visual Color-Coded Formula Stage */}
                {activeForm && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {activeForm.formula.map((token, i) => (
                        <React.Fragment key={`${token.text}-${i}`}>
                          <span
                            className={`px-3 py-1.5 rounded-lg border font-mono-code text-xs sm:text-sm font-semibold ${
                              ROLE_STYLES[token.role]
                            }`}
                          >
                            {token.text}
                          </span>
                          {i < activeForm.formula.length - 1 && (
                            <span className="text-slate-400 font-bold text-sm">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm sm:text-base font-semibold text-slate-900">
                          {activeForm.example}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-600">{activeForm.exampleVi}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => speakEnglish(activeForm.example, { rate: 0.92 })}
                        title="Nghe câu ví dụ"
                        className="p-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 shrink-0 transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Signal words inline */}
                {point.signalWords && point.signalWords.length > 0 && (
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Dấu hiệu nhận biết: </span>
                    <span className="font-mono-code text-xs sm:text-sm text-sky-800">
                      {point.signalWords.join('  ·  ')}
                    </span>
                  </div>
                )}

                {/* Memory Tip & Common Mistake Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                      <strong className="font-semibold">Mẹo nhớ nhanh: </strong>
                      {point.memoryTip}
                    </div>
                  </div>

                  {point.commonMistake && (
                    <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3.5 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm text-rose-950 space-y-1 leading-relaxed">
                        <p>
                          <strong className="font-semibold">Tránh lỗi sai: </strong>
                          <span className="line-through text-rose-700">
                            {point.commonMistake.wrong}
                          </span>{' '}
                          →{' '}
                          <span className="font-semibold text-emerald-800">
                            {point.commonMistake.right}
                          </span>
                        </p>
                        <p className="text-xs text-rose-800">{point.commonMistake.reason}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Phonetics / Stress Lab */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              Phòng thực hành Phát âm &amp; Trọng âm
            </p>
            <h3 className="font-display text-xl font-bold text-slate-900 mt-1">{phonetics.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{phonetics.description}</p>
          </div>
          {onOpenPhoneticsStudio && (
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
              <button
                type="button"
                onClick={() => onOpenPhoneticsStudio('pronunciation')}
                className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <span>Phòng Ngữ Âm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onOpenPhoneticsStudio('stress')}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
              >
                <span>Phòng Trọng Âm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phonetics.groups.map((group) => (
            <div
              key={group.symbol}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5"
            >
              <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-slate-200/80">
                <span className="font-mono-code text-xl font-bold text-sky-700">
                  {group.symbol}
                </span>
                <span className="text-xs font-semibold text-slate-700 text-right">
                  {group.vietnameseCue}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{group.rule}</p>

              <div className="grid grid-cols-2 gap-2">
                {group.examples.map((ex) => (
                  <button
                    key={ex.word}
                    type="button"
                    onClick={() => speakEnglish(ex.word, { rate: 0.85 })}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-sky-400 text-left flex items-center justify-between gap-2 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {renderHighlightedWord(ex.word, ex.highlight)}
                      </p>
                      <p className="font-mono-code text-[11px] text-slate-500 truncate">{ex.ipa}</p>
                      <p className="text-[11px] text-slate-600 truncate">{ex.meaning}</p>
                    </div>
                    <Volume2 className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
