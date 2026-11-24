import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  HelpCircle,
  Layers,
  PenLine,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Volume2,
  XCircle,
} from 'lucide-react';
import {
  ALL_UNITS,
  getAllWritingRearrangeExercises,
  getWritingRearrangeByUnit,
} from '../data/curriculum';
import {
  PDF_PARAGRAPH_TOPICS,
  PDF_WRITING_DRILLS,
  WRITING_PATTERNS,
  WritingDrillItem,
  WritingDrillKind,
} from '../data/writingBank';
import { Exercise, StudentProgress } from '../types';
import { speakEnglish } from '../utils/speech';

interface WritingStudioProps {
  progress: StudentProgress;
  onStartPractice: (title: string, exercises: Exercise[]) => void;
}

type WritingSubTab = 'patterns' | 'drills' | 'rearrange' | 'paragraph';

const KIND_LABELS: Record<WritingDrillKind | 'all', string> = {
  all: 'Tất cả dạng bài',
  rewrite: 'Viết lại câu',
  cue_build: 'Dựng câu gợi ý',
  exclamation: 'Câu cảm thán What!',
  modal_advice: 'Must / Should',
  wh_question: 'Đặt câu hỏi Wh-',
  conjunction: 'Liên từ (and/but/or/so)',
  imperative: 'Câu mệnh lệnh',
  conditional: 'Câu điều kiện If',
  robot_ability: 'Can / Could / Will be able to',
};

const HK1_DRILL_KINDS: readonly (WritingDrillKind | 'all')[] = [
  'all',
  'rewrite',
  'cue_build',
  'exclamation',
  'modal_advice',
  'wh_question',
];

const HK2_DRILL_KINDS: readonly (WritingDrillKind | 'all')[] = [
  'all',
  'cue_build',
  'conjunction',
  'imperative',
  'rewrite',
  'conditional',
  'wh_question',
  'robot_ability',
];

const ACCENT_STYLES: Record<
  'sky' | 'emerald' | 'amber' | 'violet' | 'rose' | 'teal',
  { iconBg: string; formulaBg: string; border: string; labelText: string }
> = {
  sky: {
    iconBg: 'bg-sky-50 text-sky-700',
    formulaBg: 'bg-sky-50/70 border-sky-200',
    border: 'border-sky-200',
    labelText: 'text-sky-800',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-700',
    formulaBg: 'bg-emerald-50/70 border-emerald-200',
    border: 'border-emerald-200',
    labelText: 'text-emerald-800',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-700',
    formulaBg: 'bg-amber-50/70 border-amber-200',
    border: 'border-amber-200',
    labelText: 'text-amber-800',
  },
  violet: {
    iconBg: 'bg-violet-50 text-violet-700',
    formulaBg: 'bg-violet-50/70 border-violet-200',
    border: 'border-violet-200',
    labelText: 'text-violet-800',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-700',
    formulaBg: 'bg-rose-50/70 border-rose-200',
    border: 'border-rose-200',
    labelText: 'text-rose-800',
  },
  teal: {
    iconBg: 'bg-teal-50 text-teal-700',
    formulaBg: 'bg-teal-50/70 border-teal-200',
    border: 'border-teal-200',
    labelText: 'text-teal-800',
  },
};

function normalizeSentence(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/[.!?]+$/g, '')
    .trim();
}

function isDrillAnswerCorrect(input: string, drill: WritingDrillItem): boolean {
  const norm = normalizeSentence(input);
  if (!norm) return false;
  const candidates = new Set<string>();
  candidates.add(normalizeSentence(drill.modelAnswer));
  for (const ans of drill.acceptedAnswers) {
    candidates.add(normalizeSentence(ans));
  }
  if (drill.starterPrefix) {
    const combined = normalizeSentence(`${drill.starterPrefix} ${input}`);
    if (candidates.has(combined)) return true;
  }
  return candidates.has(norm);
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export const WritingStudio: React.FC<WritingStudioProps> = ({ progress, onStartPractice }) => {
  const [subTab, setSubTab] = useState<WritingSubTab>('patterns');

  // --- Tab 1: Formula Playbooks semester state ---
  const [patternSemester, setPatternSemester] = useState<1 | 2>(2);

  // --- Tab 2: Interactive Writing Drills state ---
  const [drillSemester, setDrillSemester] = useState<1 | 2>(2);
  const [drillUnitFilter, setDrillUnitFilter] = useState<number | 'all'>('all');
  const [drillKindFilter, setDrillKindFilter] = useState<WritingDrillKind | 'all'>('all');
  const [drillInputs, setDrillInputs] = useState<Record<string, string>>({});
  const [drillChecked, setDrillChecked] = useState<Record<string, 'correct' | 'wrong' | 'revealed'>>(
    {}
  );
  const [drillHintsOpen, setDrillHintsOpen] = useState<Record<string, boolean>>({});

  // --- Tab 3: Rearrange Library state ---
  const [rearrangeSemester, setRearrangeSemester] = useState<1 | 2>(2);

  // --- Tab 4: Paragraph Builder state ---
  const [paragraphSemester, setParagraphSemester] = useState<1 | 2>(2);
  const hk2Paragraphs = useMemo(
    () => PDF_PARAGRAPH_TOPICS.filter((t) => t.unitId >= 7),
    []
  );
  const hk1Paragraphs = useMemo(
    () => PDF_PARAGRAPH_TOPICS.filter((t) => t.unitId <= 6),
    []
  );
  const visibleParagraphs = paragraphSemester === 2 ? hk2Paragraphs : hk1Paragraphs;
  const [activeTopicId, setActiveTopicId] = useState<string>(
    hk2Paragraphs[0]?.id ?? PDF_PARAGRAPH_TOPICS[0].id
  );
  const [draftsByTopic, setDraftsByTopic] = useState<Record<string, string>>({});
  const [showModelEssay, setShowModelEssay] = useState<boolean>(false);
  const [showModelVi, setShowModelVi] = useState<boolean>(false);

  const visiblePatterns = useMemo(
    () => WRITING_PATTERNS.filter((p) => (p.semester ?? 1) === patternSemester),
    [patternSemester]
  );

  const semesterDrills = useMemo(
    () =>
      PDF_WRITING_DRILLS.filter((d) =>
        drillSemester === 2 ? d.unitId >= 7 : d.unitId <= 6
      ),
    [drillSemester]
  );

  const filteredDrills = useMemo(() => {
    return semesterDrills.filter((d) => {
      const unitOk = drillUnitFilter === 'all' || d.unitId === drillUnitFilter;
      const kindOk = drillKindFilter === 'all' || d.kind === drillKindFilter;
      return unitOk && kindOk;
    });
  }, [semesterDrills, drillUnitFilter, drillKindFilter]);

  const solvedDrillsCount = useMemo(
    () => Object.values(drillChecked).filter((s) => s === 'correct').length,
    [drillChecked]
  );

  const allRearrangeSem1 = useMemo(() => getAllWritingRearrangeExercises(1), []);
  const allRearrangeSem2 = useMemo(() => getAllWritingRearrangeExercises(2), []);

  const completedSet = useMemo(
    () => new Set(progress.completedExerciseIds),
    [progress.completedExerciseIds]
  );

  const activeTopic = useMemo(
    () => PDF_PARAGRAPH_TOPICS.find((t) => t.id === activeTopicId) ?? PDF_PARAGRAPH_TOPICS[0],
    [activeTopicId]
  );

  const currentDraft = draftsByTopic[activeTopic.id] ?? '';
  const draftWordCount = countWords(currentDraft);
  const [minWords, maxWords] = activeTopic.wordTarget;
  const wordProgressPct = Math.min(100, Math.round((draftWordCount / maxWords) * 100));

  const handleCheckDrill = (drill: WritingDrillItem) => {
    const val = drillInputs[drill.id] ?? '';
    if (!val.trim()) return;
    const ok = isDrillAnswerCorrect(val, drill);
    setDrillChecked((prev) => ({ ...prev, [drill.id]: ok ? 'correct' : 'wrong' }));
  };

  const handleRevealDrill = (drill: WritingDrillItem) => {
    setDrillInputs((prev) => ({
      ...prev,
      [drill.id]: drill.starterPrefix
        ? drill.modelAnswer.replace(new RegExp(`^${drill.starterPrefix}\\s*`, 'i'), '')
        : drill.modelAnswer,
    }));
    setDrillChecked((prev) => ({ ...prev, [drill.id]: 'revealed' }));
  };

  const handleResetDrill = (drillId: string) => {
    setDrillInputs((prev) => {
      const next = { ...prev };
      delete next[drillId];
      return next;
    });
    setDrillChecked((prev) => {
      const next = { ...prev };
      delete next[drillId];
      return next;
    });
  };

  const handleInsertIntoDraft = (snippet: string) => {
    setDraftsByTopic((prev) => {
      const existing = prev[activeTopic.id] ?? '';
      const separator = existing.trim().length === 0 ? '' : existing.endsWith(' ') ? '' : ' ';
      return {
        ...prev,
        [activeTopic.id]: `${existing}${separator}${snippet}`,
      };
    });
  };

  const handleStartRandomRearrange = (semester: 1 | 2) => {
    const pool = semester === 1 ? [...allRearrangeSem1] : [...allRearrangeSem2];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const batch = pool.slice(0, Math.min(10, pool.length));
    onStartPractice(
      `Luyện nhanh Sắp xếp câu · Học kỳ ${semester} (${batch.length} câu)`,
      batch
    );
  };

  const renderPromptWithUnderline = (drill: WritingDrillItem) => {
    if (!drill.underlinedPhrase) {
      return <span>{drill.promptSentence}</span>;
    }
    const idx = drill.promptSentence.toLowerCase().indexOf(drill.underlinedPhrase.toLowerCase());
    if (idx === -1) return <span>{drill.promptSentence}</span>;
    const before = drill.promptSentence.slice(0, idx);
    const match = drill.promptSentence.slice(idx, idx + drill.underlinedPhrase.length);
    const after = drill.promptSentence.slice(idx + drill.underlinedPhrase.length);
    return (
      <>
        <span>{before}</span>
        <span className="underline decoration-2 decoration-amber-500 underline-offset-4 bg-amber-50 text-amber-950 font-bold px-1 rounded">
          {match}
        </span>
        <span>{after}</span>
      </>
    );
  };

  return (
    <div className="space-y-7">
      {/* Hero Banner */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <p className="text-xs font-semibold text-amber-300 tracking-wide">
            Phần 8 · Writing Studio · Trọn bộ PDF Học kỳ 1 (Unit 1–6) &amp; Học kỳ 2 (Unit 7–12)
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-balance">
            Phòng Luyện Viết Câu &amp; Đoạn Văn Trực Quan
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Làm chủ {WRITING_PATTERNS.length} công thức biến đổi câu kinh điển (HK1 &amp; HK2), thực
            hành trực tiếp {PDF_WRITING_DRILLS.length} câu viết lại – dựng câu – câu điều kiện If –
            đặt câu hỏi chuẩn PDF, xếp từ thành câu chuẩn IOE và viết {PDF_PARAGRAPH_TOPICS.length}{' '}
            chủ đề đoạn văn 80–100 từ có khung sườn gợi ý.
          </p>
          <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono-code tabular-nums">
            <span>{WRITING_PATTERNS.length} Công thức vàng</span>
            <span aria-hidden="true">·</span>
            <span>{PDF_WRITING_DRILLS.length} Câu luyện viết PDF</span>
            <span aria-hidden="true">·</span>
            <span>{allRearrangeSem1.length + allRearrangeSem2.length} Câu xếp từ HK1–HK2</span>
            <span aria-hidden="true">·</span>
            <span>{PDF_PARAGRAPH_TOPICS.length} Chủ đề đoạn văn</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setDrillSemester(2);
              setSubTab('drills');
            }}
            className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
          >
            <PenLine className="w-4 h-4 shrink-0" />
            <span>Mở Xưởng Viết câu HK2</span>
          </button>
          <button
            type="button"
            onClick={() => handleStartRandomRearrange(2)}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors"
          >
            <Play className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Thử thách 10 câu Xếp từ HK2</span>
          </button>
        </div>
      </section>

      {/* 4 Sub-Tab Segmented Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 grid grid-cols-2 lg:grid-cols-4 gap-1.5">
        <button
          type="button"
          onClick={() => setSubTab('patterns')}
          className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left sm:text-center flex items-center sm:justify-center gap-2 ${
            subTab === 'patterns'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="truncate">1. {WRITING_PATTERNS.length} Công thức Vàng</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('drills')}
          className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left sm:text-center flex items-center sm:justify-center gap-2 ${
            subTab === 'drills'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <PenLine className="w-4 h-4 shrink-0" />
          <span className="truncate">2. Xưởng Viết câu PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('rearrange')}
          className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left sm:text-center flex items-center sm:justify-center gap-2 ${
            subTab === 'rearrange'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span className="truncate">3. Sắp xếp câu (IOE)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('paragraph')}
          className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left sm:text-center flex items-center sm:justify-center gap-2 ${
            subTab === 'paragraph'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="truncate">4. Viết Đoạn văn</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: 12 FORMULA PLAYBOOKS (HK2 & HK1)                               */}
      {/* ===================================================================== */}
      {subTab === 'patterns' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                {patternSemester === 2
                  ? '6 Sơ đồ Công thức Viết câu Trọng tâm Học kỳ 2 (Unit 7–12)'
                  : '6 Sơ đồ Công thức Viết câu Trọn điểm Học kỳ 1 (Unit 1–6)'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Mỗi dạng bài viết trong bộ đề PDF đều tuân theo một công thức biến đổi rõ ràng — bấm biểu
                tượng loa để nghe đọc câu mẫu chuẩn.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                {(
                  [
                    { id: 2 as const, label: 'Học kỳ 2 (Unit 7–12)' },
                    { id: 1 as const, label: 'Học kỳ 1 (Unit 1–6)' },
                  ]
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPatternSemester(s.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      patternSemester === s.id
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setDrillSemester(patternSemester);
                  setDrillUnitFilter('all');
                  setDrillKindFilter('all');
                  setSubTab('drills');
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-800 whitespace-nowrap"
              >
                <span>Thực hành ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {visiblePatterns.map((pat) => {
              const tone = ACCENT_STYLES[pat.accent];
              return (
                <article
                  key={pat.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div>
                      <p className={`text-xs font-semibold ${tone.labelText}`}>
                        {pat.englishSubtitle}
                      </p>
                      <h3 className="font-display text-lg font-bold text-slate-900 mt-0.5">
                        {pat.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{pat.summary}</p>
                    </div>

                    {/* Formula Rows */}
                    <div className={`rounded-xl border p-3.5 space-y-2 ${tone.formulaBg}`}>
                      {pat.formulaBlocks.map((fb) => (
                        <div
                          key={fb.label}
                          className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 text-xs sm:text-sm"
                        >
                          <span className="font-semibold text-slate-700 shrink-0 min-w-[115px]">
                            {fb.label}:
                          </span>
                          <span className="font-mono-code font-semibold text-slate-900 leading-snug">
                            {fb.formula}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Transformation Examples */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-slate-500">
                        Ví dụ biến đổi trực quan (bấm loa để nghe câu chuẩn)
                      </p>
                      {pat.examples.map((ex, i) => (
                        <div
                          key={i}
                          className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1.5"
                        >
                          <p className="text-xs sm:text-sm text-slate-600">{ex.before}</p>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900 flex items-start gap-1.5">
                              <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{ex.after}</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => speakEnglish(ex.after)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-sky-50 shrink-0 transition-colors"
                              aria-label={`Nghe câu mẫu: ${ex.after}`}
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-500">{ex.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Watch-out Tip */}
                  <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Mẹo tránh mất điểm: </strong>
                      {pat.watchOut}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: INTERACTIVE PDF WRITING DRILLS WORKSHOP                        */}
      {/* ===================================================================== */}
      {subTab === 'drills' && (
        <div className="space-y-5">
          {/* Progress & Filter Control Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                  Xưởng Thực hành Viết lại câu &amp; Dựng câu chuẩn PDF
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Gõ đáp án (có thể chỉ gõ phần còn thiếu sau cụm gợi ý hoặc gõ cả câu) rồi nhấn{' '}
                  <strong>Enter</strong> hoặc nút <strong>Kiểm tra</strong>.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-slate-500">Đã làm đúng</p>
                  <p className="font-mono-code text-base font-bold text-emerald-700 tabular-nums">
                    {solvedDrillsCount}/{PDF_WRITING_DRILLS.length} câu
                  </p>
                </div>
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.round((solvedDrillsCount / PDF_WRITING_DRILLS.length) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Semester + Unit + Kind Filters */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  {(
                    [
                      { id: 2 as const, label: 'Học kỳ 2 (Unit 7–12)' },
                      { id: 1 as const, label: 'Học kỳ 1 (Unit 1–6)' },
                    ]
                  ).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setDrillSemester(s.id);
                        setDrillUnitFilter('all');
                        setDrillKindFilter('all');
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        drillSemester === s.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Unit Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDrillUnitFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      drillUnitFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {drillSemester === 2 ? 'Tất cả Unit 7–12' : 'Tất cả Unit 1–6'}
                  </button>
                  {(drillSemester === 2 ? [7, 8, 9, 10, 11, 12] : [1, 2, 3, 4, 5, 6]).map((uId) => (
                    <button
                      key={uId}
                      type="button"
                      onClick={() => setDrillUnitFilter(uId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors font-mono-code tabular-nums ${
                        drillUnitFilter === uId
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Unit {uId}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kind Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(drillSemester === 2 ? HK2_DRILL_KINDS : HK1_DRILL_KINDS).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setDrillKindFilter(k)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      drillKindFilter === k
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {KIND_LABELS[k]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Drill Cards List */}
          {filteredDrills.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <p className="text-sm text-slate-600">
                Unit {drillUnitFilter} không có câu thuộc dạng &ldquo;{KIND_LABELS[drillKindFilter]}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setDrillKindFilter('all')}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Hiện tất cả dạng bài của Unit này
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDrills.map((drill, idx) => {
                const status = drillChecked[drill.id];
                const inputVal = drillInputs[drill.id] ?? '';
                const hintOpen = !!drillHintsOpen[drill.id];

                return (
                  <div
                    key={drill.id}
                    className={`bg-white border rounded-2xl p-5 space-y-3.5 transition-colors ${
                      status === 'correct'
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : status === 'wrong'
                          ? 'border-rose-300'
                          : 'border-slate-200'
                    }`}
                  >
                    {/* Metadata line (clean unboxed text) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-code font-bold text-slate-800 tabular-nums">
                          #{idx + 1}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-sky-700">{drill.sourceLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{KIND_LABELS[drill.kind]}</span>
                      </div>

                      {status === 'correct' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          Chính xác
                        </span>
                      )}
                      {status === 'wrong' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                          <XCircle className="w-4 h-4" />
                          Chưa chuẩn xác — thử lại nhé
                        </span>
                      )}
                      {status === 'revealed' && (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                          <Eye className="w-4 h-4" />
                          Đã xem đáp án mẫu
                        </span>
                      )}
                    </div>

                    {/* Instruction + Original Sentence */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-slate-500">{drill.instruction}</p>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <p className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
                          {renderPromptWithUnderline(drill)}
                        </p>
                        {drill.cueTag && (
                          <span className="font-mono-code text-xs sm:text-sm font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            ({drill.cueTag})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Input + Actions Row */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <div className="flex-1 flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 overflow-hidden">
                        {drill.starterPrefix && (
                          <span className="pl-3.5 pr-1.5 py-2.5 bg-slate-50 border-r border-slate-200 text-sm font-semibold text-slate-700 whitespace-nowrap select-none">
                            → {drill.starterPrefix}
                          </span>
                        )}
                        <input
                          type="text"
                          value={inputVal}
                          onChange={(e) => {
                            setDrillInputs((prev) => ({ ...prev, [drill.id]: e.target.value }));
                            if (status === 'wrong') {
                              setDrillChecked((prev) => {
                                const next = { ...prev };
                                delete next[drill.id];
                                return next;
                              });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCheckDrill(drill);
                            }
                          }}
                          placeholder={
                            drill.starterPrefix
                              ? 'Gõ phần tiếp theo (hoặc cả câu)...'
                              : 'Gõ câu hoàn chỉnh bằng Tiếng Anh...'
                          }
                          className="w-full px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                          aria-label={`Nhập đáp án câu ${idx + 1}`}
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCheckDrill(drill)}
                          disabled={!inputVal.trim()}
                          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs sm:text-sm transition-colors"
                        >
                          Kiểm tra
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDrillHintsOpen((prev) => ({ ...prev, [drill.id]: !prev[drill.id] }))
                          }
                          className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                          title="Xem gợi ý công thức"
                        >
                          <HelpCircle className="w-4 h-4 text-amber-600" />
                          <span className="hidden sm:inline">Gợi ý</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevealDrill(drill)}
                          className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                          title="Xem đáp án mẫu"
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                          <span className="hidden sm:inline">Đáp án</span>
                        </button>
                        {status && (
                          <button
                            type="button"
                            onClick={() => handleResetDrill(drill.id)}
                            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
                            aria-label="Làm lại câu này"
                            title="Làm lại câu này"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Formula Hint Box */}
                    {hintOpen && (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs sm:text-sm text-amber-950">
                        <strong>Công thức gợi ý: </strong>
                        <span className="font-mono-code font-semibold">{drill.formulaTip}</span>
                      </div>
                    )}

                    {/* Feedback & Model Answer Box */}
                    {status && (
                      <div
                        className={`rounded-xl border p-3.5 space-y-1.5 text-xs sm:text-sm ${
                          status === 'correct'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : status === 'revealed'
                              ? 'bg-slate-50 border-slate-200 text-slate-800'
                              : 'bg-rose-50 border-rose-200 text-rose-950'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">
                            Câu chuẩn:{' '}
                            <span className="text-emerald-800">{drill.modelAnswer}</span>
                          </p>
                          <button
                            type="button"
                            onClick={() => speakEnglish(drill.modelAnswer)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-sky-400 text-slate-700 hover:text-sky-700 text-xs font-semibold shrink-0 transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Nghe chuẩn</span>
                          </button>
                        </div>
                        <p className="leading-relaxed opacity-90">
                          <strong>Giải thích: </strong>
                          {drill.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: REARRANGE SENTENCE LIBRARY (Connected to ExercisePlayer)       */}
      {/* ===================================================================== */}
      {subTab === 'rearrange' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                Kho Sắp xếp từ thành câu chuẩn PDF &amp; IOE
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Bấm từng thẻ từ để ghép câu đúng ngữ pháp, có gợi ý khung câu và giọng đọc kiểm chứng.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRearrangeSemester(2)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    rearrangeSemester === 2
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Học kỳ 2 (Unit 7–12)
                </button>
                <button
                  type="button"
                  onClick={() => setRearrangeSemester(1)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    rearrangeSemester === 1
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Học kỳ 1 (Unit 1–6)
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleStartRandomRearrange(rearrangeSemester)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Luyện trộn 10 câu</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_UNITS.filter((u) => u.semester === rearrangeSemester).map((unit) => {
              const list = getWritingRearrangeByUnit(unit.id);
              const doneCount = list.filter((ex) => completedSet.has(ex.id)).length;
              const pct = list.length > 0 ? Math.round((doneCount / list.length) * 100) : 0;

              return (
                <div
                  key={unit.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-sky-300 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-sky-700">{unit.code}</span>
                      <span className="font-mono-code tabular-nums">
                        {doneCount}/{list.length} câu đã xong
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-900">
                        {unit.titleEn}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{unit.titleVi}</p>
                    </div>

                    {/* Preview 2 sample sentences */}
                    <div className="space-y-1.5 pt-1">
                      {list.slice(0, 2).map((item) => (
                        <p
                          key={item.id}
                          className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2.5 py-1.5 truncate"
                          title={item.vietnameseMeaning}
                        >
                          {item.vietnameseMeaning}
                        </p>
                      ))}
                    </div>

                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={list.length === 0}
                    onClick={() =>
                      onStartPractice(
                        `Sắp xếp câu · ${unit.code}: ${unit.titleEn} (${list.length} câu)`,
                        list
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-sky-700 disabled:bg-slate-200 text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Luyện {list.length} câu xếp từ</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: GUIDED PARAGRAPH BUILDER (80–100 WORDS · UNITS 1–12)           */}
      {/* ===================================================================== */}
      {subTab === 'paragraph' && (
        <div className="space-y-5">
          {/* Semester + Topic Selector Strip */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {(
                [
                  { id: 2 as const, label: 'Học kỳ 2 (7–12)' },
                  { id: 1 as const, label: 'Học kỳ 1 (1–6)' },
                ]
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setParagraphSemester(s.id);
                    const nextList = s.id === 2 ? hk2Paragraphs : hk1Paragraphs;
                    if (nextList[0]) {
                      setActiveTopicId(nextList[0].id);
                      setShowModelEssay(false);
                      setShowModelVi(false);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    paragraphSemester === s.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {visibleParagraphs.map((topic) => {
                const active = topic.id === activeTopic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => {
                      setActiveTopicId(topic.id);
                      setShowModelEssay(false);
                      setShowModelVi(false);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors font-mono-code tabular-nums ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Unit {topic.unitId}
                  </button>
                );
              })}
            </div>

            <span className="ml-auto text-xs text-slate-500 hidden xl:inline">
              {paragraphSemester === 2
                ? 'Chủ đề viết đoạn văn Học kỳ 2 (gồm đề chuẩn PDF Unit 7 & Unit 10)'
                : 'Chủ đề viết đoạn văn Học kỳ 1 chuẩn đề Bài IV trong tài liệu PDF'}
            </span>
          </div>

          {/* Main 2-Column Paragraph Workshop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN: Prompt + Outline Starters + Vocab Bank */}
            <div className="lg:col-span-6 space-y-5">
              {/* Topic Prompt Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                <p className="text-xs font-semibold text-sky-700">{activeTopic.sourceLabel}</p>
                <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {activeTopic.titleEn}
                </h2>
                <p className="text-sm text-slate-600">{activeTopic.titleVi}</p>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-700">Gợi ý triển khai ý:</p>
                  <ul className="space-y-1 text-xs sm:text-sm text-slate-600 list-disc pl-4">
                    {activeTopic.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 3-Step Outline with Clickable Sentence Starters */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Dàn ý 3 phần &amp; Khung câu mẫu (Bấm để chèn vào bài viết)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Em có thể bấm vào từng câu gợi ý để ghép thành khung bài rồi chỉnh sửa theo ý
                    riêng của mình.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {activeTopic.outlineSteps.map((step) => (
                    <div
                      key={step.part}
                      className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2"
                    >
                      <p className="text-xs font-bold text-slate-900">{step.part}</p>
                      <p className="text-xs text-slate-600">{step.guideVi}</p>
                      <div className="space-y-1.5 pt-1">
                        {step.starters.map((starter, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleInsertIntoDraft(starter)}
                            className="w-full text-left px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 text-xs sm:text-sm text-slate-800 flex items-start justify-between gap-2 transition-colors"
                          >
                            <span className="leading-relaxed">{starter}</span>
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-sky-700 shrink-0 mt-0.5">
                              <Plus className="w-3.5 h-3.5" />
                              Chèn
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Useful Vocabulary with Pronunciation + Insert */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                <h3 className="font-display font-bold text-sm sm:text-base text-slate-900">
                  Từ vựng ăn điểm cho chủ đề Unit {activeTopic.unitId}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeTopic.usefulVocab.map((v) => (
                    <div
                      key={v.word}
                      className="rounded-xl border border-slate-200 px-3 py-2 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{v.word}</p>
                        <p className="text-xs text-slate-500 truncate">{v.meaning}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => speakEnglish(v.word)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-sky-50 transition-colors"
                          aria-label={`Nghe phát âm ${v.word}`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertIntoDraft(v.word)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          aria-label={`Chèn từ ${v.word} vào bài viết`}
                          title="Chèn vào bài viết"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Live Draft Editor + Word Counter + Model Essay */}
            <div className="lg:col-span-6 space-y-5 lg:sticky lg:top-20">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900">
                      Khung tập viết của em
                    </h3>
                    <p className="text-xs text-slate-500">
                      Mục tiêu chuẩn đề thi: {minWords}–{maxWords} từ Tiếng Anh
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-mono-code text-base font-bold tabular-nums ${
                        draftWordCount >= minWords && draftWordCount <= maxWords + 20
                          ? 'text-emerald-700'
                          : draftWordCount > 0
                            ? 'text-sky-700'
                            : 'text-slate-400'
                      }`}
                    >
                      {draftWordCount} từ
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {draftWordCount >= minWords && draftWordCount <= maxWords + 20
                        ? 'Đạt chuẩn độ dài!'
                        : draftWordCount < minWords
                          ? `Cần thêm ~${minWords - draftWordCount} từ`
                          : 'Bài viết rất chi tiết!'}
                    </p>
                  </div>
                </div>

                {/* Word Target Bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      draftWordCount >= minWords ? 'bg-emerald-500' : 'bg-sky-500'
                    }`}
                    style={{ width: `${wordProgressPct}%` }}
                  />
                </div>

                <textarea
                  value={currentDraft}
                  onChange={(e) =>
                    setDraftsByTopic((prev) => ({
                      ...prev,
                      [activeTopic.id]: e.target.value,
                    }))
                  }
                  rows={8}
                  placeholder="Bắt đầu viết đoạn văn Tiếng Anh tại đây, hoặc bấm các câu gợi ý ở cột bên trái để ghép khung sườn..."
                  className="w-full rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 p-4 text-sm sm:text-base text-slate-900 leading-relaxed placeholder:text-slate-400 focus:outline-none resize-y"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!currentDraft.trim()}
                      onClick={() => speakEnglish(currentDraft, { rate: 0.9 })}
                      className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 disabled:opacity-40 text-sky-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Nghe đọc bài của em</span>
                    </button>
                    <button
                      type="button"
                      disabled={!currentDraft.trim()}
                      onClick={() =>
                        setDraftsByTopic((prev) => ({ ...prev, [activeTopic.id]: '' }))
                      }
                      className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-600 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Xóa viết lại</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowModelEssay((v) => !v)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{showModelEssay ? 'Ẩn bài mẫu' : 'Xem bài mẫu điểm 10'}</span>
                  </button>
                </div>
              </div>

              {/* Toggleable Model Essay Card */}
              {showModelEssay && (
                <div className="bg-white border border-emerald-200 rounded-2xl p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-emerald-700">
                        Bài mẫu tham khảo · {countWords(activeTopic.modelEssay)} từ
                      </p>
                      <h4 className="font-display font-bold text-base text-slate-900">
                        Đoạn văn mẫu chuẩn Tiếng Anh 6
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakEnglish(activeTopic.modelEssay, { rate: 0.9 })}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Nghe bài mẫu</span>
                    </button>
                  </div>

                  <p className="text-sm sm:text-base text-slate-800 leading-relaxed">
                    {activeTopic.modelEssay}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowModelVi((v) => !v)}
                      className="text-xs font-semibold text-sky-700 hover:text-sky-800"
                    >
                      {showModelVi ? 'Ẩn bản dịch Tiếng Việt' : 'Xem bản dịch Tiếng Việt'}
                    </button>
                  </div>

                  {showModelVi && (
                    <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 rounded-xl p-3.5 leading-relaxed">
                      {activeTopic.modelEssayVi}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
