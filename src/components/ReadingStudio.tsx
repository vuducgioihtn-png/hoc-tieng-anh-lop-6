import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  FileText,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  XCircle,
} from 'lucide-react';
import { ALL_UNITS, getAllReadingExercises, getReadingByUnit } from '../data/curriculum';
import {
  ClozeExerciseItem,
  PDF_CLOZE_EXERCISES,
  READING_STRATEGIES,
  ReadingStrategyCard,
} from '../data/readingBank';
import { Exercise, StudentProgress } from '../types';
import { speakEnglish, stopSpeaking } from '../utils/speech';

interface ReadingStudioProps {
  progress: StudentProgress;
  onStartPractice: (title: string, exercises: Exercise[]) => void;
}

const STRATEGY_ACCENTS = {
  sky: {
    step1: 'bg-sky-50 border-sky-200 text-sky-900',
    badge: 'bg-sky-600 text-white',
  },
  emerald: {
    step1: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    badge: 'bg-emerald-600 text-white',
  },
  amber: {
    step1: 'bg-amber-50 border-amber-200 text-amber-950',
    badge: 'bg-amber-500 text-white',
  },
  rose: {
    step1: 'bg-rose-50 border-rose-200 text-rose-900',
    badge: 'bg-rose-600 text-white',
  },
  indigo: {
    step1: 'bg-indigo-50 border-indigo-200 text-indigo-950',
    badge: 'bg-indigo-600 text-white',
  },
  violet: {
    step1: 'bg-violet-50 border-violet-200 text-violet-950',
    badge: 'bg-violet-600 text-white',
  },
};

function renderHighlightedEvidence(snippet: string, evidence: string) {
  const idx = snippet.toLowerCase().indexOf(evidence.toLowerCase());
  if (idx < 0) return <span>{snippet}</span>;
  return (
    <span>
      {snippet.slice(0, idx)}
      <mark className="bg-amber-200 text-slate-950 font-bold px-1 py-0.5 rounded">
        {snippet.slice(idx, idx + evidence.length)}
      </mark>
      {snippet.slice(idx + evidence.length)}
    </span>
  );
}

function buildFullClozeSpeech(cloze: ClozeExerciseItem): string {
  return cloze.template.replace(/\{\{(\d+)\}\}/g, (_, numStr) => {
    const blank = cloze.blanks.find((b) => b.num === Number(numStr));
    return blank ? blank.answer : '';
  });
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const ReadingStudio: React.FC<ReadingStudioProps> = ({ progress, onStartPractice }) => {
  const [activeSubTab, setActiveSubTab] = useState<'strategies' | 'cloze' | 'library'>('strategies');
  const [selectedStrategyId, setSelectedStrategyId] = useState<ReadingStrategyCard['id']>('vocab_ref');

  // Cloze interactive lab state (Tab 2)
  const [clozeSemester, setClozeSemester] = useState<1 | 2>(2);
  const hk2Clozes = useMemo(
    () => PDF_CLOZE_EXERCISES.filter((c) => (c.semester ?? (c.unitId >= 7 ? 2 : 1)) === 2),
    []
  );
  const hk1Clozes = useMemo(
    () => PDF_CLOZE_EXERCISES.filter((c) => (c.semester ?? (c.unitId >= 7 ? 2 : 1)) === 1),
    []
  );
  const visibleClozes = clozeSemester === 2 ? hk2Clozes : hk1Clozes;

  const [selectedClozeId, setSelectedClozeId] = useState<string>(
    hk2Clozes[0]?.id ?? PDF_CLOZE_EXERCISES[0].id
  );
  const [clozeAnswers, setClozeAnswers] = useState<Record<string, Record<number, string>>>({});
  const [clozeChecked, setClozeChecked] = useState<Record<string, boolean>>({});
  const [activeBlankNum, setActiveBlankNum] = useState<number>(1);
  const [showClozeSummary, setShowClozeSummary] = useState<boolean>(false);
  const [showClozeHint, setShowClozeHint] = useState<boolean>(false);

  // Library filter state (Tab 3)
  const [librarySemester, setLibrarySemester] = useState<'all' | 2 | 1>('all');
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'comprehension' | 'true_false'>('all');

  const selectedStrategy = useMemo(
    () => READING_STRATEGIES.find((s) => s.id === selectedStrategyId) ?? READING_STRATEGIES[0],
    [selectedStrategyId]
  );

  const selectedCloze = useMemo(
    () => PDF_CLOZE_EXERCISES.find((c) => c.id === selectedClozeId) ?? PDF_CLOZE_EXERCISES[0],
    [selectedClozeId]
  );

  const allReadings = useMemo(() => getAllReadingExercises(), []);
  const sem1Readings = useMemo(() => getAllReadingExercises(1), []);
  const sem2Readings = useMemo(() => getAllReadingExercises(2), []);
  const completedReadingCount = useMemo(
    () => allReadings.filter((e) => progress.completedExerciseIds.includes(e.id)).length,
    [allReadings, progress.completedExerciseIds]
  );

  const strategyStyle = STRATEGY_ACCENTS[selectedStrategy.accent];

  // Current Cloze derived values
  const currentAnswers = clozeAnswers[selectedCloze.id] ?? {};
  const isClozeSubmitted = Boolean(clozeChecked[selectedCloze.id]);
  const activeBlankObj =
    selectedCloze.blanks.find((b) => b.num === activeBlankNum) ?? selectedCloze.blanks[0];

  const filledCount = Object.values(currentAnswers).filter(Boolean).length;
  const correctClozeCount = isClozeSubmitted
    ? selectedCloze.blanks.filter(
        (b) => (currentAnswers[b.num] ?? '').toLowerCase() === b.answer.toLowerCase()
      ).length
    : 0;

  const usedWordBoxItems = useMemo(() => {
    if (selectedCloze.mode !== 'word_box') return new Set<string>();
    return new Set(Object.values(currentAnswers).filter(Boolean).map((v) => v.toLowerCase()));
  }, [currentAnswers, selectedCloze.mode]);

  const handleSelectClozePassage = (id: string) => {
    stopSpeaking();
    setSelectedClozeId(id);
    setActiveBlankNum(1);
    setShowClozeSummary(false);
    setShowClozeHint(false);
  };

  const handleFillBlank = (blankNum: number, word: string) => {
    if (isClozeSubmitted) return;
    setClozeAnswers((prev) => ({
      ...prev,
      [selectedCloze.id]: {
        ...(prev[selectedCloze.id] ?? {}),
        [blankNum]: word,
      },
    }));
    setShowClozeHint(false);
    // Automatically jump to next unfilled blank for smooth UX
    const nextBlank = selectedCloze.blanks.find(
      (b) => b.num > blankNum && !(currentAnswers[b.num] ?? '')
    );
    if (nextBlank) {
      setActiveBlankNum(nextBlank.num);
    }
  };

  const handleClearBlank = (blankNum: number) => {
    if (isClozeSubmitted) return;
    setClozeAnswers((prev) => {
      const nextMap = { ...(prev[selectedCloze.id] ?? {}) };
      delete nextMap[blankNum];
      return { ...prev, [selectedCloze.id]: nextMap };
    });
    setActiveBlankNum(blankNum);
  };

  const handleResetCloze = () => {
    stopSpeaking();
    setClozeAnswers((prev) => ({ ...prev, [selectedCloze.id]: {} }));
    setClozeChecked((prev) => ({ ...prev, [selectedCloze.id]: false }));
    setActiveBlankNum(1);
    setShowClozeHint(false);
  };

  const renderClozeParagraphs = () => {
    const paragraphs = selectedCloze.template.split('\n\n');
    return paragraphs.map((para, pIdx) => {
      const parts = para.split(/(\{\{\d+\}\})/g);
      return (
        <p key={pIdx} className="text-sm sm:text-base text-slate-800 leading-[2.1]">
          {parts.map((part, idx) => {
            const match = part.match(/^\{\{(\d+)\}\}$/);
            if (!match) return <span key={idx}>{part}</span>;
            const num = Number(match[1]);
            const blank = selectedCloze.blanks.find((b) => b.num === num);
            const userVal = currentAnswers[num] ?? '';
            const isSelected = activeBlankNum === num;
            const isCorrect =
              isClozeSubmitted &&
              blank &&
              userVal.toLowerCase() === blank.answer.toLowerCase();

            let slotClass =
              'bg-white border-slate-300 text-slate-600 hover:border-sky-500 hover:bg-sky-50';
            if (isClozeSubmitted) {
              slotClass = isCorrect
                ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold'
                : 'bg-rose-100 border-rose-400 text-rose-900 font-bold';
            } else if (isSelected) {
              slotClass = 'bg-sky-600 border-sky-600 text-white font-bold shadow-xs';
            } else if (userVal) {
              slotClass = 'bg-sky-50 border-sky-400 text-sky-900 font-semibold';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (!isClozeSubmitted && userVal && selectedCloze.mode === 'word_box' && isSelected) {
                    handleClearBlank(num);
                  } else {
                    setActiveBlankNum(num);
                    setShowClozeHint(false);
                  }
                }}
                className={`inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-lg border-2 font-mono-code text-xs sm:text-sm align-baseline transition-all ${slotClass}`}
                title={
                  isClozeSubmitted
                    ? `Đáp án đúng: ${blank?.answer}`
                    : userVal
                      ? 'Chạm để chọn hoặc đổi từ'
                      : `Chạm để điền chỗ trống (${num})`
                }
              >
                <span className="opacity-75 text-[11px]">({num})</span>
                <span>
                  {isClozeSubmitted && !isCorrect
                    ? `${userVal || '___'} → ${blank?.answer}`
                    : userVal || '______'}
                </span>
              </button>
            );
          })}
        </p>
      );
    });
  };

  return (
    <div className="space-y-7">
      {/* Hero Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
            Phòng Đọc Hiểu Trực Quan (Reading Studio) · Chuẩn bộ đề PDF Unit 1 – 6 &amp; 7 – 12
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
            Đọc hiểu nhẹ nhàng: Soi dẫn chứng tô sáng trực tiếp ngay trong đoạn văn
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Làm chủ <strong className="text-slate-900">{READING_STRATEGIES.length} kỹ thuật Đọc hiểu</strong>{' '}
            (Lấy ý chính · Quét từ khóa · Đúng/Sai · Cloze · Đoán từ mới &amp; Quy chiếu · So sánh Đa thành phố),
            thực hành <strong className="text-slate-900">{PDF_CLOZE_EXERCISES.length} bài Cloze HK1–HK2</strong> và kho{' '}
            <strong className="text-slate-900">{allReadings.length} bài đọc chuẩn PDF</strong> có
            nghe đọc, từ vựng chú thích và tóm tắt Tiếng Việt.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
          <div className="flex items-center gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Đã chinh phục</p>
              <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
                {completedReadingCount}/{allReadings.length}{' '}
                <span className="text-xs font-normal text-slate-500">bài</span>
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-500">Kho HK2 PDF</p>
              <p className="font-display text-xl font-bold text-indigo-700 tabular-nums">
                {sem2Readings.length}{' '}
                <span className="text-xs font-normal text-slate-500">bài</span>
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-500">Kho HK1 PDF</p>
              <p className="font-display text-xl font-bold text-sky-700 tabular-nums">
                {sem1Readings.length}{' '}
                <span className="text-xs font-normal text-slate-500">bài</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const target =
                  sem2Readings.find((r) => !progress.completedExerciseIds.includes(r.id)) ??
                  sem2Readings[0];
                if (target) {
                  onStartPractice(`Đọc hiểu HK2 · Unit ${target.unitId}: ${target.title}`, [target]);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors shadow-xs"
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>Luyện 1 bài Đọc hiểu HK2</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const target =
                  sem1Readings.find((r) => !progress.completedExerciseIds.includes(r.id)) ??
                  sem1Readings[0];
                if (target) {
                  onStartPractice(`Đọc hiểu HK1 · Unit ${target.unitId}: ${target.title}`, [target]);
                }
              }}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <span>Bài đọc HK1</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3 Sub-Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        {(
          [
            {
              id: 'strategies',
              label: `1. ${READING_STRATEGIES.length} Kỹ thuật Đọc hiểu Siêu tốc (HK1 & HK2)`,
              icon: BookOpen,
            },
            {
              id: 'cloze',
              label: `2. Phòng Đọc Điền từ Trực quan (${PDF_CLOZE_EXERCISES.length} bài Cloze PDF)`,
              icon: FileText,
            },
            {
              id: 'library',
              label: `3. Thư viện Đọc hiểu chuẩn PDF (${allReadings.length} bài đọc)`,
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
              onClick={() => {
                stopSpeaking();
                setActiveSubTab(tab.id);
              }}
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

      {/* TAB 1: 4 VISUAL READING PLAYBOOKS */}
      {activeSubTab === 'strategies' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Rail */}
          <aside className="lg:col-span-4 space-y-2">
            {READING_STRATEGIES.map((strat) => {
              const active = strat.id === selectedStrategy.id;
              return (
                <button
                  key={strat.id}
                  type="button"
                  onClick={() => setSelectedStrategyId(strat.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
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
                      {strat.code}
                    </span>
                    <ArrowRight
                      className={`w-4 h-4 shrink-0 ${active ? 'text-sky-300' : 'text-slate-400'}`}
                    />
                  </div>
                  <p className="font-display font-bold text-sm sm:text-base mt-1 leading-snug">
                    {strat.shortTitle}
                  </p>
                </button>
              );
            })}
          </aside>

          {/* Right Stage */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <p className="font-mono-code text-xs font-bold text-sky-700">
                  {selectedStrategy.code}
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {selectedStrategy.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setActiveSubTab(selectedStrategy.id === 'cloze' ? 'cloze' : 'library')
                }
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 shrink-0 self-start transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Thực hành ngay</span>
              </button>
            </div>

            {/* 3-Step Visual Flowchart */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`rounded-xl border p-4 space-y-2 ${strategyStyle.step1}`}>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 tabular-nums ${strategyStyle.badge}`}
                  >
                    1
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider">Bước 1: Định vị</p>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed font-medium">
                  {selectedStrategy.step1}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                    2
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Bước 2: Soi dẫn chứng
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {selectedStrategy.step2}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                    3
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Bước 3: Chốt đáp án
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {selectedStrategy.step3}
                </p>
              </div>
            </div>

            {/* Live Visual Evidence Demo from Real PDF */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ví dụ trực quan trích từ bộ đề PDF lớp 6
                </p>
                <button
                  type="button"
                  onClick={() => speakEnglish(selectedStrategy.demoPassageSnippet, { rate: 0.9 })}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-sky-50 hover:border-sky-400 text-slate-600 hover:text-sky-700 transition-colors"
                  title="Nghe đoạn trích"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <p className="font-display font-bold text-sm sm:text-base text-slate-900">
                Câu hỏi: {selectedStrategy.demoQuestion}
              </p>

              <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm sm:text-base text-slate-800 leading-relaxed">
                “{renderHighlightedEvidence(
                  selectedStrategy.demoPassageSnippet,
                  selectedStrategy.demoEvidence
                )}”
              </div>

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 space-y-1">
                <p className="text-xs sm:text-sm font-bold text-emerald-950 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đáp án chuẩn: {selectedStrategy.demoAnswer}</span>
                </p>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  {selectedStrategy.demoWhy}
                </p>
              </div>
            </div>

            {/* Mnemonic & Trap Warning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900">
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wider">Mẹo đọc siêu tốc</p>
                </div>
                <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                  {selectedStrategy.mnemonic}
                </p>
              </div>

              <div className="rounded-xl bg-rose-50/90 border border-rose-200 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-900">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wider">Bẫy dễ mất điểm</p>
                </div>
                <p className="text-xs sm:text-sm text-rose-950 leading-relaxed">
                  {selectedStrategy.trapWarning}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE CLOZE LAB (10 REAL PDF PASSAGES · HK2 & HK1) */}
      {activeSubTab === 'cloze' && (
        <div className="space-y-5">
          {/* Semester Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
              {(
                [
                  { id: 2 as const, label: `Học kỳ 2 (Unit 7–12 · ${hk2Clozes.length} bài)` },
                  { id: 1 as const, label: `Học kỳ 1 (Unit 1–6 · ${hk1Clozes.length} bài)` },
                ]
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setClozeSemester(s.id);
                    const nextList = s.id === 2 ? hk2Clozes : hk1Clozes;
                    if (nextList[0]) {
                      handleSelectClozePassage(nextList[0].id);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    clozeSemester === s.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-500">
              Chạm trực tiếp vào chỗ trống hoặc từ trong hộp để điền — chấm điểm và giải thích từng ô.
            </p>
          </div>

          {/* Cloze Passage Selector Cards */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${
              clozeSemester === 2 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
            }`}
          >
            {visibleClozes.map((cloze) => {
              const active = cloze.id === selectedCloze.id;
              const filled = Object.values(clozeAnswers[cloze.id] ?? {}).filter(Boolean).length;
              const checked = Boolean(clozeChecked[cloze.id]);
              return (
                <button
                  key={cloze.id}
                  type="button"
                  onClick={() => handleSelectClozePassage(cloze.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    active
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-white border-slate-200 hover:border-sky-400 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono-code font-bold">
                    <span className={active ? 'text-sky-300' : 'text-sky-700'}>
                      UNIT {cloze.unitId} · {cloze.mode === 'mcq' ? 'TRẮC NGHIỆM' : 'HỘP TỪ'}
                    </span>
                    <span
                      className={`tabular-nums ${
                        checked
                          ? active
                            ? 'text-emerald-300'
                            : 'text-emerald-700'
                          : active
                            ? 'text-slate-300'
                            : 'text-slate-500'
                      }`}
                    >
                      {filled}/{cloze.blanks.length}
                    </span>
                  </div>
                  <p className="font-display font-bold text-sm mt-1 leading-snug line-clamp-2">
                    {cloze.title}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Cloze Two-Zone Workspace */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-sky-700">
                  {selectedCloze.sourceLabel} · {selectedCloze.blanks.length} chỗ trống
                </p>
                <h2 className="font-display text-xl font-bold text-slate-900 mt-1">
                  {selectedCloze.title}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowClozeSummary((v) => !v)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showClozeSummary ? 'Ẩn tóm tắt' : 'Tóm tắt Tiếng Việt'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => speakEnglish(buildFullClozeSpeech(selectedCloze), { rate: 0.88 })}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-sky-50 hover:border-sky-400 text-slate-700 hover:text-sky-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Nghe bài đọc</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetCloze}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại</span>
                </button>
              </div>
            </div>

            {showClozeSummary && (
              <div className="rounded-xl bg-sky-50/80 border border-sky-200 p-4 text-xs sm:text-sm text-sky-950 leading-relaxed">
                <strong>Tóm tắt nội dung bài đọc: </strong>
                {selectedCloze.vietnameseSummary}
              </div>
            )}

            {/* Word-Box Bank (if mode === 'word_box') */}
            {selectedCloze.mode === 'word_box' && selectedCloze.wordBox && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <p className="font-semibold text-slate-700">
                    Hộp từ cho sẵn — Đang chọn chỗ trống{' '}
                    <strong className="font-mono-code text-sky-700">({activeBlankNum})</strong>:
                    Chạm vào 1 từ bên dưới để điền
                  </p>
                  {!isClozeSubmitted && currentAnswers[activeBlankNum] && (
                    <button
                      type="button"
                      onClick={() => handleClearBlank(activeBlankNum)}
                      className="text-rose-700 hover:text-rose-900 font-semibold"
                    >
                      Xóa từ ở ô ({activeBlankNum})
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedCloze.wordBox.map((word) => {
                    const isUsed = usedWordBoxItems.has(word.toLowerCase());
                    return (
                      <button
                        key={word}
                        type="button"
                        disabled={isClozeSubmitted || isUsed}
                        onClick={() => handleFillBlank(activeBlankNum, word)}
                        className={`px-3.5 py-2 rounded-xl border font-mono-code text-sm font-semibold transition-all ${
                          isUsed
                            ? 'bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed'
                            : 'bg-white border-slate-300 hover:border-sky-500 hover:bg-sky-50 text-slate-900 shadow-xs'
                        }`}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Two-Zone Split: Interactive Passage (Left) + Control / Options / Explanations (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
                {renderClozeParagraphs()}

                {/* Clickable Glossary */}
                {selectedCloze.glossary.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Từ vựng chú thích (chạm từ để nghe phát âm)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {selectedCloze.glossary.map((g) => (
                        <button
                          key={g.word}
                          type="button"
                          onClick={() => speakEnglish(g.word, { rate: 0.85 })}
                          className="text-left text-xs sm:text-sm text-slate-700 hover:text-sky-800 inline-flex items-center gap-1.5 py-1 transition-colors"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>
                            <strong className="text-slate-900">{g.word}</strong>: {g.meaning}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Interactive Control Panel */}
              <div className="lg:col-span-5 space-y-4">
                {/* Quick Number Navigator 1..8 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      Chọn nhanh chỗ trống ({filledCount}/{selectedCloze.blanks.length})
                    </span>
                    {!isClozeSubmitted && (
                      <button
                        type="button"
                        onClick={() => setShowClozeHint((h) => !h)}
                        className="text-amber-800 hover:text-amber-950 font-semibold inline-flex items-center gap-1"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>{showClozeHint ? 'Ẩn gợi ý' : `Gợi ý ô (${activeBlankNum})`}</span>
                      </button>
                    )}
                  </div>

                  <div
                    className={`grid gap-2 ${
                      selectedCloze.blanks.length > 8 ? 'grid-cols-5' : 'grid-cols-4'
                    }`}
                  >
                    {selectedCloze.blanks.map((b) => {
                      const val = currentAnswers[b.num];
                      const active = activeBlankNum === b.num;
                      const ok =
                        isClozeSubmitted &&
                        (val ?? '').toLowerCase() === b.answer.toLowerCase();
                      let cls = 'bg-white border-slate-200 text-slate-700 hover:border-sky-400';
                      if (isClozeSubmitted) {
                        cls = ok
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                          : 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                      } else if (active) {
                        cls = 'bg-slate-900 border-slate-900 text-white font-bold';
                      } else if (val) {
                        cls = 'bg-sky-50 border-sky-400 text-sky-900 font-semibold';
                      }
                      return (
                        <button
                          key={b.num}
                          type="button"
                          onClick={() => {
                            setActiveBlankNum(b.num);
                            setShowClozeHint(false);
                          }}
                          className={`py-2 rounded-lg border text-xs font-mono-code tabular-nums transition-colors ${cls}`}
                        >
                          ({b.num})
                        </button>
                      );
                    })}
                  </div>

                  {showClozeHint && !isClozeSubmitted && activeBlankObj && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-950 leading-relaxed">
                      <strong>Gợi ý ô ({activeBlankObj.num}):</strong> {activeBlankObj.hint}
                    </div>
                  )}

                  {/* MCQ Options Deck for active blank */}
                  {selectedCloze.mode === 'mcq' && activeBlankObj?.options && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-semibold text-slate-600">
                        Chọn đáp án cho chỗ trống ({activeBlankObj.num}):
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {activeBlankObj.options.map((opt, oIdx) => {
                          const picked =
                            (currentAnswers[activeBlankObj.num] ?? '').toLowerCase() ===
                            opt.toLowerCase();
                          const isRight =
                            opt.toLowerCase() === activeBlankObj.answer.toLowerCase();
                          let optCls =
                            'bg-white border-slate-200 hover:border-sky-400 text-slate-800';
                          if (isClozeSubmitted) {
                            if (isRight) {
                              optCls =
                                'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
                            } else if (picked) {
                              optCls = 'bg-rose-50 border-rose-400 text-rose-900';
                            }
                          } else if (picked) {
                            optCls = 'bg-sky-50 border-sky-600 text-sky-950 font-semibold';
                          }
                          return (
                            <button
                              key={opt}
                              type="button"
                              disabled={isClozeSubmitted}
                              onClick={() => handleFillBlank(activeBlankObj.num, opt)}
                              className={`p-3 rounded-xl border-2 text-left text-xs sm:text-sm transition-all ${optCls}`}
                            >
                              <span className="font-mono-code font-bold mr-1.5">
                                {OPTION_LETTERS[oIdx]}.
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Active Blank Explanation after Check */}
                  {isClozeSubmitted && activeBlankObj && (
                    <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono-code font-bold text-slate-900">
                          Chỗ trống ({activeBlankObj.num}) → {activeBlankObj.answer}
                        </span>
                        {(currentAnswers[activeBlankObj.num] ?? '').toLowerCase() ===
                        activeBlankObj.answer.toLowerCase() ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Chính xác
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                            <XCircle className="w-3.5 h-3.5" />
                            Cần sửa
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {activeBlankObj.explanation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit / Score Banner */}
                {!isClozeSubmitted ? (
                  <button
                    type="button"
                    disabled={filledCount === 0}
                    onClick={() =>
                      setClozeChecked((prev) => ({ ...prev, [selectedCloze.id]: true }))
                    }
                    className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-semibold transition-colors shadow-xs"
                  >
                    Kiểm tra kết quả ({filledCount}/{selectedCloze.blanks.length} ô đã điền)
                  </button>
                ) : (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-display font-bold text-base text-emerald-950">
                        Kết quả: {correctClozeCount}/{selectedCloze.blanks.length} chỗ trống đúng
                      </p>
                      <button
                        type="button"
                        onClick={handleResetCloze}
                        className="text-xs font-semibold text-emerald-800 hover:underline"
                      >
                        Thử lại
                      </button>
                    </div>
                    <p className="text-xs text-emerald-900">
                      Chạm vào từng số (1) – ({selectedCloze.blanks.length}) bên trên để xem giải
                      thích chi tiết từng đáp án.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FULL READING LIBRARY (12 UNITS) */}
      {activeSubTab === 'library' && (
        <div className="space-y-6">
          {/* Interactive Semester & Format Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                {(
                  [
                    { id: 'all' as const, label: 'Tất cả 12 Unit' },
                    { id: 2 as const, label: `Học kỳ 2 (${sem2Readings.length} bài)` },
                    { id: 1 as const, label: `Học kỳ 1 (${sem1Readings.length} bài)` },
                  ]
                ).map((s) => (
                  <button
                    key={String(s.id)}
                    type="button"
                    onClick={() => setLibrarySemester(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      librarySemester === s.id
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                {(
                  [
                    { id: 'all', label: `Mọi dạng (${allReadings.length})` },
                    { id: 'comprehension', label: 'Trắc nghiệm & Hồ sơ' },
                    { id: 'true_false', label: 'Đúng / Sai (T/F)' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setLibraryFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      libraryFilter === f.id
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Mỗi bài đọc đều tích hợp <strong>Soi dẫn chứng tô sáng</strong>, nghe đọc bài và tóm
              tắt Tiếng Việt.
            </p>
          </div>

          {([2, 1] as const)
            .filter((sem) => librarySemester === 'all' || librarySemester === sem)
            .map((sem) => {
              const semUnits = ALL_UNITS.filter((u) => u.semester === sem);
              const semReadingsFiltered = semUnits.flatMap((u) =>
                getReadingByUnit(u.id)
                  .filter((r) => {
                    if (libraryFilter === 'all') return true;
                    if (libraryFilter === 'true_false') return r.format === 'true_false';
                    return r.format !== 'true_false';
                  })
                  .map((reading) => ({ unit: u, reading }))
              );

              if (semReadingsFiltered.length === 0) return null;

              return (
                <div key={sem} className="space-y-3">
                  <h3 className="font-display font-bold text-base text-slate-900">
                    {sem === 2
                      ? 'Học kỳ 2 (Unit 7 – Unit 12) · Kho bài đọc chuẩn bộ đề PDF'
                      : 'Học kỳ 1 (Unit 1 – Unit 6) · Kho bài đọc chuẩn bộ đề PDF'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {semReadingsFiltered.map(({ unit, reading }) => {
                    const isDone = progress.completedExerciseIds.includes(reading.id);
                    const formatLabel =
                      reading.format === 'true_false'
                        ? 'Đúng / Sai (T/F)'
                        : reading.format === 'profile'
                          ? 'Đọc hồ sơ nhân vật'
                          : 'Đọc hiểu Trắc nghiệm';

                    return (
                      <div
                        key={reading.id}
                        className="bg-white border border-slate-200 hover:border-sky-400 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                            <span className="font-mono-code font-bold text-sky-700">
                              UNIT {unit.id} · {formatLabel}
                            </span>
                            {isDone ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Đã làm
                              </span>
                            ) : (
                              <span className="tabular-nums">{reading.questions.length} câu hỏi</span>
                            )}
                          </div>

                          <h4 className="font-display font-bold text-base text-slate-900 leading-snug">
                            {reading.title}
                          </h4>

                          {reading.sourceLabel && (
                            <p className="text-xs text-slate-500">{reading.sourceLabel}</p>
                          )}

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-0.5">
                            {reading.vietnameseSummary ?? reading.passage}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            onStartPractice(`Đọc hiểu · Unit ${unit.id}: ${reading.title}`, [
                              reading,
                            ])
                          }
                          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-sky-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Đọc &amp; Làm {reading.questions.length} câu hỏi</span>
                        </button>
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
