import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Play,
  Repeat,
  Sparkles,
  Volume2,
  Wrench,
} from 'lucide-react';
import {
  ALL_UNITS,
  buildVerbFormMix,
  getAllVerbFormExercises,
  getVerbFormByUnit,
} from '../data/curriculum';
import { VF_ENGINES, VF_SPELLING_RULES } from '../data/verbFormBank';
import { Exercise, StudentProgress, VerbFormTenseTag } from '../types';
import { speakEnglish } from '../utils/speech';

interface VerbFormStudioProps {
  progress: StudentProgress;
  onStartPractice: (title: string, exercises: Exercise[]) => void;
}

const ENGINE_ACCENTS = {
  sky: {
    step1: 'bg-sky-50 border-sky-200 text-sky-900',
    stepBadge: 'bg-sky-600 text-white',
    formulaChip: 'bg-sky-50 text-sky-900 border-sky-200',
    highlight: 'bg-sky-100 text-sky-900',
  },
  emerald: {
    step1: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    stepBadge: 'bg-emerald-600 text-white',
    formulaChip: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    highlight: 'bg-emerald-100 text-emerald-900',
  },
  indigo: {
    step1: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    stepBadge: 'bg-indigo-600 text-white',
    formulaChip: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    highlight: 'bg-indigo-100 text-indigo-900',
  },
  amber: {
    step1: 'bg-amber-50 border-amber-200 text-amber-950',
    stepBadge: 'bg-amber-500 text-white',
    formulaChip: 'bg-amber-50 text-amber-950 border-amber-200',
    highlight: 'bg-amber-100 text-amber-950',
  },
  rose: {
    step1: 'bg-rose-50 border-rose-200 text-rose-900',
    stepBadge: 'bg-rose-600 text-white',
    formulaChip: 'bg-rose-50 text-rose-900 border-rose-200',
    highlight: 'bg-rose-100 text-rose-900',
  },
};

const SPELLING_ACCENTS = {
  sky: {
    header: 'text-sky-700',
    result: 'text-sky-800 bg-sky-50 border-sky-200',
    formula: 'bg-sky-50/70 text-sky-900 border-sky-200',
  },
  emerald: {
    header: 'text-emerald-700',
    result: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    formula: 'bg-emerald-50/70 text-emerald-900 border-emerald-200',
  },
  amber: {
    header: 'text-amber-800',
    result: 'text-amber-950 bg-amber-50 border-amber-200',
    formula: 'bg-amber-50/70 text-amber-950 border-amber-200',
  },
  indigo: {
    header: 'text-indigo-700',
    result: 'text-indigo-900 bg-indigo-50 border-indigo-200',
    formula: 'bg-indigo-50/70 text-indigo-900 border-indigo-200',
  },
  rose: {
    header: 'text-rose-700',
    result: 'text-rose-900 bg-rose-50 border-rose-200',
    formula: 'bg-rose-50/70 text-rose-900 border-rose-200',
  },
};

function renderHighlightedVerb(sentence: string, highlight: string, highlightClass: string) {
  const idx = sentence.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx < 0) return <span>{sentence}</span>;
  return (
    <span>
      {sentence.slice(0, idx)}
      <span className={`px-1.5 py-0.5 rounded font-bold ${highlightClass}`}>
        {sentence.slice(idx, idx + highlight.length)}
      </span>
      {sentence.slice(idx + highlight.length)}
    </span>
  );
}

export const VerbFormStudio: React.FC<VerbFormStudioProps> = ({ progress, onStartPractice }) => {
  const [activeSubTab, setActiveSubTab] = useState<'engines' | 'spelling' | 'drills'>('engines');
  const [selectedEngineId, setSelectedEngineId] = useState<VerbFormTenseTag>('past_simple');
  const [selectedSpellingId, setSelectedSpellingId] = useState<string>('sp-ed-irreg');
  const [drillSemester, setDrillSemester] = useState<'all' | 2 | 1>('all');

  const selectedEngine = useMemo(
    () => VF_ENGINES.find((e) => e.id === selectedEngineId) ?? VF_ENGINES[0],
    [selectedEngineId]
  );

  const hk2Engines = useMemo(
    () => VF_ENGINES.filter((e) => e.badge.startsWith('HK2')),
    []
  );
  const hk1Engines = useMemo(
    () => VF_ENGINES.filter((e) => !e.badge.startsWith('HK2')),
    []
  );

  const selectedSpelling = useMemo(
    () => VF_SPELLING_RULES.find((s) => s.id === selectedSpellingId) ?? VF_SPELLING_RULES[0],
    [selectedSpellingId]
  );

  const allVf = useMemo(() => getAllVerbFormExercises(), []);
  const sem1Vf = useMemo(() => getAllVerbFormExercises(1), []);
  const sem2Vf = useMemo(() => getAllVerbFormExercises(2), []);
  const completedVfCount = useMemo(
    () => allVf.filter((e) => progress.completedExerciseIds.includes(e.id)).length,
    [allVf, progress.completedExerciseIds]
  );

  const visibleSemesters = useMemo(() => {
    if (drillSemester === 2) return [2] as const;
    if (drillSemester === 1) return [1] as const;
    return [2, 1] as const;
  }, [drillSemester]);

  const engineStyle = ENGINE_ACCENTS[selectedEngine.accent];
  const spellingStyle = SPELLING_ACCENTS[selectedSpelling.accent];

  return (
    <div className="space-y-7">
      {/* Hero Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
            Phòng Chia Động Từ Trực Quan (Verb Forms) · Chuẩn bộ đề PDF Học kỳ 1 (Unit 1–6) &amp; Học kỳ 2 (Unit 7–12)
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
            Chia động từ chuẩn 100% chỉ với quy trình 3 bước nhìn là ra ngay
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Làm chủ trọn bộ <strong className="text-slate-900">{VF_ENGINES.length} Sơ đồ 3 bước</strong>{' '}
            (thêm 4 sơ đồ mới cho HK2: Quá khứ đơn, Hiện tại hoàn thành, Điều kiện Loại 1, Could vs Was/Were able to),
            tra cứu <strong className="text-slate-900">Bảng V1–V2–V3 bất quy tắc</strong> và chinh phục kho{' '}
            <strong className="text-slate-900">{allVf.length} câu Verb Form chuẩn PDF</strong>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
          <div className="flex items-center gap-5 text-sm">
            <div>
              <p className="text-xs text-slate-500">Đã chinh phục</p>
              <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
                {completedVfCount}/{allVf.length}{' '}
                <span className="text-xs font-normal text-slate-500">câu</span>
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-500">Kho đề HK2 PDF</p>
              <p className="font-display text-xl font-bold text-sky-700 tabular-nums">
                {sem2Vf.length}{' '}
                <span className="text-xs font-normal text-slate-500">câu</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Thi thử 15 câu Chia động từ Học kỳ 2 (Unit 7–12)',
                  buildVerbFormMix(2, 15)
                )
              }
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Thi thử 15 câu HK2</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Thi thử 15 câu Chia động từ Học kỳ 1 (Unit 1–6)',
                  buildVerbFormMix(1, 15)
                )
              }
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-sky-400 text-slate-800 text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Thi thử 15 câu HK1</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3 Sub-Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        {(
          [
            {
              id: 'engines',
              label: `1. ${VF_ENGINES.length} Sơ đồ Chia động từ 3 bước`,
              icon: Repeat,
            },
            {
              id: 'spelling',
              label: `2. Xưởng Biến hình & Bảng V1–V2–V3 (${VF_SPELLING_RULES.length} xưởng)`,
              icon: Wrench,
            },
            {
              id: 'drills',
              label: `3. Kho luyện đề Verb Form (${allVf.length} câu)`,
              icon: Sparkles,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: 9 VISUAL 3-STEP VERB FORM ENGINES */}
      {activeSubTab === 'engines' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Rail Grouped by Semester */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700 px-1">
                Học kỳ 2 · Unit 7–12 ({hk2Engines.length} sơ đồ mới)
              </p>
              {hk2Engines.map((engine) => {
                const active = engine.id === selectedEngine.id;
                return (
                  <button
                    key={engine.id}
                    type="button"
                    onClick={() => setSelectedEngineId(engine.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      active
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-white border-slate-200 hover:border-sky-400 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-mono-code text-[11px] font-bold ${
                          active ? 'text-sky-300' : 'text-sky-700'
                        }`}
                      >
                        {engine.badge}
                      </span>
                      <ArrowRight
                        className={`w-4 h-4 shrink-0 ${active ? 'text-sky-300' : 'text-slate-400'}`}
                      />
                    </div>
                    <p className="font-display font-bold text-sm mt-1 leading-snug">
                      {engine.shortTitle}
                    </p>
                    <p
                      className={`text-xs mt-1 ${active ? 'text-slate-300' : 'text-slate-500'}`}
                    >
                      {engine.unitRange}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                Học kỳ 1 · Unit 1–6 ({hk1Engines.length} sơ đồ nền tảng)
              </p>
              {hk1Engines.map((engine) => {
                const active = engine.id === selectedEngine.id;
                return (
                  <button
                    key={engine.id}
                    type="button"
                    onClick={() => setSelectedEngineId(engine.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      active
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-white border-slate-200 hover:border-sky-400 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-mono-code text-[11px] font-bold ${
                          active ? 'text-sky-300' : 'text-slate-600'
                        }`}
                      >
                        {engine.badge}
                      </span>
                      <ArrowRight
                        className={`w-4 h-4 shrink-0 ${active ? 'text-sky-300' : 'text-slate-400'}`}
                      />
                    </div>
                    <p className="font-display font-bold text-sm mt-1 leading-snug">
                      {engine.shortTitle}
                    </p>
                    <p
                      className={`text-xs mt-1 ${active ? 'text-slate-300' : 'text-slate-500'}`}
                    >
                      {engine.unitRange}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Stage: 3-Step Flowchart + Formula Matrix + Mnemonic/Trap */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <p className="font-mono-code text-xs font-bold text-sky-700">
                  {selectedEngine.badge} · {selectedEngine.unitRange}
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {selectedEngine.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  onStartPractice(
                    `Luyện tập: ${selectedEngine.shortTitle}`,
                    buildVerbFormMix(selectedEngine.id, 10)
                  )
                }
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 shrink-0 self-start transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Luyện ngay 10 câu</span>
              </button>
            </div>

            {/* Visual 3-Step Flowchart */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`rounded-xl border p-4 space-y-2 ${engineStyle.step1}`}>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 tabular-nums ${engineStyle.stepBadge}`}
                  >
                    1
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider">Soi Dấu hiệu</p>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed font-medium">
                  {selectedEngine.step1Signals}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                    2
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Soi Chủ ngữ / Từ đứng trước
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {selectedEngine.step2SubjectCheck}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                    3
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Chia Công thức
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {selectedEngine.step3Action}
                </p>
              </div>
            </div>

            {/* Interactive Formula Matrix with Clickable Audio */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Bảng Công thức &amp; Ví dụ chuẩn PDF (chạm loa để nghe phát âm)
              </p>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                {selectedEngine.rows.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white hover:bg-slate-50/70 transition-colors flex flex-col gap-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {row.kind}
                      </span>
                      <span
                        className={`font-mono-code text-xs sm:text-sm font-bold px-2.5 py-1 rounded-lg border ${engineStyle.formulaChip}`}
                      >
                        {row.formula}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3 pt-1">
                      <div className="space-y-0.5">
                        <p className="font-display text-sm sm:text-base text-slate-900 leading-relaxed">
                          {renderHighlightedVerb(row.example, row.highlight, engineStyle.highlight)}
                        </p>
                        <p className="text-xs text-slate-500">{row.meaning}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => speakEnglish(row.example, { rate: 0.9 })}
                        title="Nghe câu ví dụ"
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-sky-50 hover:border-sky-400 text-slate-600 hover:text-sky-700 shrink-0 transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mnemonic & Trap Warning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900">
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wider">Mẹo nhớ siêu tốc</p>
                </div>
                <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                  {selectedEngine.mnemonic}
                </p>
              </div>

              <div className="rounded-xl bg-rose-50/90 border border-rose-200 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-900">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wider">Cẩn thận bẫy đề thi</p>
                </div>
                <p className="text-xs sm:text-sm text-rose-950 leading-relaxed">
                  {selectedEngine.trapWarning}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPELLING & NEGATIVE / QUESTION TRANSFORMATION WORKSHOP */}
      {activeSubTab === 'spelling' && (
        <div className="space-y-5">
          {/* Workshop Selector Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {VF_SPELLING_RULES.map((group) => {
              const active = group.id === selectedSpelling.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedSpellingId(group.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    active
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-white border-slate-200 hover:border-sky-400 text-slate-900'
                  }`}
                >
                  <p className="font-display font-bold text-xs sm:text-sm leading-snug">
                    {group.title}
                  </p>
                  <p className={`text-[11px] mt-1 line-clamp-2 ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                    {group.subtitle}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Spelling Rule Cards */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${spellingStyle.header}`}>
                  Xưởng Biến hình Chính tả &amp; Cấu trúc
                </p>
                <h2 className="font-display text-xl font-bold text-slate-900 mt-1">
                  {selectedSpelling.title}
                </h2>
              </div>
              <p className="text-xs text-slate-500">Chạm từng thẻ từ để nghe đọc chuẩn Tiếng Anh</p>
            </div>

            <div className="space-y-4">
              {selectedSpelling.rules.map((rule, rIdx) => (
                <div
                  key={rIdx}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-3.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="font-display font-bold text-sm sm:text-base text-slate-900">
                      {rule.ruleLabel}
                    </h3>
                    <span
                      className={`font-mono-code text-xs font-bold px-2.5 py-1 rounded-lg border self-start sm:self-auto ${spellingStyle.formula}`}
                    >
                      {rule.formula}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {rule.examples.map((ex, eIdx) => (
                      <button
                        key={eIdx}
                        type="button"
                        onClick={() => speakEnglish(ex.result, { rate: 0.88 })}
                        className="text-left p-3.5 rounded-xl bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 transition-all group space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5 font-mono-code text-xs sm:text-sm">
                            <span className="text-slate-600 font-medium">{ex.base}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span
                              className={`px-2 py-0.5 rounded-md border font-bold ${spellingStyle.result}`}
                            >
                              {ex.result}
                            </span>
                          </div>
                          <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-700 shrink-0" />
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">{ex.note}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SPECIALTY DRILLS & 12-UNIT PROGRESS MATRIX */}
      {activeSubTab === 'drills' && (
        <div className="space-y-6">
          {/* 4 Specialty Practice Decks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <p className="font-mono-code text-[11px] font-bold text-sky-300">
                  TỔNG HỢP HỌC KỲ 2 · MỚI
                </p>
                <h3 className="font-display font-bold text-base">
                  Thi thử 15 câu Verb Form HK2
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Trộn đều từ kho {sem2Vf.length} câu chuẩn PDF Unit 7–12 (QKĐ, HTHT, Điều kiện 1, Could/Able to).
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onStartPractice(
                    'Thi thử 15 câu Chia động từ HK2 (Unit 7–12)',
                    buildVerbFormMix(2, 15)
                  )
                }
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Bắt đầu ngay</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <p className="font-mono-code text-[11px] font-bold text-emerald-700">
                  CHUYÊN ĐỀ HAY NHẦM NHẤT HK2
                </p>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Quá khứ đơn vs Hiện tại hoàn thành
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  12 câu đối chiếu mốc đóng (yesterday, ago) với kéo dài (since, for, yet, ever).
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onStartPractice(
                    'Chuyên đề: Quá khứ đơn vs Hiện tại hoàn thành',
                    buildVerbFormMix(['past_simple', 'present_perfect'], 12)
                  )
                }
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Luyện 12 câu</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <p className="font-mono-code text-[11px] font-bold text-sky-700">
                  UNIT 11 – 12 TRỌNG TÂM
                </p>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Điều kiện Loại 1 &amp; Could / Able to
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  12 câu luyện chắc If + HTĐ / Will + V và phân biệt could vs was/were able to.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onStartPractice(
                    'Chuyên đề: Điều kiện Loại 1 & Could / Be able to',
                    buildVerbFormMix(['conditional_type1', 'ability_modals'], 12)
                  )
                }
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Luyện 12 câu</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <p className="font-mono-code text-[11px] font-bold text-amber-800">
                  TỔNG HỢP HỌC KỲ 1
                </p>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Thi thử 15 câu Verb Form HK1
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ôn chắc kho {sem1Vf.length} câu chuẩn PDF Unit 1–6 (HTĐ, HTTD, Will, V-ing, Must/Should).
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onStartPractice(
                    'Thi thử 15 câu Chia động từ HK1 (Unit 1–6)',
                    buildVerbFormMix(1, 15)
                  )
                }
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Luyện 15 câu HK1</span>
              </button>
            </div>
          </div>

          {/* Semester Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <h3 className="font-display font-bold text-lg text-slate-900">
              Kho luyện Chia động từ theo từng Unit (Unit 1 – Unit 12)
            </h3>
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-xl p-1 self-start">
              {(
                [
                  { id: 'all', label: 'Tất cả 12 Unit' },
                  { id: 2, label: 'Học kỳ 2 (7–12)' },
                  { id: 1, label: 'Học kỳ 1 (1–6)' },
                ] as const
              ).map((seg) => {
                const active = drillSemester === seg.id;
                return (
                  <button
                    key={String(seg.id)}
                    type="button"
                    onClick={() => setDrillSemester(seg.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {seg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 12-Unit Progress Grid */}
          {visibleSemesters.map((sem) => {
            const semUnits = ALL_UNITS.filter((u) => u.semester === sem);
            return (
              <div key={sem} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm sm:text-base text-slate-800">
                    {sem === 2
                      ? 'Học kỳ 2 (Unit 7 – Unit 12) · Kho đề chuẩn PDF (15 câu/Unit)'
                      : 'Học kỳ 1 (Unit 1 – Unit 6) · Kho đề chuẩn PDF (15 câu/Unit)'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {semUnits.map((unit) => {
                    const unitVfs = getVerbFormByUnit(unit.id);
                    const done = unitVfs.filter((e) =>
                      progress.completedExerciseIds.includes(e.id)
                    ).length;
                    const pct = unitVfs.length > 0 ? Math.round((done / unitVfs.length) * 100) : 0;
                    const allDone = unitVfs.length > 0 && done === unitVfs.length;

                    return (
                      <div
                        key={unit.id}
                        className="bg-white border border-slate-200 hover:border-sky-400 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono-code text-xs font-bold text-sky-700">
                              UNIT {unit.id}
                            </span>
                            {allDone ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Hoàn thành
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-slate-500 tabular-nums">
                                {done}/{unitVfs.length} câu
                              </span>
                            )}
                          </div>
                          <p className="font-display font-bold text-sm text-slate-900 leading-snug">
                            {unit.titleEn}
                          </p>
                          <p className="text-xs text-slate-500">{unit.titleVi}</p>
                        </div>

                        <div className="space-y-2.5">
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                allDone ? 'bg-emerald-500' : 'bg-sky-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          <button
                            type="button"
                            disabled={unitVfs.length === 0}
                            onClick={() =>
                              onStartPractice(
                                `Chia động từ · Unit ${unit.id}: ${unit.titleEn}`,
                                unitVfs
                              )
                            }
                            className="w-full py-2 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 text-slate-800 hover:text-sky-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Luyện {unitVfs.length} câu Unit {unit.id}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
