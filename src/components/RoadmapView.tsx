import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Search, Sparkles, Trophy } from 'lucide-react';
import { ALL_UNITS } from '../data/curriculum';
import { StudentProgress, UnitData } from '../types';
import { UnitArtwork } from './UnitArtwork';

interface RoadmapViewProps {
  progress: StudentProgress;
  onSelectUnit: (unitId: number) => void;
  onStartIoe: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  progress,
  onSelectUnit,
  onStartIoe,
}) => {
  const [semesterFilter, setSemesterFilter] = useState<'all' | 1 | 2>('all');
  const [query, setQuery] = useState('');

  const totalExercises = useMemo(
    () => ALL_UNITS.reduce((acc, u) => acc + u.exercises.length, 0),
    []
  );
  const totalVocab = useMemo(
    () => ALL_UNITS.reduce((acc, u) => acc + u.vocabulary.length, 0),
    []
  );

  const activeUnit = useMemo(
    () => ALL_UNITS.find((u) => u.id === progress.lastActiveUnitId) ?? ALL_UNITS[0],
    [progress.lastActiveUnitId]
  );

  const filteredUnits = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_UNITS.filter((unit) => {
      if (semesterFilter !== 'all' && unit.semester !== semesterFilter) return false;
      if (!q) return true;
      return (
        unit.code.toLowerCase().includes(q) ||
        unit.titleEn.toLowerCase().includes(q) ||
        unit.titleVi.toLowerCase().includes(q) ||
        unit.grammarFocus.toLowerCase().includes(q) ||
        unit.vocabulary.some(
          (v) => v.word.toLowerCase().includes(q) || v.meaning.toLowerCase().includes(q)
        )
      );
    });
  }, [semesterFilter, query]);

  const getUnitStats = (unit: UnitData) => {
    const doneExercises = unit.exercises.filter((e) =>
      progress.completedExerciseIds.includes(e.id)
    ).length;
    const learnedWords = unit.vocabulary.filter((v) =>
      progress.learnedVocabIds.includes(v.id)
    ).length;
    const totalPoints = unit.exercises.length + unit.vocabulary.length;
    const donePoints = doneExercises + learnedWords;
    const pct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;
    return { doneExercises, learnedWords, pct };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      {/* Hero Banner & Quick Resume */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              Chương trình Tiếng Anh Lớp 6 · Học kỳ 1 &amp; Học kỳ 2
            </p>
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-slate-900 leading-tight">
              Học Tiếng Anh Lớp 6 trực quan, dễ hiểu và nhớ lâu
            </h1>
            <p className="text-slate-600 text-base leading-relaxed max-w-2xl">
              Mỗi bài học gói gọn trong 3 bước rõ ràng: <strong>Flashcard có phát âm</strong>,{' '}
              <strong>Sơ đồ ngữ pháp &amp; ngữ âm trực quan</strong>, và{' '}
              <strong>8 dạng bài tập chuẩn đề kiểm tra</strong> kèm giải thích Tiếng Việt chi tiết.
            </p>
          </div>

          {/* Clean Tabular Progress Strip (No Pills) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500 font-medium">Từ vựng đã thuộc</p>
              <p className="mt-1 font-mono-code text-xl font-bold text-slate-900 tabular-nums">
                {progress.learnedVocabIds.length}
                <span className="text-sm font-normal text-slate-400">/{totalVocab}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Bài tập hoàn thành</p>
              <p className="mt-1 font-mono-code text-xl font-bold text-slate-900 tabular-nums">
                {progress.completedExerciseIds.length}
                <span className="text-sm font-normal text-slate-400">/{totalExercises}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Điểm tích lũy</p>
              <p className="mt-1 font-mono-code text-xl font-bold text-sky-700 tabular-nums">
                {progress.xp} XP
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Chuỗi đúng tốt nhất</p>
              <p className="mt-1 font-mono-code text-xl font-bold text-emerald-700 tabular-nums">
                {progress.bestStreak} câu
              </p>
            </div>
          </div>
        </div>

        {/* Right Card: Resume Active Unit + IOE Shortcut */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex-1 bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between gap-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-sky-300">Tiếp tục bài đang học</p>
                <h2 className="mt-1 font-display text-xl font-bold">
                  {activeUnit.code}: {activeUnit.titleEn}
                </h2>
                <p className="text-sm text-slate-300 mt-0.5">{activeUnit.titleVi}</p>
              </div>
              <UnitArtwork unitId={activeUnit.id} className="w-12 h-12 shrink-0" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Tiến độ Unit này</span>
                <span className="font-mono-code font-semibold tabular-nums">
                  {getUnitStats(activeUnit).pct}%
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all duration-300"
                  style={{ width: `${getUnitStats(activeUnit).pct}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectUnit(activeUnit.id)}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>Vào học {activeUnit.code}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onStartIoe}
            className="bg-white hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 rounded-2xl p-4 text-left flex items-center justify-between gap-3 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="font-display font-semibold text-sm text-slate-900">
                  Đấu trường luyện thi IOE
                </p>
                <p className="text-xs text-slate-500 truncate">
                  Trộn 4 dạng: Điền từ · Sắp xếp · Nghe · Ghép cặp
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0 transition-colors" />
          </button>
        </div>
      </section>

      {/* Filter Bar & 12-Unit Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 border-b border-slate-200 sm:border-b-0">
            {(
              [
                { id: 'all', label: 'Tất cả 12 Unit' },
                { id: 1, label: 'Học kỳ 1 · Unit 1–6' },
                { id: 2, label: 'Học kỳ 2 · Unit 7–12' },
              ] as const
            ).map((tab) => {
              const active = semesterFilter === tab.id;
              return (
                <button
                  key={String(tab.id)}
                  type="button"
                  onClick={() => setSemesterFilter(tab.id)}
                  className={`px-3.5 py-2 text-sm font-semibold whitespace-nowrap rounded-lg transition-colors ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm Unit, ngữ pháp, từ vựng..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
        </div>

        {filteredUnits.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
            <p className="font-display font-semibold text-slate-800">
              Không tìm thấy bài học phù hợp với &ldquo;{query}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSemesterFilter('all');
              }}
              className="text-sm font-semibold text-sky-600 hover:text-sky-700"
            >
              Xem lại toàn bộ 12 Unit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUnits.map((unit) => {
              const stats = getUnitStats(unit);
              const isMastered = stats.pct === 100;
              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => onSelectUnit(unit.id)}
                  className="group text-left bg-white border border-slate-200 hover:border-sky-400 hover:shadow-sm rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <UnitArtwork unitId={unit.id} className="w-14 h-14 shrink-0" />
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-500">
                          Học kỳ {unit.semester} · {unit.code}
                        </span>
                        {isMastered && (
                          <div className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Hoàn thành</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                        {unit.titleEn}
                      </h3>
                      <p className="text-sm font-medium text-slate-600">{unit.titleVi}</p>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {unit.grammarFocus}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {unit.vocabulary.length} từ vựng · {unit.exercises.length} bài tập
                      </span>
                      <span className="font-mono-code font-semibold text-slate-700 tabular-nums">
                        {stats.pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isMastered ? 'bg-emerald-500' : 'bg-sky-600'
                        }`}
                        style={{ width: `${stats.pct}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Study Method Tip Footer */}
      <section className="bg-sky-50/70 border border-sky-100 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span className="w-10 h-10 rounded-xl bg-white border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-display font-semibold text-slate-900 text-base">
              Mẹo học Tiếng Anh Lớp 6 đạt điểm 9–10 mỗi ngày
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Bấm nút loa ở mỗi thẻ từ vựng và bài nghe để đọc theo giọng bản xứ, sau đó mở{' '}
              <strong>Sổ tay câu sai</strong> ôn lại những câu chưa đúng cho tới khi sạch lỗi.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
