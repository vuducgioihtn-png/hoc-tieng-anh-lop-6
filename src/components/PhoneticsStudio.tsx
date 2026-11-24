import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Ear,
  Lightbulb,
  Play,
  Sparkles,
  Turtle,
  Volume2,
} from 'lucide-react';
import {
  ALL_UNITS,
  buildPronunciationMix,
  getAllPronunciationExercises,
  getPronunciationByUnit,
} from '../data/curriculum';
import {
  PHONETIC_LESSONS,
  PhoneticMasteryLesson,
  TRICKY_LETTER_GROUPS,
} from '../data/phoneticsBank';
import { Exercise, StudentProgress } from '../types';
import { speakEnglish, stopSpeaking } from '../utils/speech';

interface PhoneticsStudioProps {
  progress: StudentProgress;
  onStartPractice: (title: string, exercises: Exercise[]) => void;
}

function renderHighlightedLetters(
  word: string,
  underline: string,
  underlineIndex?: number,
  isSilent = false
) {
  const start =
    typeof underlineIndex === 'number'
      ? underlineIndex
      : word.toLowerCase().indexOf(underline.toLowerCase());
  if (start < 0) return <span>{word}</span>;
  const end = start + underline.length;
  return (
    <span>
      {word.slice(0, start)}
      <span
        className={
          isSilent
            ? 'line-through decoration-2 decoration-rose-500 text-rose-600 font-bold'
            : 'underline decoration-2 decoration-sky-600 underline-offset-4 text-sky-700 font-bold'
        }
      >
        {word.slice(start, end)}
      </span>
      {word.slice(end)}
    </span>
  );
}

const BUCKET_ACCENTS = {
  sky: {
    card: 'bg-sky-50/60 border-sky-200',
    symbol: 'text-sky-700',
    head: 'border-sky-200/80',
  },
  emerald: {
    card: 'bg-emerald-50/60 border-emerald-200',
    symbol: 'text-emerald-700',
    head: 'border-emerald-200/80',
  },
  amber: {
    card: 'bg-amber-50/60 border-amber-200',
    symbol: 'text-amber-800',
    head: 'border-amber-200/80',
  },
  rose: {
    card: 'bg-rose-50/60 border-rose-200',
    symbol: 'text-rose-700',
    head: 'border-rose-200/80',
  },
};

const VisualArticulationDiagram: React.FC<{ lesson: PhoneticMasteryLesson }> = ({ lesson }) => {
  if (lesson.visualType === 'voicing') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
          <svg viewBox="0 0 64 64" className="w-14 h-14 shrink-0" fill="none" aria-hidden="true">
            <rect width="64" height="64" rx="14" fill="#E0F2FE" />
            <circle cx="24" cy="32" r="10" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.4" />
            <path d="M36 26H52M38 32H55M36 38H52" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M49 23L53 26L49 29" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="font-display font-bold text-sm text-slate-900">
              Vô thanh · /p/ · /t/ · /θ/
            </p>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Chỉ bật luồng gió ra khỏi miệng. Đặt tay lên cổ họng thấy <strong>đứng yên</strong>.
            </p>
          </div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex items-center gap-4">
          <svg viewBox="0 0 64 64" className="w-14 h-14 shrink-0" fill="none" aria-hidden="true">
            <rect width="64" height="64" rx="14" fill="#D1FAE5" />
            <circle cx="32" cy="32" r="10" fill="#FFFFFF" stroke="#059669" strokeWidth="2.4" />
            <path d="M16 24C13 28 13 36 16 40M48 24C51 28 51 36 48 40" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M11 20C7 26 7 38 11 44M53 20C57 26 57 38 53 44" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            <p className="font-display font-bold text-sm text-emerald-950">
              Hữu thanh · /b/ · /d/ · /ð/
            </p>
            <p className="text-xs text-emerald-900 mt-0.5 leading-relaxed">
              Cùng vị trí miệng nhưng dây thanh <strong>rung rõ</strong> khi đặt 2 ngón tay vào cổ.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (lesson.visualType === 'suffix_s' || lesson.visualType === 'suffix_ed') {
    const isS = lesson.visualType === 'suffix_s';
    const lanes = isS
      ? [
          {
            step: 'Bước 1',
            trigger: 't, p, k, f, th',
            cue: 'Thời Phong Kiến Phương Tây',
            result: '/s/',
            color: 'bg-sky-50 border-sky-200 text-sky-900',
          },
          {
            step: 'Bước 2',
            trigger: 's, ss, sh, ch, x, ge, ce',
            cue: 'Sóng Gió Chẳng Sợ Xưa Giờ',
            result: '/ɪz/',
            color: 'bg-amber-50 border-amber-200 text-amber-900',
          },
          {
            step: 'Bước 3',
            trigger: 'Các âm còn lại',
            cue: 'Mọi âm hữu thanh khác',
            result: '/z/',
            color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          },
        ]
      : [
          {
            step: 'Bước 1',
            trigger: 't, d',
            cue: 'Tình Đầu',
            result: '/ɪd/',
            color: 'bg-amber-50 border-amber-200 text-amber-900',
          },
          {
            step: 'Bước 2',
            trigger: 's, sh, ch, k, p, f',
            cue: 'Sáng Sớm Chạy Khắp Phố Phường',
            result: '/t/',
            color: 'bg-sky-50 border-sky-200 text-sky-900',
          },
          {
            step: 'Bước 3',
            trigger: 'Các âm còn lại',
            cue: 'Mọi âm hữu thanh khác',
            result: '/d/',
            color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          },
        ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {lanes.map((lane) => (
          <div key={lane.step} className={`rounded-xl border p-4 space-y-2 ${lane.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold opacity-80">{lane.step}</span>
              <span className="font-mono-code text-xl font-bold">{lane.result}</span>
            </div>
            <p className="font-mono-code text-xs font-semibold bg-white/80 rounded-lg px-2.5 py-1.5 border border-black/5">
              Kết thúc: {lane.trigger}
            </p>
            <p className="text-xs font-medium leading-relaxed">Thần chú: &ldquo;{lane.cue}&rdquo;</p>
          </div>
        ))}
      </div>
    );
  }

  if (lesson.visualType === 'silent') {
    const items = [
      { word: 'island', silentIdx: 1, ipa: '/ˈaɪlənd/', note: 'Bỏ chữ s' },
      { word: 'hour', silentIdx: 0, ipa: '/aʊə/', note: 'Bỏ chữ h' },
      { word: 'plumber', silentIdx: 4, ipa: '/ˈplʌmə/', note: 'Bỏ chữ b (HK2)' },
      { word: 'who', silentIdx: 0, ipa: '/huː/', note: 'Bỏ chữ w (HK2)' },
    ];
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <button
            key={item.word}
            type="button"
            onClick={() => speakEnglish(item.word, { rate: 0.8 })}
            className="bg-rose-50/60 hover:bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-left space-y-1 transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-bold text-slate-900">
                {renderHighlightedLetters(
                  item.word,
                  item.word[item.silentIdx],
                  item.silentIdx,
                  true
                )}
              </p>
              <Volume2 className="w-4 h-4 text-rose-600 shrink-0" />
            </div>
            <p className="font-mono-code text-xs text-slate-600">{item.ipa}</p>
            <p className="text-xs font-semibold text-rose-700">{item.note}</p>
          </button>
        ))}
      </div>
    );
  }

  // Length / Digraph visual rhythm comparison
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
          <div className="flex items-end gap-1 h-7">
            <span className="w-2 h-3 bg-sky-600 rounded-sm" />
            <span className="w-2 h-7 bg-sky-600 rounded-sm" />
            <span className="w-2 h-2 bg-sky-300 rounded-sm" />
          </div>
        </div>
        <div>
          <p className="font-display font-bold text-sm text-slate-900">
            Âm ngắn · Gọn, dứt khoát
          </p>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            Không có dấu hai chấm (<span className="font-mono-code">/ɪ/, /ʌ/, /e/, /ʊ/</span>) → đọc gọn 1 nhịp ngắn.
          </p>
        </div>
      </div>

      <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-sky-600 flex items-center justify-center shrink-0">
          <div className="flex items-end gap-1 h-7">
            <span className="w-2 h-5 bg-white rounded-sm" />
            <span className="w-2 h-7 bg-white rounded-sm" />
            <span className="w-2 h-7 bg-white rounded-sm" />
            <span className="w-2 h-5 bg-white rounded-sm" />
          </div>
        </div>
        <div>
          <p className="font-display font-bold text-sm text-sky-950">
            Âm dài / Nguyên âm đôi · Kéo mượt
          </p>
          <p className="text-xs text-sky-900 mt-0.5 leading-relaxed">
            Có dấu <span className="font-mono-code font-bold">ː</span> (<span className="font-mono-code">/iː/, /uː/</span>) hoặc 2 ký hiệu (<span className="font-mono-code">/əʊ/, /aɪ/, /eɪ/</span>) → kéo dài hơi rõ ràng.
          </p>
        </div>
      </div>
    </div>
  );
};

export const PhoneticsStudio: React.FC<PhoneticsStudioProps> = ({
  progress,
  onStartPractice,
}) => {
  const [subTab, setSubTab] = useState<'lab' | 'traps' | 'drills'>('lab');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('hk2-th-contrast');
  const [activeCompareWord, setActiveCompareWord] = useState<string | null>(null);
  const [selectedTrapId, setSelectedTrapId] = useState<string>('letter-th');
  const [drillSemester, setDrillSemester] = useState<'all' | 2 | 1>('all');
  const timeoutsRef = useRef<number[]>([]);

  const hk2Lessons = useMemo(
    () => PHONETIC_LESSONS.filter((l) => l.id.startsWith('hk2-')),
    []
  );
  const hk1Lessons = useMemo(
    () => PHONETIC_LESSONS.filter((l) => !l.id.startsWith('hk2-')),
    []
  );

  const activeLesson = useMemo(
    () => PHONETIC_LESSONS.find((l) => l.id === selectedLessonId) ?? PHONETIC_LESSONS[0],
    [selectedLessonId]
  );

  const activeTrap = useMemo(
    () => TRICKY_LETTER_GROUPS.find((t) => t.id === selectedTrapId) ?? TRICKY_LETTER_GROUPS[0],
    [selectedTrapId]
  );

  const allPronExercises = useMemo(() => getAllPronunciationExercises(), []);
  const hk2PronExercises = useMemo(() => getAllPronunciationExercises(2), []);
  const completedPronCount = useMemo(
    () => allPronExercises.filter((e) => progress.completedExerciseIds.includes(e.id)).length,
    [allPronExercises, progress.completedExerciseIds]
  );
  const filteredUnits = useMemo(
    () =>
      drillSemester === 'all'
        ? ALL_UNITS
        : ALL_UNITS.filter((unit) => unit.semester === drillSemester),
    [drillSemester]
  );

  const clearCompareTimers = () => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearCompareTimers();
      stopSpeaking();
    };
  }, []);

  // Sequentially pronounce each word in a contrast pair while highlighting it live
  const playContrastSequence = (words: { word: string }[]) => {
    clearCompareTimers();
    stopSpeaking();
    words.forEach((item, index) => {
      const id = window.setTimeout(() => {
        setActiveCompareWord(item.word);
        speakEnglish(item.word, {
          rate: 0.82,
          onEnd: () => {
            if (index === words.length - 1) {
              setActiveCompareWord(null);
            }
          },
        });
      }, index * 1150);
      timeoutsRef.current.push(id);
    });
  };

  const suffixPracticeExercises = useMemo(() => {
    return allPronExercises.filter((ex) =>
      ex.options.some((o) => o.underline === 's' || o.underline === 'es' || o.underline === 'ed')
    );
  }, [allPronExercises]);

  return (
    <div className="space-y-7">
      {/* Hero Overview */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
            Phòng Ngữ Âm Trực Quan Lớp 6 · Chuẩn Bộ Đề Unit 1–12
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Nhìn khẩu hình, nghe đối chiếu cặp âm &amp; chinh phục trọn điểm Ngữ âm
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Học thuộc quy tắc phát âm bằng sơ đồ 3 bước trực quan, nghe so sánh trực tiếp các cặp từ dễ nhầm và luyện{' '}
            <strong className="text-slate-900">{allPronExercises.length} câu hỏi chuẩn đề thi</strong> kèm bảng phân nhóm âm sau mỗi câu.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              onStartPractice(
                'Thi thử nhanh · 12 câu Ngữ âm Học kỳ 2 (Unit 7–12)',
                buildPronunciationMix(2, 12)
              )
            }
            className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Thi thử 12 câu Ngữ âm HK2</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onStartPractice(
                'Thi thử nhanh · 12 câu Ngữ âm Học kỳ 1 (Unit 1–6)',
                buildPronunciationMix(1, 12)
              )
            }
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Thi thử 12 câu Ngữ âm HK1</span>
          </button>

          <p className="text-xs text-slate-500 text-center pt-0.5">
            Đã chinh phục:{' '}
            <strong className="font-mono-code text-emerald-700 tabular-nums">
              {completedPronCount}/{allPronExercises.length}
            </strong>{' '}
            câu ngữ âm
          </p>
        </div>
      </section>

      {/* 3 Sub-Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        {(
          [
            { id: 'lab', label: `1. Sơ đồ Khẩu hình & Quy tắc vàng (${PHONETIC_LESSONS.length})` },
            { id: 'traps', label: `2. Bản đồ "Bẫy chữ cái" (${TRICKY_LETTER_GROUPS.length} nhóm)` },
            { id: 'drills', label: `3. Kho luyện đề theo Unit (${allPronExercises.length} câu)` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              subTab === tab.id
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===================================================================
          TAB 1: VISUAL ARTICULATION & SOUND RULES LAB
      =================================================================== */}
      {subTab === 'lab' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Rail: 10 Sound Mastery Topics grouped by HK2 & HK1 */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-3 space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-sky-700 px-3 pt-1.5 pb-1">
                Học kỳ 2 · Unit 7–12 ({hk2Lessons.length} chuyên đề mới)
              </p>
              {hk2Lessons.map((lesson, idx) => {
                const active = lesson.id === activeLesson.id;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => {
                      clearCompareTimers();
                      stopSpeaking();
                      setActiveCompareWord(null);
                      setSelectedLessonId(lesson.id);
                    }}
                    className={`w-full px-3.5 py-3 rounded-xl text-left transition-colors ${
                      active
                        ? 'bg-sky-50 text-sky-950 border border-sky-200'
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display font-bold text-sm">
                        {idx + 1}. {lesson.shortTitle}
                      </span>
                      <span className="text-[11px] text-sky-700 shrink-0">{lesson.unitRange}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1">
              <p className="text-xs font-semibold text-slate-500 px-3 pt-1 pb-1">
                Học kỳ 1 &amp; Nền tảng ({hk1Lessons.length} chuyên đề)
              </p>
              {hk1Lessons.map((lesson, idx) => {
                const active = lesson.id === activeLesson.id;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => {
                      clearCompareTimers();
                      stopSpeaking();
                      setActiveCompareWord(null);
                      setSelectedLessonId(lesson.id);
                    }}
                    className={`w-full px-3.5 py-3 rounded-xl text-left transition-colors ${
                      active
                        ? 'bg-sky-50 text-sky-950 border border-sky-200'
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display font-bold text-sm">
                        {hk2Lessons.length + idx + 1}. {lesson.shortTitle}
                      </span>
                      <span className="text-[11px] text-slate-500 shrink-0">{lesson.unitRange}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Interactive Stage */}
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-sky-700">{activeLesson.unitRange}</p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                  {activeLesson.title}
                </h2>
                <p className="text-sm text-slate-600">{activeLesson.headline}</p>
              </div>

              {/* Visual Articulation / Flow Diagram */}
              <VisualArticulationDiagram lesson={activeLesson} />

              {/* Interactive Listen-and-Contrast Pairs */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-sky-300 text-xs font-semibold uppercase tracking-wider">
                  <Ear className="w-4 h-4" />
                  <span>Nghe đối chiếu trực tiếp — Tai nghe là nhớ ngay!</span>
                </div>

                <div className="space-y-3.5">
                  {activeLesson.contrastPairs.map((pair) => (
                    <div
                      key={pair.label}
                      className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-100">{pair.label}</span>
                        <button
                          type="button"
                          onClick={() => playContrastSequence(pair.words)}
                          className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto transition-colors"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Nghe so sánh lần lượt</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {pair.words.map((w) => {
                          const isPlayingNow = activeCompareWord === w.word;
                          return (
                            <button
                              key={w.word}
                              type="button"
                              onClick={() => {
                                setActiveCompareWord(w.word);
                                speakEnglish(w.word, {
                                  rate: 0.82,
                                  onEnd: () => setActiveCompareWord(null),
                                });
                              }}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                isPlayingNow
                                  ? 'bg-sky-500/20 border-sky-400 scale-[1.01]'
                                  : 'bg-slate-900/70 border-slate-700 hover:border-sky-400'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-display font-bold text-base text-white">
                                  {w.word}
                                </span>
                                <span className="font-mono-code text-xs font-bold text-sky-300">
                                  {w.sound}
                                </span>
                              </div>
                              <p className="font-mono-code text-xs text-slate-400 mt-0.5">{w.ipa}</p>
                              <p className="text-xs text-slate-300 mt-0.5">{w.meaning}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mnemonic & Exam Tip Callout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                    <strong className="font-semibold">Câu thần chú nhớ nhanh: </strong>
                    {activeLesson.mnemonic}
                  </div>
                </div>

                <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-4 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-sky-950 leading-relaxed">
                    <strong className="font-semibold">Mẹo làm đề 3 giây: </strong>
                    {activeLesson.examTip}
                  </div>
                </div>
              </div>

              {/* Sound Buckets with Clickable Words */}
              <div className="space-y-4">
                <h3 className="font-display font-bold text-base text-slate-900">
                  Bảng từ mẫu phân nhóm âm (Bấm từng từ để nghe chuẩn / chậm)
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {activeLesson.buckets.map((bucket) => {
                    const palette = BUCKET_ACCENTS[bucket.accent];
                    return (
                      <div
                        key={bucket.sound}
                        className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 ${palette.card}`}
                      >
                        <div
                          className={`flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-2.5 border-b ${palette.head}`}
                        >
                          <div className="flex items-baseline gap-2.5">
                            <span className={`font-mono-code text-xl font-bold ${palette.symbol}`}>
                              {bucket.sound}
                            </span>
                            <span className="font-display font-bold text-sm sm:text-base text-slate-900">
                              {bucket.label}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs sm:text-sm text-slate-700">
                          <p>
                            <strong>Khẩu hình:</strong> {bucket.mouthCue}
                          </p>
                          <p>
                            <strong>Quy tắc:</strong> {bucket.rule}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                          {bucket.words.map((item) => (
                            <div
                              key={item.word}
                              className="bg-white border border-slate-200 hover:border-sky-400 rounded-xl p-3 flex items-center justify-between gap-2 transition-colors"
                            >
                              <button
                                type="button"
                                onClick={() => speakEnglish(item.word, { rate: 0.9 })}
                                className="text-left min-w-0 flex-1"
                              >
                                <p className="font-display font-bold text-sm text-slate-900 truncate">
                                  {renderHighlightedLetters(
                                    item.word,
                                    item.underline,
                                    item.underlineIndex,
                                    activeLesson.visualType === 'silent'
                                  )}
                                </p>
                                <p className="font-mono-code text-[11px] text-slate-500 truncate">
                                  {item.ipa}
                                </p>
                                <p className="text-[11px] text-slate-600 truncate">{item.meaning}</p>
                              </button>

                              <div className="flex flex-col gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => speakEnglish(item.word, { rate: 0.92 })}
                                  title="Nghe chuẩn"
                                  className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => speakEnglish(item.word, { rate: 0.65 })}
                                  title="Nghe chậm"
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                >
                                  <Turtle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          TAB 2: TRICKY LETTER SPLIT MAP ("Cùng 1 chữ cái nhưng khác âm!")
      =================================================================== */}
      {subTab === 'traps' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {TRICKY_LETTER_GROUPS.map((grp) => (
              <button
                key={grp.id}
                type="button"
                onClick={() => setSelectedTrapId(grp.id)}
                className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                  grp.id === activeTrap.id
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-sky-400'
                }`}
              >
                Chữ <span className="font-mono-code font-bold">&ldquo;{grp.letter}&rdquo;</span>
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <span className="min-w-14 h-14 px-3.5 rounded-2xl bg-sky-600 text-white font-mono-code text-lg sm:text-xl font-bold flex items-center justify-center shrink-0 whitespace-nowrap">
                  {activeTrap.letter}
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">
                    {activeTrap.title}
                  </h2>
                  <p className="text-sm text-slate-600">{activeTrap.summary}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeTrap.branches.map((branch) => (
                <div
                  key={branch.sound}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
                >
                  <div className="pb-2.5 border-b border-slate-200/80">
                    <p className="font-mono-code text-2xl font-bold text-sky-700">{branch.sound}</p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{branch.cue}</p>
                  </div>

                  <div className="space-y-2">
                    {branch.words.map((w) => (
                      <button
                        key={w.word}
                        type="button"
                        onClick={() => speakEnglish(w.word, { rate: 0.85 })}
                        className="w-full bg-white border border-slate-200 hover:border-sky-400 rounded-xl px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition-colors group"
                      >
                        <div className="min-w-0">
                          <p className="font-display font-bold text-sm text-slate-900">
                            {renderHighlightedLetters(w.word, w.underline, w.underlineIndex)}
                          </p>
                          <p className="text-xs text-slate-500">
                            <span className="font-mono-code">{w.ipa}</span> · {w.meaning}
                          </p>
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
      )}

      {/* ===================================================================
          TAB 3: PDF PRONUNCIATION DRILL BANK BY UNIT
      =================================================================== */}
      {subTab === 'drills' && (
        <div className="space-y-6">
          {/* Special Focused Drills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Tổng ôn Ngữ âm Học kỳ 2 (Unit 7–12 · 15 câu ngẫu nhiên)',
                  buildPronunciationMix(2, 15)
                )
              }
              className="group text-left bg-slate-900 text-white rounded-2xl p-5 flex items-center justify-between gap-4 hover:bg-slate-800 transition-colors"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-sky-300">Trọng tâm Học kỳ 2 ({hk2PronExercises.length} câu)</p>
                <h3 className="font-display text-base sm:text-lg font-bold">
                  Đề trộn 15 câu Ngữ âm HK2
                </h3>
                <p className="text-xs text-slate-300">
                  Lọc từ bộ đề PDF Unit 7–12: /θ/–/ð/, /ɪə/–/eə/, chữ a, g, -ed, -s.
                </p>
              </div>
              <span className="w-10 h-10 rounded-xl bg-sky-500 text-slate-950 flex items-center justify-center shrink-0">
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Tổng ôn Ngữ âm Học kỳ 1 (Unit 1–6 · 15 câu ngẫu nhiên)',
                  buildPronunciationMix(1, 15)
                )
              }
              className="group text-left bg-white border border-slate-200 hover:border-sky-400 rounded-2xl p-5 flex items-center justify-between gap-4 transition-colors"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-sky-700">Ôn tập Học kỳ 1 (Unit 1–6)</p>
                <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 group-hover:text-sky-700">
                  Đề trộn 15 câu Ngữ âm HK1
                </h3>
                <p className="text-xs text-slate-600">
                  Trích lọc ngẫu nhiên từ bộ đề PDF Unit 1–6 kèm phân nhóm âm trực quan.
                </p>
              </div>
              <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Chuyên đề Ngữ âm · Đuôi -s / -es & -ed',
                  suffixPracticeExercises
                )
              }
              className="group text-left bg-white border border-slate-200 hover:border-sky-400 rounded-2xl p-5 flex items-center justify-between gap-4 transition-colors"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-emerald-700">Chuyên đề ăn điểm tuyệt đối</p>
                <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 group-hover:text-sky-700">
                  Đuôi -s/-es &amp; -ed ({suffixPracticeExercises.length} câu)
                </h3>
                <p className="text-xs text-slate-600">
                  Áp dụng câu thần chú 3 cột cho cả Học kỳ 1 và Học kỳ 2.
                </p>
              </div>
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>
          </div>

          {/* Semester Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-base text-slate-900">
                Luyện từng bài theo Unit (Chuẩn đề PDF)
              </h2>
              <p className="text-xs text-slate-500">
                Mỗi Unit gồm bộ câu hỏi chuẩn xác kèm bảng phân nhóm âm &amp; loa đọc trực tiếp.
              </p>
            </div>
            <div className="inline-flex bg-white border border-slate-200 rounded-xl p-1 self-start">
              {(
                [
                  { id: 'all', label: 'Tất cả 12 Unit' },
                  { id: 2, label: 'Học kỳ 2 (7–12)' },
                  { id: 1, label: 'Học kỳ 1 (1–6)' },
                ] as const
              ).map((opt) => (
                <button
                  key={String(opt.id)}
                  type="button"
                  onClick={() => setDrillSemester(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    drillSemester === opt.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Per-Unit Pronunciation Sets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUnits.map((unit) => {
              const unitProns = getPronunciationByUnit(unit.id);
              const done = unitProns.filter((e) =>
                progress.completedExerciseIds.includes(e.id)
              ).length;
              const pct = unitProns.length > 0 ? Math.round((done / unitProns.length) * 100) : 0;

              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() =>
                    onStartPractice(
                      `Ngữ âm · ${unit.code}: ${unit.titleEn} (${unitProns.length} câu)`,
                      unitProns
                    )
                  }
                  className="group text-left bg-white border border-slate-200 hover:border-sky-400 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-sky-700">
                        Học kỳ {unit.semester} · {unit.code}
                      </span>
                      {pct === 100 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Xong
                        </span>
                      ) : (
                        <span className="font-mono-code text-slate-500 tabular-nums">
                          {unitProns.length} câu
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-base text-slate-900 group-hover:text-sky-700 transition-colors">
                      {unit.titleEn}
                    </h3>
                    <p className="text-xs text-slate-600">{unit.phoneticFocus}</p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Đã đúng {done}/{unitProns.length} câu</span>
                      <span className="font-mono-code font-semibold text-slate-700 tabular-nums">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct === 100 ? 'bg-emerald-500' : 'bg-sky-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
