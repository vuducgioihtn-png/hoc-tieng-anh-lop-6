import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Lightbulb,
  Play,
  RotateCcw,
  SearchCheck,
  Sparkles,
  Volume2,
  XCircle,
} from 'lucide-react';
import {
  CORRECTION_RADAR_MODULES,
  CORRECTION_TAG_META,
  MISS_LIEN_FULL_CORRECT,
  MISS_LIEN_PASSAGE_TOKENS,
  PDF_PART2_SENTENCE_DRILLS,
  PassageBugToken,
} from '../data/correctionBank';
import {
  ALL_UNITS,
  buildCorrectionMix,
  getAllCorrectionExercises,
  getCorrectionByUnit,
} from '../data/curriculum';
import { CorrectionErrorTag, Exercise, StudentProgress } from '../types';
import { speakEnglish } from '../utils/speech';

interface CorrectionStudioProps {
  progress: StudentProgress;
  onStartPractice: (title: string, exercises: Exercise[]) => void;
}

const RADAR_ACCENTS = {
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
  indigo: {
    step1: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    badge: 'bg-indigo-600 text-white',
  },
  rose: {
    step1: 'bg-rose-50 border-rose-200 text-rose-900',
    badge: 'bg-rose-600 text-white',
  },
  violet: {
    step1: 'bg-violet-50 border-violet-200 text-violet-900',
    badge: 'bg-violet-600 text-white',
  },
};

export const CorrectionStudio: React.FC<CorrectionStudioProps> = ({
  progress,
  onStartPractice,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'radar' | 'proofread' | 'drills'>('radar');
  const [selectedModuleId, setSelectedModuleId] = useState<CorrectionErrorTag>('conjunction_wh');

  // Interactive Proofread Lab state (Tab 2) — default to HK2 Mission 1
  const [proofreadSemester, setProofreadSemester] = useState<2 | 1>(2);
  const [missionId, setMissionId] = useState<string>('part2-u7-u8');
  const [foundPassageIds, setFoundPassageIds] = useState<string[]>([]);
  const [activePassageBug, setActivePassageBug] = useState<PassageBugToken | null>(null);
  const [hintPassageId, setHintPassageId] = useState<string | null>(null);
  const [passageFeedback, setPassageFeedback] = useState<string | null>(null);

  const [solvedSentenceIds, setSolvedSentenceIds] = useState<string[]>([]);
  const [sentenceWrongTap, setSentenceWrongTap] = useState<Record<string, string>>({});
  const [sentenceHintIds, setSentenceHintIds] = useState<string[]>([]);

  // Tab 3 semester filter
  const [drillsSemesterFilter, setDrillsSemesterFilter] = useState<'all' | 2 | 1>('all');

  const hk2Modules = useMemo(
    () => CORRECTION_RADAR_MODULES.filter((m) => m.semester === 2),
    []
  );
  const hk1Modules = useMemo(
    () => CORRECTION_RADAR_MODULES.filter((m) => m.semester !== 2),
    []
  );

  const selectedModule = useMemo(
    () =>
      CORRECTION_RADAR_MODULES.find((m) => m.id === selectedModuleId) ??
      CORRECTION_RADAR_MODULES[0],
    [selectedModuleId]
  );

  const allCor = useMemo(() => getAllCorrectionExercises(), []);
  const sem1Cor = useMemo(() => getAllCorrectionExercises(1), []);
  const sem2Cor = useMemo(() => getAllCorrectionExercises(2), []);
  const completedCorCount = useMemo(
    () => allCor.filter((e) => progress.completedExerciseIds.includes(e.id)).length,
    [allCor, progress.completedExerciseIds]
  );

  const passageErrorTokens = useMemo(
    () => MISS_LIEN_PASSAGE_TOKENS.filter((t) => t.isError),
    []
  );

  const hk2Drills = useMemo(
    () => PDF_PART2_SENTENCE_DRILLS.filter((d) => d.semester === 2),
    []
  );
  const hk1Drills = useMemo(
    () => PDF_PART2_SENTENCE_DRILLS.filter((d) => d.semester === 1),
    []
  );

  const activeSentenceDrill = useMemo(
    () => PDF_PART2_SENTENCE_DRILLS.find((d) => d.id === missionId) ?? null,
    [missionId]
  );

  const radarStyle = RADAR_ACCENTS[selectedModule.accent];

  const handleSwitchProofreadSemester = (sem: 2 | 1) => {
    setProofreadSemester(sem);
    if (sem === 2) {
      setMissionId('part2-u7-u8');
    } else {
      setMissionId('passage-u1');
    }
  };

  // Handlers for Miss Lien interactive passage
  const handleClickPassageToken = (token: PassageBugToken) => {
    if (token.isError) {
      if (!foundPassageIds.includes(token.id)) {
        setFoundPassageIds((prev) => [...prev, token.id]);
      }
      setActivePassageBug(token);
      setHintPassageId(null);
      setPassageFeedback(null);
    } else {
      setPassageFeedback(
        'Cụm từ vừa chạm đang đúng rồi — em hãy soi tiếp các giới từ, động từ chia thì hoặc đại từ sở hữu nhé!'
      );
    }
  };

  const handleHintPassage = () => {
    const nextUnfound = passageErrorTokens.find((t) => !foundPassageIds.includes(t.id));
    if (nextUnfound) {
      setHintPassageId(nextUnfound.id);
      setPassageFeedback(
        `Gợi ý: Hãy nhìn kỹ từ được tô vàng trong đoạn văn (${
          nextUnfound.errorTag ? CORRECTION_TAG_META[nextUnfound.errorTag].short : 'lỗi ngữ pháp'
        }) và chạm vào nó để sửa!`
      );
    }
  };

  const handleResetPassage = () => {
    setFoundPassageIds([]);
    setActivePassageBug(null);
    setHintPassageId(null);
    setPassageFeedback(null);
  };

  const handleRevealAllPassage = () => {
    setFoundPassageIds(passageErrorTokens.map((t) => t.id));
    setHintPassageId(null);
    setPassageFeedback(
      'Đã mở khóa toàn bộ 10 lỗi sai chuẩn đáp án PDF! Chạm vào bất kỳ từ màu xanh nào để xem giải thích chi tiết.'
    );
  };

  const handleClickSentenceToken = (
    itemId: string,
    tokenText: string,
    isError?: boolean
  ) => {
    if (solvedSentenceIds.includes(itemId)) return;
    if (isError) {
      setSolvedSentenceIds((prev) => [...prev, itemId]);
      setSentenceWrongTap((prev) => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });
    } else {
      setSentenceWrongTap((prev) => ({ ...prev, [itemId]: tokenText }));
    }
  };

  const handleResetSentenceDrill = (ids: string[]) => {
    setSolvedSentenceIds((prev) => prev.filter((id) => !ids.includes(id)));
    setSentenceHintIds((prev) => prev.filter((id) => !ids.includes(id)));
    setSentenceWrongTap((prev) => {
      const copy = { ...prev };
      ids.forEach((id) => delete copy[id]);
      return copy;
    });
  };

  const semestersToShow: (1 | 2)[] =
    drillsSemesterFilter === 'all' ? [2, 1] : [drillsSemesterFilter];

  return (
    <div className="space-y-7">
      {/* Hero Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">
            Phòng Thám Tử Sửa Lỗi Sai (Error Correction) · Trọn bộ đề PDF Unit 1 – 6 &amp; Unit 7 – 12
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-tight text-balance">
            Nhìn phát hiện ngay 10 bẫy lỗi sai kinh điển HK1 – HK2 và sửa chuẩn từng chữ
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Luyện mắt “ra-đa” qua <strong className="text-slate-900">4 bẫy trọng tâm HK2</strong>{' '}
            (Liên từ &amp; Wh-, Quá khứ đơn vs HTHT, Điều kiện loại 1 &amp; Unless, Modals &amp; Be able to)
            cùng <strong className="text-slate-900">6 bẫy nền tảng HK1</strong>, trực tiếp{' '}
            <strong className="text-slate-900">chạm sửa 50 câu/đoạn văn PDF Phần II</strong> và
            chinh phục kho <strong className="text-slate-900">{allCor.length} câu tìm lỗi sai</strong>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
          <div className="flex items-center gap-4 sm:gap-5 text-sm">
            <div>
              <p className="text-xs text-slate-500">Đã chinh phục</p>
              <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
                {completedCorCount}/{allCor.length}{' '}
                <span className="text-xs font-normal text-slate-500">câu</span>
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-500">Kho đề HK2 PDF</p>
              <p className="font-display text-xl font-bold text-rose-700 tabular-nums">
                {sem2Cor.length}{' '}
                <span className="text-xs font-normal text-slate-500">câu</span>
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-500">Kho đề HK1 PDF</p>
              <p className="font-display text-xl font-bold text-sky-700 tabular-nums">
                {sem1Cor.length}{' '}
                <span className="text-xs font-normal text-slate-500">câu</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Thi thử 15 câu Sửa lỗi sai Học kỳ 2 (Unit 7–12)',
                  buildCorrectionMix(2, 15)
                )
              }
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-xs whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Thi thử 15 câu HK2</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Thi thử 15 câu Sửa lỗi sai Học kỳ 1 (Unit 1–6)',
                  buildCorrectionMix(1, 15)
                )
              }
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Thi thử HK1</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3 Sub-Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        {(
          [
            { id: 'radar', label: '1. 10 Bẫy Lỗi Sai Kinh điển (HK1 & HK2)', icon: SearchCheck },
            {
              id: 'proofread',
              label: '2. Phòng Soi Lỗi Trực tiếp (PDF Phần II · HK2 & HK1)',
              icon: FileSearch,
            },
            {
              id: 'drills',
              label: `3. Kho luyện đề Sửa lỗi sai (${allCor.length} câu)`,
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
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                active
                  ? 'border-rose-600 text-rose-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: 10 VISUAL BUG-HUNTING RADAR MODULES (HK2 + HK1) */}
      {activeSubTab === 'radar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Grouped Left Rail */}
          <aside className="lg:col-span-4 space-y-5">
            {/* HK2 Group */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 px-1">
                Trọng tâm Học kỳ 2 (Unit 7 – 12) · 4 Bẫy mới
              </p>
              {hk2Modules.map((mod) => {
                const active = mod.id === selectedModule.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      active
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-white border-slate-200 hover:border-rose-400 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-mono-code text-[11px] font-bold ${
                          active ? 'text-rose-300' : 'text-rose-700'
                        }`}
                      >
                        {mod.code} · {mod.unitRange}
                      </span>
                      <ArrowRight
                        className={`w-4 h-4 shrink-0 ${active ? 'text-rose-300' : 'text-slate-400'}`}
                      />
                    </div>
                    <p className="font-display font-bold text-sm mt-1 leading-snug">
                      {mod.shortTitle}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* HK1 Group */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                Nền tảng Học kỳ 1 (Unit 1 – 6) · 6 Bẫy cốt lõi
              </p>
              {hk1Modules.map((mod) => {
                const active = mod.id === selectedModule.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedModuleId(mod.id)}
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
                        {mod.code} · {mod.unitRange}
                      </span>
                      <ArrowRight
                        className={`w-4 h-4 shrink-0 ${active ? 'text-sky-300' : 'text-slate-400'}`}
                      />
                    </div>
                    <p className="font-display font-bold text-sm mt-1 leading-snug">
                      {mod.shortTitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Stage */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <p
                  className={`font-mono-code text-xs font-bold ${
                    selectedModule.semester === 2 ? 'text-rose-700' : 'text-sky-700'
                  }`}
                >
                  {selectedModule.code} · {selectedModule.unitRange}
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-1 text-balance">
                  {selectedModule.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  onStartPractice(
                    `Sửa lỗi sai: ${selectedModule.shortTitle}`,
                    buildCorrectionMix(selectedModule.id, 10)
                  )
                }
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 shrink-0 self-start transition-colors whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Luyện ngay 10 câu</span>
              </button>
            </div>

            {/* 3-Step Detection Process */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`rounded-xl border p-4 space-y-2 ${radarStyle.step1}`}>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 tabular-nums ${radarStyle.badge}`}
                  >
                    1
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider">Kính lúp soi nhanh</p>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed font-medium">
                  {selectedModule.step1Scan}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                    2
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Đối chiếu quy tắc
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {selectedModule.step2Check}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                    3
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Sửa chuẩn 100%
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {selectedModule.step3Fix}
                </p>
              </div>
            </div>

            {/* Side-by-Side Visual Diff Examples from PDF */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Đối chiếu Lỗi Sai → Cách Sửa Đúng chuẩn PDF (chạm loa để nghe câu chuẩn)
              </p>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                {selectedModule.examples.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white hover:bg-slate-50/70 transition-colors space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-mono-code">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 line-through decoration-rose-500 font-semibold">
                          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 no-underline" />
                          <span>{item.wrong}</span>
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{item.right}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => speakEnglish(item.fullCorrectSentence, { rate: 0.9 })}
                        title="Nghe câu đã sửa đúng"
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-sky-50 hover:border-sky-400 text-slate-600 hover:text-sky-700 shrink-0 transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="font-display text-sm text-slate-900 font-medium">
                      {item.fullCorrectSentence}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.why}</p>
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
                  {selectedModule.mnemonic}
                </p>
              </div>

              <div className="rounded-xl bg-rose-50/90 border border-rose-200 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-900">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wider">Cảnh báo bẫy đề thi</p>
                </div>
                <p className="text-xs sm:text-sm text-rose-950 leading-relaxed">
                  {selectedModule.trapWarning}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE PROOFREADING LAB (PDF PART II: HK2 & HK1) */}
      {activeSubTab === 'proofread' && (
        <div className="space-y-5">
          {/* Semester Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleSwitchProofreadSemester(2)}
                className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  proofreadSemester === 2
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Học kỳ 2 (Unit 7 – 12 · 24 câu)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchProofreadSemester(1)}
                className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  proofreadSemester === 1
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Học kỳ 1 (Unit 1 – 6 · Đoạn văn + 16 câu)
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Chạm thẳng vào từ viết sai trong câu để sửa ngay và nghe phát âm chuẩn
            </p>
          </div>

          {/* Mission Switcher (3 cards per semester) */}
          {proofreadSemester === 2 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {hk2Drills.map((drill) => {
                const active = missionId === drill.id;
                const solvedCount = drill.items.filter((i) =>
                  solvedSentenceIds.includes(i.id)
                ).length;
                return (
                  <button
                    key={drill.id}
                    type="button"
                    onClick={() => setMissionId(drill.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      active
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-white border-slate-200 hover:border-rose-400 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-mono-code text-[11px] font-bold ${
                          active ? 'text-rose-300' : 'text-rose-700'
                        }`}
                      >
                        {drill.badge}
                      </span>
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          active ? 'text-emerald-300' : 'text-slate-500'
                        }`}
                      >
                        {solvedCount}/{drill.items.length} câu
                      </span>
                    </div>
                    <p className="font-display font-bold text-sm sm:text-base mt-1 leading-snug">
                      {drill.title}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMissionId('passage-u1')}
                className={`text-left p-4 rounded-xl border transition-all ${
                  missionId === 'passage-u1'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 hover:border-sky-400 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-mono-code text-[11px] font-bold ${
                      missionId === 'passage-u1' ? 'text-sky-300' : 'text-sky-700'
                    }`}
                  >
                    HK1 · UNIT 1 PHẦN II
                  </span>
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      missionId === 'passage-u1' ? 'text-emerald-300' : 'text-slate-500'
                    }`}
                  >
                    {foundPassageIds.length}/10 lỗi
                  </span>
                </div>
                <p className="font-display font-bold text-sm sm:text-base mt-1">
                  HK1 · Nhiệm vụ 1: Săn 10 lỗi đoạn văn Cô Liên
                </p>
              </button>

              {hk1Drills.map((drill) => {
                const active = missionId === drill.id;
                const solvedCount = drill.items.filter((i) =>
                  solvedSentenceIds.includes(i.id)
                ).length;
                return (
                  <button
                    key={drill.id}
                    type="button"
                    onClick={() => setMissionId(drill.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
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
                        {drill.badge}
                      </span>
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          active ? 'text-emerald-300' : 'text-slate-500'
                        }`}
                      >
                        {solvedCount}/{drill.items.length} câu
                      </span>
                    </div>
                    <p className="font-display font-bold text-sm sm:text-base mt-1 leading-snug">
                      {drill.title}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* HK1 MISSION 1: MISS LIEN INTERACTIVE 10-BUG PASSAGE */}
          {missionId === 'passage-u1' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                    Săn lỗi trực tiếp trên đoạn văn (Unit 1 · Bài II chuẩn PDF)
                  </p>
                  <h2 className="font-display text-xl font-bold text-slate-900 mt-1">
                    Chạm trực tiếp vào 10 từ viết sai trong câu chuyện của cô Liên để sửa ngay
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleHintPassage}
                    disabled={foundPassageIds.length === passageErrorTokens.length}
                    className="px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-40 whitespace-nowrap"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Soi 1 lỗi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => speakEnglish(MISS_LIEN_FULL_CORRECT, { rate: 0.88 })}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-sky-50 hover:border-sky-400 text-slate-700 hover:text-sky-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Nghe bản đúng</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRevealAllPassage}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    Mở hết đáp án
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassage}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại</span>
                  </button>
                </div>
              </div>

              {/* Progress Strip */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Tiến độ săn lỗi:{' '}
                    <strong className="text-slate-900 tabular-nums">
                      {foundPassageIds.length}/{passageErrorTokens.length} lỗi đã sửa
                    </strong>
                  </span>
                  {foundPassageIds.length === passageErrorTokens.length && (
                    <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Xuất sắc! Em đã sửa sạch cả 10 lỗi sai!
                    </span>
                  )}
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${Math.round(
                        (foundPassageIds.length / passageErrorTokens.length) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Interactive Passage Surface */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 text-base sm:text-lg leading-[2.2] text-slate-900 font-display">
                {MISS_LIEN_PASSAGE_TOKENS.map((token) => {
                  if (!token.isError) {
                    return (
                      <span
                        key={token.id}
                        onClick={() => handleClickPassageToken(token)}
                        className="cursor-pointer hover:bg-slate-200/60 rounded transition-colors"
                      >
                        {token.text}
                      </span>
                    );
                  }

                  const isFound = foundPassageIds.includes(token.id);
                  const isHinted = hintPassageId === token.id;

                  if (isFound) {
                    return (
                      <button
                        key={token.id}
                        type="button"
                        onClick={() => setActivePassageBug(token)}
                        className="inline-flex items-baseline gap-1 mx-0.5 px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-950 font-semibold text-sm sm:text-base transition-colors"
                      >
                        <span className="line-through text-rose-700 opacity-75 text-xs sm:text-sm">
                          {token.text}
                        </span>
                        <ArrowRight className="w-3 h-3 text-emerald-700 self-center" />
                        <span>{token.corrected}</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={token.id}
                      type="button"
                      onClick={() => handleClickPassageToken(token)}
                      className={`inline mx-0.5 px-1.5 py-0.5 rounded-md font-display transition-all ${
                        isHinted
                          ? 'bg-amber-200 text-amber-950 ring-2 ring-amber-500 font-bold'
                          : 'hover:bg-sky-100 hover:text-sky-900 underline decoration-dotted decoration-slate-400 underline-offset-4'
                      }`}
                    >
                      {token.text}
                    </button>
                  );
                })}
              </div>

              {/* Live Feedback / Active Bug Explanation */}
              {activePassageBug && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-900">
                    {activePassageBug.errorTag && (
                      <>
                        <span className="font-mono-code font-bold">
                          {CORRECTION_TAG_META[activePassageBug.errorTag].label}
                        </span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span className="font-mono-code font-bold text-emerald-950">
                      {activePassageBug.text} → {activePassageBug.corrected}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                    {activePassageBug.explanation}
                  </p>
                </div>
              )}

              {passageFeedback && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs sm:text-sm text-amber-950">
                  {passageFeedback}
                </div>
              )}
            </div>
          )}

          {/* INTERACTIVE WORD-CLICK SENTENCE PROOFREADING (HK2 & HK1) */}
          {activeSentenceDrill && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p
                    className={`font-mono-code text-xs font-bold ${
                      activeSentenceDrill.semester === 2 ? 'text-rose-700' : 'text-sky-700'
                    }`}
                  >
                    {activeSentenceDrill.badge} · PDF PHẦN II
                  </p>
                  <h2 className="font-display text-xl font-bold text-slate-900 mt-0.5">
                    {activeSentenceDrill.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    {activeSentenceDrill.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleResetSentenceDrill(activeSentenceDrill.items.map((i) => i.id))
                  }
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại nhiệm vụ này</span>
                </button>
              </div>

              <div className="space-y-3">
                {activeSentenceDrill.items.map((item, idx) => {
                  const isSolved = solvedSentenceIds.includes(item.id);
                  const wrongClicked = sentenceWrongTap[item.id];
                  const showItemHint = sentenceHintIds.includes(item.id);
                  const tagMeta = CORRECTION_TAG_META[item.errorTag];

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-4 space-y-3 transition-colors ${
                        isSolved
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-code font-bold text-slate-700 tabular-nums">
                            Câu {idx + 1}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.unitLabel}</span>
                          {isSolved && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Đã sửa chuẩn
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {!isSolved && (
                            <button
                              type="button"
                              onClick={() =>
                                setSentenceHintIds((prev) =>
                                  prev.includes(item.id) ? prev : [...prev, item.id]
                                )
                              }
                              className="text-amber-800 hover:text-amber-950 font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                            >
                              <Lightbulb className="w-3.5 h-3.5" />
                              <span>Gợi ý loại lỗi</span>
                            </button>
                          )}
                          {isSolved && (
                            <button
                              type="button"
                              onClick={() => speakEnglish(item.fullCorrect, { rate: 0.9 })}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-sky-50 text-slate-600 hover:text-sky-700 transition-colors"
                              title="Nghe câu chuẩn"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Clickable Word Tokens */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.tokens.map((tok, tIdx) => {
                          if (isSolved && tok.isError) {
                            return (
                              <span
                                key={tIdx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-300 font-display text-sm sm:text-base font-bold text-emerald-950"
                              >
                                <span className="line-through text-rose-700 font-normal text-xs sm:text-sm">
                                  {tok.text}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{tok.corrected}</span>
                              </span>
                            );
                          }

                          const isWrongSelected = wrongClicked === tok.text;

                          return (
                            <button
                              key={tIdx}
                              type="button"
                              disabled={isSolved}
                              onClick={() =>
                                handleClickSentenceToken(item.id, tok.text, tok.isError)
                              }
                              className={`px-2.5 py-1 rounded-lg font-display text-sm sm:text-base border transition-all ${
                                isSolved
                                  ? 'border-transparent text-slate-800 bg-transparent px-1'
                                  : isWrongSelected
                                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                                    : 'bg-white border-slate-200 hover:border-rose-500 hover:bg-rose-50/40 text-slate-900'
                              }`}
                            >
                              {tok.text}
                            </button>
                          );
                        })}
                      </div>

                      {showItemHint && !isSolved && (
                        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          Gợi ý: Câu này mắc lỗi thuộc nhóm{' '}
                          <strong className="font-mono-code">{tagMeta.label}</strong>.
                        </p>
                      )}

                      {wrongClicked && !isSolved && (
                        <p className="text-xs text-rose-800">
                          Từ <strong>“{wrongClicked}”</strong> đang viết đúng rồi — em thử chạm vào
                          từ khác nhé!
                        </p>
                      )}

                      {isSolved && (
                        <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                          <strong>Giải thích: </strong>
                          {item.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SPECIALTY DRILLS & 12-UNIT PROGRESS MATRIX */}
      {activeSubTab === 'drills' && (
        <div className="space-y-6">
          {/* 4 Specialty Decks (HK2-First + HK1) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <p className="font-mono-code text-[11px] font-bold text-rose-700">
                  TỔNG HỢP HỌC KỲ 2
                </p>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Thi thử 15 câu Sửa lỗi sai HK2
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Trộn ngẫu nhiên từ kho {sem2Cor.length} câu chuẩn PDF Unit 7 – 12, phủ đủ bẫy trọng tâm HK2.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onStartPractice(
                    'Thi thử 15 câu Sửa lỗi sai HK2 (Unit 7–12)',
                    buildCorrectionMix(2, 15)
                  )
                }
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Bắt đầu ngay</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <p className="font-mono-code text-[11px] font-bold text-emerald-700">
                  CHUYÊN ĐỀ UNIT 7 – 9
                </p>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Liên từ, Wh- &amp; QKĐ / HTHT
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  12 câu trị dứt điểm bẫy Although/but, because of, Did + V0, wasn't eat và have + V3.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onStartPractice(
                    'Chuyên đề Sửa lỗi HK2: Liên từ & Quá khứ / HTHT',
                    buildCorrectionMix(['conjunction_wh', 'past_perfect_trap'], 12)
                  )
                }
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Luyện 12 câu</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <p className="font-mono-code text-[11px] font-bold text-indigo-700">
                  CHUYÊN ĐỀ UNIT 10 – 12
                </p>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Điều kiện loại 1 &amp; Be able to
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  12 câu săn lỗi If + will, Unless phủ định kép, will/might + V0 và can't be able to.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onStartPractice(
                    'Chuyên đề Sửa lỗi HK2: Điều kiện loại 1 & Modals',
                    buildCorrectionMix(['conditional_trap', 'modal_ability_trap'], 12)
                  )
                }
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Luyện 12 câu</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <p className="font-mono-code text-[11px] font-bold text-sky-700">
                  TỔNG HỢP HỌC KỲ 1
                </p>
                <h3 className="font-display font-bold text-base text-slate-900">
                  Thi thử 15 câu Sửa lỗi sai HK1
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Trộn ngẫu nhiên từ kho {sem1Cor.length} câu chuẩn PDF Unit 1 – 6 (Chủ–Vị, Giới từ, So sánh).
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onStartPractice(
                    'Thi thử 15 câu Sửa lỗi sai HK1 (Unit 1–6)',
                    buildCorrectionMix(1, 15)
                  )
                }
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Luyện 15 câu HK1</span>
              </button>
            </div>
          </div>

          {/* Segmented Semester Filter for 12-Unit Matrix */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <h3 className="font-display font-bold text-base text-slate-900">
              Luyện sửa lỗi sai theo từng Unit (12 Unit · Chuẩn PDF 15 câu/Unit)
            </h3>

            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
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
                  onClick={() => setDrillsSemesterFilter(opt.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    drillsSemesterFilter === opt.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 12-Unit Progress Matrix */}
          {semestersToShow.map((sem) => {
            const semUnits = ALL_UNITS.filter((u) => u.semester === sem);
            return (
              <div key={sem} className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {sem === 2
                    ? 'Học kỳ 2 (Unit 7 – Unit 12) · Kho đề chuẩn PDF (15 câu/Unit)'
                    : 'Học kỳ 1 (Unit 1 – Unit 6) · Kho đề chuẩn PDF (15 câu/Unit)'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {semUnits.map((unit) => {
                    const unitCors = getCorrectionByUnit(unit.id);
                    const done = unitCors.filter((e) =>
                      progress.completedExerciseIds.includes(e.id)
                    ).length;
                    const pct = unitCors.length > 0 ? Math.round((done / unitCors.length) * 100) : 0;
                    const allDone = unitCors.length > 0 && done === unitCors.length;

                    return (
                      <div
                        key={unit.id}
                        className="bg-white border border-slate-200 hover:border-rose-400 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`font-mono-code text-xs font-bold ${
                                sem === 2 ? 'text-rose-700' : 'text-sky-700'
                              }`}
                            >
                              UNIT {unit.id}
                            </span>
                            {allDone ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Hoàn thành
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-slate-500 tabular-nums">
                                {done}/{unitCors.length} câu
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
                                allDone
                                  ? 'bg-emerald-500'
                                  : sem === 2
                                    ? 'bg-rose-600'
                                    : 'bg-sky-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          <button
                            type="button"
                            disabled={unitCors.length === 0}
                            onClick={() =>
                              onStartPractice(
                                `Sửa lỗi sai · Unit ${unit.id}: ${unit.titleEn}`,
                                unitCors
                              )
                            }
                            className="w-full py-2 rounded-xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/60 text-slate-800 hover:text-rose-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 whitespace-nowrap"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Luyện {unitCors.length} câu Unit {unit.id}</span>
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
