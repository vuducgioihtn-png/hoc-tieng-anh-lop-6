import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Play,
  Radar,
  Sparkles,
  Turtle,
  Volume2,
} from 'lucide-react';
import {
  ALL_UNITS,
  buildStressMix,
  getAllStressExercises,
  getStressByUnit,
} from '../data/curriculum';
import {
  STRESS_LESSONS,
  SUFFIX_RADAR_GROUPS,
  StressMasteryLesson,
  StressWordSample,
} from '../data/stressBank';
import { Exercise, StudentProgress } from '../types';
import { speakEnglish, stopSpeaking } from '../utils/speech';

interface StressStudioProps {
  progress: StudentProgress;
  onStartPractice: (title: string, exercises: Exercise[]) => void;
}

const ACCENT_STYLES = {
  sky: {
    card: 'bg-sky-50/60 border-sky-200',
    head: 'border-sky-200/80',
    title: 'text-sky-800',
    barActive: 'bg-sky-600',
    sylActive: 'bg-sky-600 text-white border-sky-600',
  },
  emerald: {
    card: 'bg-emerald-50/60 border-emerald-200',
    head: 'border-emerald-200/80',
    title: 'text-emerald-800',
    barActive: 'bg-emerald-600',
    sylActive: 'bg-emerald-600 text-white border-emerald-600',
  },
  amber: {
    card: 'bg-amber-50/60 border-amber-200',
    head: 'border-amber-200/80',
    title: 'text-amber-800',
    barActive: 'bg-amber-500',
    sylActive: 'bg-amber-500 text-white border-amber-500',
  },
  rose: {
    card: 'bg-rose-50/60 border-rose-200',
    head: 'border-rose-200/80',
    title: 'text-rose-800',
    barActive: 'bg-rose-600',
    sylActive: 'bg-rose-600 text-white border-rose-600',
  },
};

function getBeatNotation(syllablesCount: number, stressIndex: number): string {
  return Array.from({ length: syllablesCount }, (_, i) => (i === stressIndex ? 'O' : 'o')).join('-');
}

const SyllableBeatVisual: React.FC<{
  syllables: string[];
  stressIndex: number;
  accent?: 'sky' | 'emerald' | 'amber' | 'rose';
  compact?: boolean;
}> = ({ syllables, stressIndex, accent = 'sky', compact = false }) => {
  const style = ACCENT_STYLES[accent];
  return (
    <div className="flex items-end gap-1.5" aria-label={`Nhấn âm tiết ${stressIndex + 1}`}>
      {syllables.map((syl, idx) => {
        const isStressed = idx === stressIndex;
        return (
          <div key={`${syl}-${idx}`} className="flex flex-col items-center gap-1">
            {/* Acoustic height bar: tall on stressed syllable, short on unstressed */}
            <div className="h-5 flex items-end justify-center">
              <span
                className={`block rounded-full transition-all ${
                  isStressed
                    ? `${compact ? 'w-3 h-5' : 'w-3.5 h-5'} ${style.barActive}`
                    : `${compact ? 'w-2 h-2' : 'w-2.5 h-2'} bg-slate-300`
                }`}
              />
            </div>
            {/* Syllable text block */}
            <span
              className={`rounded-md border font-display leading-none ${
                compact ? 'px-1.5 py-1 text-xs' : 'px-2 py-1 text-sm'
              } ${
                isStressed
                  ? `${style.sylActive} font-bold uppercase shadow-xs`
                  : 'bg-white border-slate-200 text-slate-600 font-medium'
              }`}
            >
              {syl}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const VisualStressPatternDiagram: React.FC<{ lesson: StressMasteryLesson }> = ({ lesson }) => {
  if (lesson.visualPattern === 'two_syllable') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display font-bold text-sm text-sky-950">
              Danh từ &amp; Tính từ (2 âm tiết)
            </p>
            <span className="font-mono-code text-xs font-bold text-sky-700">O - o · Âm 1</span>
          </div>
          <div className="flex items-end gap-3 pt-1">
            <SyllableBeatVisual syllables={['COM', 'pass']} stressIndex={0} accent="sky" />
            <SyllableBeatVisual syllables={['QUI', 'et']} stressIndex={0} accent="sky" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nhịp mạnh rơi ngay ở <strong>âm đầu</strong>: cao – thấp (TA-ta).
          </p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display font-bold text-sm text-emerald-950">
              Động từ (2 âm tiết)
            </p>
            <span className="font-mono-code text-xs font-bold text-emerald-700">o - O · Âm 2</span>
          </div>
          <div className="flex items-end gap-3 pt-1">
            <SyllableBeatVisual syllables={['sur', 'ROUND']} stressIndex={1} accent="emerald" />
            <SyllableBeatVisual syllables={['pre', 'PARE']} stressIndex={1} accent="emerald" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nhịp mạnh đẩy sang <strong>âm thứ hai</strong>: thấp – cao (ta-TA).
          </p>
        </div>
      </div>
    );
  }

  if (lesson.visualPattern === 'compound') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="font-display font-bold text-sm text-slate-900">
            Công thức Danh từ ghép: [Từ 1 MẠNH] + [Từ 2 nhẹ]
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Giống tiếng Việt phân biệt loại đồ vật: <strong>GREEN</strong>-house (nhà kính),{' '}
            <strong>CLASS</strong>-mate (bạn cùng lớp), <strong>DISH</strong>-washer (máy rửa bát).
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SyllableBeatVisual syllables={['GREEN', 'house']} stressIndex={0} accent="sky" />
          <span className="text-slate-400 font-bold text-xs">vs</span>
          <SyllableBeatVisual syllables={['back', 'YARD']} stressIndex={1} accent="amber" />
        </div>
      </div>
    );
  }

  if (lesson.visualPattern === 'before_suffix') {
    return (
      <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-3">
        <p className="font-display font-bold text-sm text-sky-950">
          Mũi tên hút trọng âm: Thấy đuôi -tion / -ic / -ial / -ity → LÙI LẠI 1 ÂM ngay trước nó!
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white border border-sky-200 rounded-lg px-3 py-2">
            <span className="text-xs text-slate-500">his</span>
            <span className="text-slate-300">-</span>
            <span className="px-2 py-0.5 rounded bg-sky-600 text-white font-display font-bold text-xs">
              TO
            </span>
            <span className="text-sky-600 font-bold text-xs">←</span>
            <span className="font-mono-code text-xs font-bold text-rose-600 underline decoration-2 underline-offset-4">
              ric
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-sky-200 rounded-lg px-3 py-2">
            <span className="text-xs text-slate-500">de-co</span>
            <span className="text-slate-300">-</span>
            <span className="px-2 py-0.5 rounded bg-sky-600 text-white font-display font-bold text-xs">
              RA
            </span>
            <span className="text-sky-600 font-bold text-xs">←</span>
            <span className="font-mono-code text-xs font-bold text-rose-600 underline decoration-2 underline-offset-4">
              tion
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-sky-200 rounded-lg px-3 py-2">
            <span className="text-xs text-slate-500">tra</span>
            <span className="text-slate-300">-</span>
            <span className="px-2 py-0.5 rounded bg-sky-600 text-white font-display font-bold text-xs">
              DI
            </span>
            <span className="text-sky-600 font-bold text-xs">←</span>
            <span className="font-mono-code text-xs font-bold text-rose-600 underline decoration-2 underline-offset-4">
              tional
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (lesson.visualPattern === 'on_suffix') {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
        <p className="font-display font-bold text-sm text-emerald-950">
          Đuôi "Nam châm" (-eer, -ee, -ese, -een, -oon): Trọng âm DÍNH CHẶT NGAY CHÍNH ĐUÔI ĐÓ!
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <SyllableBeatVisual syllables={['vol', 'un', 'TEER']} stressIndex={2} accent="emerald" />
          <SyllableBeatVisual syllables={['Viet', 'na', 'MESE']} stressIndex={2} accent="emerald" />
          <SyllableBeatVisual syllables={['af', 'ter', 'NOON']} stressIndex={2} accent="emerald" />
        </div>
      </div>
    );
  }

  if (lesson.visualPattern === 'three_syllable') {
    return (
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2.5">
        <p className="font-display font-bold text-sm text-amber-950">
          Quy tắc đếm ngược 3 nhịp (Từ đuôi -ate, -ize, -y, -al, -ous đếm ngược lên Âm 1):
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <SyllableBeatVisual syllables={['CE', 'le', 'brate']} stressIndex={0} accent="amber" />
          <SyllableBeatVisual syllables={['FUR', 'ni', 'ture']} stressIndex={0} accent="amber" />
          <SyllableBeatVisual syllables={['DAN', 'ge', 'rous']} stressIndex={0} accent="amber" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 space-y-2.5">
      <p className="font-display font-bold text-sm text-rose-950">
        Tiền tố yếu (a-, be-, re-, de-, ex-, dis-) lướt nhẹ → Trọng âm nhảy thẳng vào GỐC TỪ phía sau!
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <SyllableBeatVisual syllables={['a', 'PART', 'ment']} stressIndex={1} accent="rose" />
        <SyllableBeatVisual syllables={['be', 'HIND']} stressIndex={1} accent="rose" />
        <SyllableBeatVisual syllables={['ex', 'CI', 'ting']} stressIndex={1} accent="rose" />
      </div>
    </div>
  );
};

export const StressStudio: React.FC<StressStudioProps> = ({ progress, onStartPractice }) => {
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'radar' | 'drills'>('rules');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('hk2-word-families');
  const [selectedRadarId, setSelectedRadarId] = useState<string>('radar-hk2-loanwords');
  const [drillSemester, setDrillSemester] = useState<'all' | 2 | 1>('all');
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);

  const hk2Lessons = useMemo(
    () => STRESS_LESSONS.filter((l) => l.id.startsWith('hk2-')),
    []
  );
  const foundationLessons = useMemo(
    () => STRESS_LESSONS.filter((l) => !l.id.startsWith('hk2-')),
    []
  );

  const selectedLesson = useMemo(
    () => STRESS_LESSONS.find((l) => l.id === selectedLessonId) ?? STRESS_LESSONS[0],
    [selectedLessonId]
  );

  const selectedRadar = useMemo(
    () => SUFFIX_RADAR_GROUPS.find((g) => g.id === selectedRadarId) ?? SUFFIX_RADAR_GROUPS[0],
    [selectedRadarId]
  );

  const allStress = useMemo(() => getAllStressExercises(), []);
  const sem1Stress = useMemo(() => getAllStressExercises(1), []);
  const sem2Stress = useMemo(() => getAllStressExercises(2), []);
  const completedStressCount = useMemo(
    () => allStress.filter((e) => progress.completedExerciseIds.includes(e.id)).length,
    [allStress, progress.completedExerciseIds]
  );
  const filteredUnits = useMemo(
    () =>
      drillSemester === 'all'
        ? ALL_UNITS
        : ALL_UNITS.filter((unit) => unit.semester === drillSemester),
    [drillSemester]
  );

  const clearSequenceTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearSequenceTimers();
      stopSpeaking();
    };
  }, []);

  const playSingleWord = (word: string, rate = 0.88) => {
    clearSequenceTimers();
    setPlayingWord(word);
    speakEnglish(word, { rate });
    const t = window.setTimeout(() => setPlayingWord(null), 1150);
    timersRef.current.push(t);
  };

  const playContrastSequence = (words: StressWordSample[]) => {
    clearSequenceTimers();
    stopSpeaking();
    words.forEach((item, index) => {
      const startTimer = window.setTimeout(() => {
        setPlayingWord(item.word);
        speakEnglish(item.word, { rate: 0.82 });
      }, index * 1350);
      timersRef.current.push(startTimer);
    });
    const endTimer = window.setTimeout(() => setPlayingWord(null), words.length * 1350 + 250);
    timersRef.current.push(endTimer);
  };

  return (
    <div className="space-y-7">
      {/* Hero Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
            Phòng Trọng Âm Trực Quan · Chuẩn bộ đề PDF Unit 1 – 6 &amp; 7 – 12
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
            Nhìn nhịp cột cao – thấp, nghe một lần chốt ngay Trọng âm
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Học thuộc {STRESS_LESSONS.length} quy tắc vàng (HK1–HK2) bằng sơ đồ cột nhịp (O-o / o-O), quét{' '}
            {SUFFIX_RADAR_GROUPS.length} nhóm Ra-đa đuôi từ thần kỳ và luyện trọn kho{' '}
            <strong className="text-slate-900">{allStress.length} câu Trọng âm</strong> chuẩn đề PDF Unit 1–12.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0">
          <div className="flex items-center gap-5 text-sm">
            <div>
              <p className="text-xs text-slate-500">Đã chinh phục</p>
              <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
                {completedStressCount}/{allStress.length}{' '}
                <span className="text-xs font-normal text-slate-500">câu</span>
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-500">Kho đề HK2 PDF</p>
              <p className="font-display text-xl font-bold text-sky-700 tabular-nums">
                {sem2Stress.length}{' '}
                <span className="text-xs font-normal text-slate-500">câu</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Thi thử 15 câu Trọng âm Học kỳ 2 (Unit 7–12)',
                  buildStressMix(2, 15)
                )
              }
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-xs whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Thi thử 15 câu Trọng âm HK2</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Thi thử 15 câu Trọng âm Học kỳ 1 (Unit 1–6)',
                  buildStressMix(1, 15)
                )
              }
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Thi thử 15 câu Trọng âm HK1</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3 Sub-Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        {(
          [
            {
              id: 'rules',
              label: `1. ${STRESS_LESSONS.length} Quy tắc Vàng & Nhịp Trọng Âm`,
              icon: Activity,
            },
            {
              id: 'radar',
              label: `2. Ra-đa Đuôi & Tiền tố (${SUFFIX_RADAR_GROUPS.length} nhóm)`,
              icon: Radar,
            },
            {
              id: 'drills',
              label: `3. Kho luyện đề Trọng âm (${allStress.length} câu)`,
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

      {/* TAB 1: GOLDEN RULES & RHYTHM LAB */}
      {activeSubTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Lesson Selector Rail grouped by HK2 & Foundation */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-sky-700 px-1">
                Học kỳ 2 · Chuyên sâu Unit 7–12 ({hk2Lessons.length} bài mới)
              </p>
              {hk2Lessons.map((lesson, idx) => {
                const active = lesson.id === selectedLesson.id;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => {
                      clearSequenceTimers();
                      stopSpeaking();
                      setPlayingWord(null);
                      setSelectedLessonId(lesson.id);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      active
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-white border-slate-200 hover:border-sky-400 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-mono-code text-xs font-bold ${
                          active ? 'text-sky-300' : 'text-sky-700'
                        }`}
                      >
                        HK2 · Chuyên đề {idx + 1}
                      </span>
                      <ArrowRight
                        className={`w-4 h-4 shrink-0 ${active ? 'text-sky-300' : 'text-slate-400'}`}
                      />
                    </div>
                    <p className="font-display font-bold text-sm sm:text-base mt-1 leading-snug">
                      {lesson.shortTitle}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-500 px-1">
                6 Quy tắc Nền tảng (Xuyên suốt Unit 1–12)
              </p>
              {foundationLessons.map((lesson, idx) => {
                const active = lesson.id === selectedLesson.id;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => {
                      clearSequenceTimers();
                      stopSpeaking();
                      setPlayingWord(null);
                      setSelectedLessonId(lesson.id);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      active
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-white border-slate-200 hover:border-sky-400 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-mono-code text-xs font-bold ${
                          active ? 'text-sky-300' : 'text-sky-700'
                        }`}
                      >
                        Quy tắc {idx + 1} · {lesson.unitRange}
                      </span>
                      <ArrowRight
                        className={`w-4 h-4 shrink-0 ${active ? 'text-sky-300' : 'text-slate-400'}`}
                      />
                    </div>
                    <p className="font-display font-bold text-sm sm:text-base mt-1 leading-snug">
                      {lesson.shortTitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Interactive Visual Rhythm Stage */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
            <div>
              <p className="text-xs font-semibold text-sky-700">
                Áp dụng xuyên suốt {selectedLesson.unitRange}
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {selectedLesson.title}
              </h2>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                {selectedLesson.headline}
              </p>
            </div>

            {/* Visual Rhythm Diagram */}
            <VisualStressPatternDiagram lesson={selectedLesson} />

            {/* Live Sequential Contrast Audio Stage */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    So sánh nhịp Trọng âm trực tiếp (Nghe &amp; Nhìn cột nhịp)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Bấm nút "Nghe lần lượt" để tai em nhận rõ âm đọc cao – to hơn hẳn âm còn lại.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedLesson.contrastPairs.map((pair) => (
                  <div
                    key={pair.label}
                    className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-700">{pair.label}</p>
                      <button
                        type="button"
                        onClick={() => playContrastSequence(pair.words)}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Nghe lần lượt</span>
                      </button>
                    </div>

                    <div
                      className={`grid grid-cols-1 gap-3 ${
                        pair.words.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
                      }`}
                    >
                      {pair.words.map((item) => {
                        const isSpeaking = playingWord === item.word;
                        return (
                          <button
                            key={item.word}
                            type="button"
                            onClick={() => playSingleWord(item.word, 0.85)}
                            className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                              isSpeaking
                                ? 'bg-sky-50 border-sky-600 ring-2 ring-sky-200'
                                : 'bg-slate-50/70 border-slate-200 hover:border-sky-400'
                            }`}
                          >
                            <div className="space-y-2">
                              <SyllableBeatVisual
                                syllables={item.syllables}
                                stressIndex={item.stressIndex}
                                accent={item.stressIndex === 0 ? 'sky' : 'emerald'}
                                compact
                              />
                              <div>
                                <p className="font-mono-code text-xs text-slate-600">
                                  {item.ipa} ·{' '}
                                  <strong className="text-slate-900">
                                    Âm {item.stressIndex + 1} (
                                    {getBeatNotation(item.syllables.length, item.stressIndex)})
                                  </strong>
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">{item.meaning}</p>
                              </div>
                            </div>
                            <Volume2
                              className={`w-4 h-4 shrink-0 ${
                                isSpeaking ? 'text-sky-600' : 'text-slate-400'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mnemonic & Exam Tip Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                  <strong className="font-semibold block mb-0.5">Câu thần chú dễ nhớ:</strong>
                  {selectedLesson.mnemonic}
                </div>
              </div>

              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-sky-950 leading-relaxed">
                  <strong className="font-semibold block mb-0.5">Mẹo làm bài thi 3 giây:</strong>
                  {selectedLesson.examTip}
                </div>
              </div>
            </div>

            {/* Grouped Syllable Word Cards */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-base text-slate-900">
                Bảng từ vựng mẫu chia âm tiết (Bấm loa nghe thường hoặc biểu tượng rùa nghe chậm)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedLesson.groups.map((group) => {
                  const style = ACCENT_STYLES[group.accent];
                  return (
                    <div
                      key={group.title}
                      className={`border rounded-xl p-4 space-y-3 ${style.card}`}
                    >
                      <div className={`pb-2.5 border-b ${style.head}`}>
                        <p className={`font-mono-code text-xs font-bold ${style.title}`}>
                          {group.badge}
                        </p>
                        <h4 className="font-display font-bold text-sm text-slate-900 mt-0.5">
                          {group.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{group.rule}</p>
                      </div>

                      <div className="space-y-2">
                        {group.words.map((item) => {
                          const isSpeaking = playingWord === item.word;
                          return (
                            <div
                              key={item.word}
                              className={`bg-white border rounded-xl p-3 flex items-center justify-between gap-2.5 transition-all ${
                                isSpeaking ? 'border-sky-500 ring-2 ring-sky-200' : 'border-slate-200'
                              }`}
                            >
                              <div className="space-y-1.5 min-w-0">
                                <SyllableBeatVisual
                                  syllables={item.syllables}
                                  stressIndex={item.stressIndex}
                                  accent={group.accent}
                                  compact
                                />
                                <p className="text-xs text-slate-600 truncate">
                                  <span className="font-mono-code text-slate-500">{item.ipa}</span> ·{' '}
                                  {item.meaning}
                                </p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => playSingleWord(item.word, 0.9)}
                                  title={`Nghe từ ${item.word}`}
                                  className="p-2 rounded-lg bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-600 hover:text-sky-700 transition-colors"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => playSingleWord(item.word, 0.65)}
                                  title={`Nghe chậm từ ${item.word}`}
                                  className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-500 hover:text-amber-700 transition-colors"
                                >
                                  <Turtle className="w-3.5 h-3.5" />
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
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUFFIX & PREFIX STRESS RADAR */}
      {activeSubTab === 'radar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUFFIX_RADAR_GROUPS.map((group) => {
              const active = group.id === selectedRadar.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedRadarId(group.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    active
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-white border-slate-200 hover:border-sky-400 text-slate-900'
                  }`}
                >
                  <p
                    className={`font-mono-code text-sm font-bold ${
                      active ? 'text-sky-300' : 'text-sky-700'
                    }`}
                  >
                    {group.suffixes}
                  </p>
                  <p className="font-display font-bold text-sm mt-1 leading-snug">
                    {group.ruleTitle}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <p className="font-mono-code text-sm font-bold text-sky-700">
                  {selectedRadar.suffixes}
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                  {selectedRadar.ruleTitle}
                </h2>
                <p className="text-sm text-slate-600 mt-1">{selectedRadar.arrowNote}</p>
              </div>
              <button
                type="button"
                onClick={() => playContrastSequence(selectedRadar.examples)}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shrink-0 self-start transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Nghe lần lượt {selectedRadar.examples.length} từ mẫu</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedRadar.examples.map((sample) => {
                const isSpeaking = playingWord === sample.word;
                const accent: 'sky' | 'emerald' | 'amber' | 'rose' =
                  selectedRadar.positionType === 'before'
                    ? 'sky'
                    : selectedRadar.positionType === 'self'
                      ? 'emerald'
                      : selectedRadar.positionType === 'first'
                        ? 'amber'
                        : 'rose';

                return (
                  <button
                    key={sample.word}
                    type="button"
                    onClick={() => playSingleWord(sample.word, 0.85)}
                    className={`p-4 rounded-xl border text-left transition-all space-y-3 ${
                      isSpeaking
                        ? 'bg-sky-50 border-sky-600 ring-2 ring-sky-200'
                        : 'bg-slate-50/70 border-slate-200 hover:border-sky-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono-code text-xs font-bold text-sky-700 inline-flex items-center gap-1">
                        <ArrowDown className="w-3.5 h-3.5" />
                        Nhấn Âm {sample.stressIndex + 1} (
                        {getBeatNotation(sample.syllables.length, sample.stressIndex)})
                      </span>
                      <Volume2
                        className={`w-4 h-4 shrink-0 ${
                          isSpeaking ? 'text-sky-600' : 'text-slate-400'
                        }`}
                      />
                    </div>

                    <SyllableBeatVisual
                      syllables={sample.syllables}
                      stressIndex={sample.stressIndex}
                      accent={accent}
                    />

                    <div>
                      <p className="font-mono-code text-xs text-slate-600">{sample.ipa}</p>
                      <p className="text-xs font-medium text-slate-700 mt-0.5">{sample.meaning}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UNIT-BY-UNIT PDF STRESS DRILL BANK */}
      {activeSubTab === 'drills' && (
        <div className="space-y-6">
          {/* 4 Specialty Drill Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Thi thử 15 câu Trọng âm Học kỳ 2 (Unit 7–12)',
                  buildStressMix(2, 15)
                )
              }
              className="text-left p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white space-y-2 transition-colors"
            >
              <p className="text-xs font-semibold text-sky-300">Đề tổng hợp HK2 · Chuẩn PDF</p>
              <h3 className="font-display font-bold text-base sm:text-lg">15 câu Unit 7 – 12</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Trộn ngẫu nhiên từ {sem2Stress.length} câu HK2 kèm sơ đồ cột nhịp tách 3-vs-1.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Thi thử 15 câu Trọng âm Học kỳ 1 (Unit 1–6)',
                  buildStressMix(1, 15)
                )
              }
              className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 space-y-2 transition-colors"
            >
              <p className="text-xs font-semibold text-sky-700">Đề tổng hợp HK1 · Chuẩn PDF</p>
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                15 câu Unit 1 – 6
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Trộn ngẫu nhiên từ kho {sem1Stress.length} câu HK1 kèm giải thích chi tiết.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Chuyên đề Trọng âm Từ 2 âm tiết (O-o vs o-O)',
                  buildStressMix('two_syllable', 12)
                )
              }
              className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 space-y-2 transition-colors"
            >
              <p className="text-xs font-semibold text-sky-700">Chuyên đề nền tảng</p>
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                12 câu Từ 2 âm tiết
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Phân biệt Danh/Tính nhấn Âm 1 với Động từ &amp; từ vay mượn nhấn Âm 2.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Chuyên đề Trọng âm Từ 3+ âm tiết & Hậu tố',
                  buildStressMix('three_plus', 12)
                )
              }
              className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 space-y-2 transition-colors"
            >
              <p className="text-xs font-semibold text-emerald-700">Chuyên đề nâng cao</p>
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
                12 câu Từ 3–5 âm tiết
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nhận diện đuôi -tion, -ic, -ial, -eer, -ade và từ dài nhấn Âm 3–4.
              </p>
            </button>
          </div>

          {/* 12 Units Stress Grid with Semester Filter */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Luyện đề Trọng âm chi tiết theo từng Unit (Unit 1 – Unit 12)
              </h3>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUnits.map((unit) => {
                const items = getStressByUnit(unit.id);
                if (items.length === 0) return null;
                const done = items.filter((e) =>
                  progress.completedExerciseIds.includes(e.id)
                ).length;
                const pct = Math.round((done / items.length) * 100);
                const allDone = done === items.length;

                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() =>
                      onStartPractice(`${unit.code}: ${unit.titleEn} · Trọng âm`, items)
                    }
                    className="group text-left bg-white border border-slate-200 hover:border-sky-400 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono-code text-xs font-bold text-sky-700">
                          {unit.code} · HK{unit.semester}
                        </span>
                        {allDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <span className="font-mono-code text-xs font-semibold text-slate-500 tabular-nums">
                            {done}/{items.length} câu
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-sky-700 transition-colors">
                        {unit.titleEn}
                      </h4>
                      <p className="text-xs text-slate-600">{unit.titleVi}</p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-sky-700 pt-1">
                        <span>Luyện {items.length} câu Trọng âm</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
