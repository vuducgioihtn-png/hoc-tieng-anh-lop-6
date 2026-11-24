import React, { useMemo, useState } from 'react';
import { ArrowRight, Search, Volume2 } from 'lucide-react';
import { ALL_UNITS } from '../data/curriculum';
import { speakEnglish } from '../utils/speech';

interface GrammarAtlasProps {
  onOpenUnit: (unitId: number) => void;
}

export const GrammarAtlas: React.FC<GrammarAtlasProps> = ({ onOpenUnit }) => {
  const [semester, setSemester] = useState<'all' | 1 | 2>('all');
  const [search, setSearch] = useState('');

  const units = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_UNITS.filter((u) => {
      if (semester !== 'all' && u.semester !== semester) return false;
      if (!q) return true;
      return (
        u.titleEn.toLowerCase().includes(q) ||
        u.titleVi.toLowerCase().includes(q) ||
        u.grammarFocus.toLowerCase().includes(q) ||
        u.phonetics.title.toLowerCase().includes(q) ||
        u.grammar.some(
          (g) =>
            g.title.toLowerCase().includes(q) ||
            g.summary.toLowerCase().includes(q) ||
            g.memoryTip.toLowerCase().includes(q)
        )
      );
    });
  }, [semester, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
            Cẩm nang tra cứu nhanh · Toàn bộ Lớp 6
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Bản đồ Ngữ pháp &amp; Phát âm 12 Unit
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Tra cứu nhanh công thức thì, mẹo nhớ và bấm nghe ví dụ phát âm trước mỗi kỳ kiểm tra 15 phút, giữa kỳ và cuối kỳ.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(
              [
                { id: 'all', label: 'Cả năm' },
                { id: 1, label: 'Học kỳ 1' },
                { id: 2, label: 'Học kỳ 2' },
              ] as const
            ).map((t) => (
              <button
                key={String(t.id)}
                type="button"
                onClick={() => setSemester(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  semester === t.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm thì, so sánh, đuôi -s..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {units.map((unit) => (
          <article
            key={unit.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-sky-700">
                  Học kỳ {unit.semester} · {unit.code} · {unit.phoneticFocus}
                </p>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  {unit.titleEn} — <span className="text-slate-500 font-medium">{unit.titleVi}</span>
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onOpenUnit(unit.id)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:text-sky-800 whitespace-nowrap self-start sm:self-center"
              >
                <span>Luyện bài tập {unit.code}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Grammar Summaries */}
              <div className="lg:col-span-7 space-y-3.5">
                {unit.grammar.map((g) => (
                  <div
                    key={g.id}
                    className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5"
                  >
                    <h3 className="font-display font-bold text-base text-slate-900">{g.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600">{g.summary}</p>
                    <div className="space-y-1.5 pt-1">
                      {g.forms.map((f) => (
                        <div
                          key={f.label}
                          className="text-xs sm:text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-start justify-between gap-2"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{f.label}: </span>
                            <span className="font-mono-code text-sky-800">
                              {f.formula.map((t) => t.text).join(' + ')}
                            </span>
                            <p className="text-xs text-slate-500 mt-0.5">{f.example}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => speakEnglish(f.example, { rate: 0.92 })}
                            title="Nghe ví dụ"
                            className="p-1.5 rounded-md text-slate-400 hover:text-sky-700 hover:bg-sky-50 shrink-0"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-2">
                      <strong>Mẹo nhớ:</strong> {g.memoryTip}
                    </p>
                  </div>
                ))}
              </div>

              {/* Phonetics Summary */}
              <div className="lg:col-span-5 bg-sky-50/50 border border-sky-100 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-800">
                  Ngữ âm &amp; Trọng âm
                </p>
                <h3 className="font-display font-bold text-base text-slate-900">
                  {unit.phonetics.title}
                </h3>
                <div className="space-y-3">
                  {unit.phonetics.groups.map((grp) => (
                    <div key={grp.symbol} className="space-y-1.5">
                      <p className="text-xs font-semibold text-slate-800">
                        <span className="font-mono-code text-sky-700 text-sm mr-1.5">
                          {grp.symbol}
                        </span>
                        {grp.vietnameseCue}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {grp.examples.map((ex) => (
                          <button
                            key={ex.word}
                            type="button"
                            onClick={() => speakEnglish(ex.word, { rate: 0.85 })}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-sky-400 text-xs font-semibold text-slate-800 inline-flex items-center gap-1 transition-colors"
                          >
                            <span>{ex.word}</span>
                            <Volume2 className="w-3 h-3 text-sky-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
