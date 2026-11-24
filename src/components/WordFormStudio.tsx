import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Lightbulb,
  Play,
  Puzzle,
  Search,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  ALL_UNITS,
  buildWordFormMix,
  getAllWordFormExercises,
  getWordFormByUnit,
} from '../data/curriculum';
import {
  WF_POSITION_RULES,
  WORD_FAMILIES,
  WordFamilyMember,
} from '../data/wordFormBank';
import { Exercise, StudentProgress, WordFormTargetPos } from '../types';
import { speakEnglish } from '../utils/speech';

interface WordFormStudioProps {
  progress: StudentProgress;
  onStartPractice: (title: string, exercises: Exercise[]) => void;
}

const ACCENT_STYLES = {
  sky: {
    slotBox: 'bg-sky-600 text-white border-sky-600',
    suffixCard: 'bg-sky-50/70 border-sky-200',
    suffixTitle: 'text-sky-800',
  },
  emerald: {
    slotBox: 'bg-emerald-600 text-white border-emerald-600',
    suffixCard: 'bg-emerald-50/70 border-emerald-200',
    suffixTitle: 'text-emerald-800',
  },
  amber: {
    slotBox: 'bg-amber-500 text-white border-amber-500',
    suffixCard: 'bg-amber-50/70 border-amber-200',
    suffixTitle: 'text-amber-900',
  },
  rose: {
    slotBox: 'bg-rose-600 text-white border-rose-600',
    suffixCard: 'bg-rose-50/70 border-rose-200',
    suffixTitle: 'text-rose-800',
  },
};

const MEMBER_POS_STYLES: Record<WordFamilyMember['pos'], string> = {
  V: 'bg-rose-50 text-rose-800 border-rose-200',
  'N (người)': 'bg-indigo-50 text-indigo-800 border-indigo-200',
  'N (vật/ý)': 'bg-sky-50 text-sky-800 border-sky-200',
  Adj: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Adv: 'bg-amber-50 text-amber-900 border-amber-200',
};

function renderHighlightedWord(sentence: string, answer: string) {
  const idx = sentence.toLowerCase().indexOf(answer.toLowerCase());
  if (idx < 0) return <span>{sentence}</span>;
  return (
    <span>
      {sentence.slice(0, idx)}
      <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-900 font-bold">
        {sentence.slice(idx, idx + answer.length)}
      </span>
      {sentence.slice(idx + answer.length)}
    </span>
  );
}

export const WordFormStudio: React.FC<WordFormStudioProps> = ({ progress, onStartPractice }) => {
  const [activeSubTab, setActiveSubTab] = useState<'positions' | 'families' | 'drills'>(
    'positions'
  );
  const [selectedRuleId, setSelectedRuleId] = useState<WordFormTargetPos>('noun');
  const [familyGroup, setFamilyGroup] = useState<
    'all' | '7-8' | '9-10' | '11-12' | '1-2' | '3-4' | '5-6'
  >('all');
  const [familySearch, setFamilySearch] = useState('');
  const [drillSemester, setDrillSemester] = useState<'all' | 2 | 1>('all');

  const selectedRule = useMemo(
    () => WF_POSITION_RULES.find((r) => r.id === selectedRuleId) ?? WF_POSITION_RULES[0],
    [selectedRuleId]
  );

  const allWf = useMemo(() => getAllWordFormExercises(), []);
  const sem1Wf = useMemo(() => getAllWordFormExercises(1), []);
  const sem2Wf = useMemo(() => getAllWordFormExercises(2), []);
  const completedWfCount = useMemo(
    () => allWf.filter((e) => progress.completedExerciseIds.includes(e.id)).length,
    [allWf, progress.completedExerciseIds]
  );

  const filteredUnits = useMemo(() => {
    if (drillSemester === 'all') return ALL_UNITS;
    return ALL_UNITS.filter((u) => u.semester === drillSemester);
  }, [drillSemester]);

  const filteredFamilies = useMemo(() => {
    const q = familySearch.trim().toLowerCase();
    return WORD_FAMILIES.filter((fam) => {
      if (familyGroup !== 'all' && fam.unitGroup !== familyGroup) return false;
      if (!q) return true;
      return (
        fam.root.toLowerCase().includes(q) ||
        fam.members.some(
          (m) => m.word.toLowerCase().includes(q) || m.meaning.toLowerCase().includes(q)
        )
      );
    });
  }, [familyGroup, familySearch]);

  const ruleStyle = ACCENT_STYLES[selectedRule.accent];

  return (
    <div className="space-y-7">
      {/* Hero Banner */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
            Phòng Từ Loại Trực Quan (Word Forms) · Chuẩn bộ đề PDF Học kỳ 1 (Unit 1–6) &amp; Học kỳ 2 (Unit 7–12)
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
            Nhìn từ đứng trước – sau chỗ trống, lắp ghép đúng Từ loại ngay lần đầu
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Nắm chắc 4 sơ đồ vị trí (Danh từ · Tính từ · Trạng từ · Biến đổi đặc biệt HK1–HK2), tra cứu{' '}
            <strong className="text-slate-900">{WORD_FAMILIES.length} Gia đình Từ cốt lõi</strong> có phát âm và thực hành
            trọn kho <strong className="text-slate-900">{allWf.length} câu Word Form chuẩn PDF</strong> kèm công thức biến hình từ.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
          <div className="flex items-center gap-5 text-sm">
            <div>
              <p className="text-xs text-slate-500">Đã chinh phục</p>
              <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
                {completedWfCount}/{allWf.length}{' '}
                <span className="text-xs font-normal text-slate-500">câu</span>
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-500">Kho đề HK2 PDF</p>
              <p className="font-display text-xl font-bold text-sky-700 tabular-nums">
                {sem2Wf.length}{' '}
                <span className="text-xs font-normal text-slate-500">câu</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Thi thử 15 câu Từ loại Học kỳ 2 (Unit 7–12)',
                  buildWordFormMix(2, 15)
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
                  'Thi thử 15 câu Từ loại Học kỳ 1 (Unit 1–6)',
                  buildWordFormMix(1, 15)
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
            { id: 'positions', label: '1. 4 Vị trí Vàng & Đuôi từ Lego', icon: Puzzle },
            {
              id: 'families',
              label: `2. Bảng ${WORD_FAMILIES.length} Gia đình Từ HK1–HK2`,
              icon: GitBranch,
            },
            {
              id: 'drills',
              label: `3. Kho luyện đề Word Form (${allWf.length} câu)`,
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

      {/* TAB 1: 4 POSITION RULES & SUFFIX LEGO */}
      {activeSubTab === 'positions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Rail */}
          <aside className="lg:col-span-4 space-y-2">
            {WF_POSITION_RULES.map((rule) => {
              const active = rule.id === selectedRule.id;
              return (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => setSelectedRuleId(rule.id)}
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
                      {rule.badge}
                    </span>
                    <ArrowRight
                      className={`w-4 h-4 shrink-0 ${active ? 'text-sky-300' : 'text-slate-400'}`}
                    />
                  </div>
                  <p className="font-display font-bold text-sm sm:text-base mt-1 leading-snug">
                    {rule.shortTitle}
                  </p>
                </button>
              );
            })}
          </aside>

          {/* Right Interactive Stage */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <p className="font-mono-code text-xs font-bold text-sky-700">
                  {selectedRule.badge}
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {selectedRule.title}
                </h2>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {selectedRule.headline}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onStartPractice(
                    `Chuyên đề Word Form · ${selectedRule.shortTitle}`,
                    buildWordFormMix(
                      selectedRule.id === 'plural' ? ['plural', 'verb'] : selectedRule.id,
                      10
                    )
                  )
                }
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 self-start transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Luyện ngay 10 câu</span>
              </button>
            </div>

            {/* Visual Slot Assembly Blocks */}
            <div className="space-y-3">
              <h3 className="font-display font-bold text-sm sm:text-base text-slate-900">
                Sơ đồ lắp ghép vị trí trong câu (Bấm loa nghe câu mẫu chuẩn PDF)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {selectedRule.slots.map((slot) => (
                  <button
                    key={slot.example}
                    type="button"
                    onClick={() => speakEnglish(slot.example, { rate: 0.9 })}
                    className="text-left bg-slate-50 hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 rounded-xl p-4 space-y-3 transition-colors group"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-mono-code text-xs font-semibold text-slate-700">
                        {slot.before}
                      </span>
                      <span className="text-slate-400 font-bold text-xs">+</span>
                      <span
                        className={`px-2.5 py-1 rounded-lg border font-mono-code text-xs font-bold ${ruleStyle.slotBox}`}
                      >
                        {slot.slotLabel}
                      </span>
                      {slot.after && (
                        <>
                          <span className="text-slate-400 font-bold text-xs">+</span>
                          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-mono-code text-xs font-semibold text-slate-700">
                            {slot.after}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-slate-900 leading-snug">
                          {renderHighlightedWord(slot.example, slot.exampleAnswer)}
                        </p>
                        <p className="text-xs text-slate-600">{slot.meaning}</p>
                      </div>
                      <Volume2 className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Suffix Lego Grid */}
            <div className="space-y-3">
              <h3 className="font-display font-bold text-sm sm:text-base text-slate-900">
                Các mảnh ghép Hậu tố / Biến hình quen thuộc
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedRule.suffixes.map((chip) => (
                  <div
                    key={chip.suffix}
                    className={`border rounded-xl p-3.5 space-y-1 ${ruleStyle.suffixCard}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`font-mono-code text-sm font-bold ${ruleStyle.suffixTitle}`}>
                        {chip.suffix}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">{chip.role}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{chip.samples}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mnemonic & Trap Warning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                  <strong className="font-semibold block mb-0.5">Mẹo nhớ nhanh:</strong>
                  {selectedRule.mnemonic}
                </div>
              </div>

              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-rose-950 leading-relaxed">
                  <strong className="font-semibold block mb-0.5">Bẫy hay mất điểm:</strong>
                  {selectedRule.trapWarning}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 30 CORE WORD FAMILIES */}
      {activeSubTab === 'families' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: `Tất cả ${WORD_FAMILIES.length} gốc từ` },
                  { id: '7-8', label: 'HK2 · Unit 7–8' },
                  { id: '9-10', label: 'HK2 · Unit 9–10' },
                  { id: '11-12', label: 'HK2 · Unit 11–12' },
                  { id: '1-2', label: 'Unit 1–2' },
                  { id: '3-4', label: 'Unit 3–4' },
                  { id: '5-6', label: 'Unit 5–6' },
                ] as const
              ).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setFamilyGroup(g.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    familyGroup === g.id
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-sky-400'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={familySearch}
                onChange={(e) => setFamilySearch(e.target.value)}
                placeholder="Tìm gốc từ (USE, ABILITY, ENTER...)"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFamilies.map((fam) => (
              <div
                key={fam.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <h3 className="font-mono-code text-base font-bold text-slate-900">
                      {fam.root}
                    </h3>
                    <span className="text-xs font-semibold text-sky-700">{fam.unitLabel}</span>
                  </div>

                  <div className="space-y-2">
                    {fam.members.map((member) => {
                      const firstSpeakWord = member.word.split(/[/(]/)[0].trim();
                      return (
                        <button
                          key={`${fam.id}-${member.word}`}
                          type="button"
                          onClick={() => speakEnglish(firstSpeakWord, { rate: 0.85 })}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-sky-50/70 border border-slate-200/80 hover:border-sky-300 flex items-center justify-between gap-2 transition-colors group"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-1.5 py-0.5 rounded border font-mono-code text-[10px] font-bold ${
                                  MEMBER_POS_STYLES[member.pos]
                                }`}
                              >
                                {member.pos}
                              </span>
                              <span className="font-display font-bold text-sm text-slate-900">
                                {member.word}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">{member.meaning}</p>
                          </div>
                          <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: UNIT-BY-UNIT PDF WORD FORM DRILL BANK */}
      {activeSubTab === 'drills' && (
        <div className="space-y-6">
          {/* 4 Specialty Mix Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Thi thử 15 câu Từ loại Học kỳ 2 (Unit 7–12)',
                  buildWordFormMix(2, 15)
                )
              }
              className="text-left p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white space-y-2 transition-colors"
            >
              <p className="text-xs font-semibold text-sky-300">Đề tổng hợp HK2 · Mới</p>
              <h3 className="font-display font-bold text-base">15 câu Word Form HK2</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Trộn đều từ kho {sem2Wf.length} câu chuẩn đề PDF Unit 7–12.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Thi thử 15 câu Từ loại Học kỳ 1 (Unit 1–6)',
                  buildWordFormMix(1, 15)
                )
              }
              className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 space-y-2 transition-colors"
            >
              <p className="text-xs font-semibold text-sky-700">Đề tổng hợp HK1</p>
              <h3 className="font-display font-bold text-base text-slate-900">
                15 câu Word Form HK1
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ôn chắc kho {sem1Wf.length} câu chuẩn đề PDF Unit 1–6.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Chuyên đề Word Form · Danh từ (N) & Tính từ (Adj)',
                  buildWordFormMix(['noun', 'adj'], 12)
                )
              }
              className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 space-y-2 transition-colors"
            >
              <p className="text-xs font-semibold text-emerald-700">Chuyên đề Danh · Tính từ</p>
              <h3 className="font-display font-bold text-base text-slate-900">
                12 câu Danh từ &amp; Tính từ
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Luyện -tion/-ance/-ure/-dom, -ful/-less, -ing/-ed và tiền tố un-/dis-.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Chuyên đề Trạng từ (-ly), Động từ & Số nhiều',
                  buildWordFormMix(['adv', 'verb', 'plural'], 12)
                )
              }
              className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 space-y-2 transition-colors"
            >
              <p className="text-xs font-semibold text-amber-800">Chuyên đề Nâng cao</p>
              <h3 className="font-display font-bold text-base text-slate-900">
                12 câu Trạng từ &amp; Đặc biệt
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Trạng từ -ly/-ically, số nhiều -ies/-s, đổi ngược V/Adj (able, recognise).
              </p>
            </button>
          </div>

          {/* 12 Units Grid with Semester Filter */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Luyện đề Từ loại chi tiết theo từng Unit (Unit 1 – Unit 12)
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUnits.map((unit) => {
                const items = getWordFormByUnit(unit.id);
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
                      onStartPractice(`${unit.code}: ${unit.titleEn} · Từ loại (Word Form)`, items)
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
                        <span>Luyện {items.length} câu Từ loại</span>
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
