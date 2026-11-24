import React, { useState } from 'react';
import { Clock, Headphones, Link2, PenLine, Play, Shuffle, Trophy } from 'lucide-react';
import { ALL_UNITS, buildIoePracticeSet } from '../data/curriculum';
import { Exercise } from '../types';

interface IoeArenaProps {
  onStartSession: (title: string, exercises: Exercise[], timedSeconds?: number) => void;
}

export const IoeArena: React.FC<IoeArenaProps> = ({ onStartSession }) => {
  const [scope, setScope] = useState<'all' | 'sem1' | 'sem2' | number>('all');
  const [questionCount, setQuestionCount] = useState<number>(8);
  const [timedMode, setTimedMode] = useState<boolean>(false);

  const handleLaunch = () => {
    const items = buildIoePracticeSet(scope, questionCount);
    const scopeLabel =
      scope === 'all'
        ? 'Toàn bộ Lớp 6'
        : scope === 'sem1'
          ? 'Học kỳ 1 (Unit 1–6)'
          : scope === 'sem2'
            ? 'Học kỳ 2 (Unit 7–12)'
            : `Unit ${scope}`;
    const seconds = timedMode ? questionCount * 45 : undefined;
    onStartSession(`Đấu trường IOE · ${scopeLabel}`, items, seconds);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-start gap-4">
          <span className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </span>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              Luyện thi IOE &amp; Trạng Nguyên Tiếng Anh Lớp 6
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              Đấu trường tổng hợp 4 dạng bài chuẩn thi IOE
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              Hệ thống tự động chọn và phân bổ đều 4 kỹ năng trọng tâm từ bộ 12 Unit lớp 6, kèm giọng đọc Tiếng Anh và giải thích chi tiết từng câu.
            </p>
          </div>
        </div>

        {/* 4 Format Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 border-t border-slate-100">
          {[
            {
              icon: PenLine,
              title: '1. Điền từ & Chia động từ',
              desc: 'Từ loại, giới từ và chia thì chuẩn xác',
            },
            {
              icon: Shuffle,
              title: '2. Sắp xếp câu',
              desc: 'Chạm ghép các mảnh từ bị xáo trộn',
            },
            {
              icon: Headphones,
              title: '3. Nghe hiểu A–D',
              desc: 'Nghe phát âm chuẩn 1.0x hoặc chậm 0.75x',
            },
            {
              icon: Link2,
              title: '4. Ghép 4 cặp từ',
              desc: 'Nối nhanh từ Tiếng Anh với nghĩa Tiếng Việt',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1.5"
              >
                <Icon className="w-5 h-5 text-sky-700" />
                <p className="font-display font-bold text-sm text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-600">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Step 1: Scope */}
        <div className="space-y-3">
          <label className="block font-display font-bold text-base text-slate-900">
            Bước 1. Chọn phạm vi kiến thức
          </label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: 'all', label: 'Toàn bộ 12 Unit' },
                { value: 'sem1', label: 'Học kỳ 1 (Unit 1–6)' },
                { value: 'sem2', label: 'Học kỳ 2 (Unit 7–12)' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setScope(opt.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  scope === opt.value
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-sky-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="pt-1">
            <p className="text-xs text-slate-500 mb-2">Hoặc chọn ôn riêng 1 Unit cụ thể:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {ALL_UNITS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setScope(u.id)}
                  className={`px-3 py-2 rounded-xl border text-left transition-colors ${
                    scope === u.id
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-sky-400'
                  }`}
                >
                  <span className="font-mono-code text-xs font-bold block">{u.code}</span>
                  <span className="text-[11px] opacity-90 truncate block">{u.titleVi}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2 & 3: Count & Timer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-2.5">
            <label className="block font-display font-bold text-base text-slate-900">
              Bước 2. Chọn số lượng câu hỏi
            </label>
            <div className="flex items-center gap-2.5">
              {[8, 12, 16].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-mono-code text-sm font-bold transition-colors ${
                    questionCount === cnt
                      ? 'bg-sky-50 border-sky-600 text-sky-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {cnt} câu
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block font-display font-bold text-base text-slate-900">
              Bước 3. Chế độ làm bài
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTimedMode(false)}
                className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
                  !timedMode
                    ? 'bg-sky-50 border-sky-600 text-sky-900'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                Tự luyện thoải mái
              </button>
              <button
                type="button"
                onClick={() => setTimedMode(true)}
                className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  timedMode
                    ? 'bg-amber-50 border-amber-500 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Thi bấm giờ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Start CTA */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            {timedMode
              ? `Thời gian dự kiến: ${Math.round((questionCount * 45) / 60)} phút cho ${questionCount} câu hỏi.`
              : `Không giới hạn thời gian — tập trung hiểu sâu từng câu hỏi.`}
          </p>
          <button
            type="button"
            onClick={handleLaunch}
            className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Bắt đầu bài thi IOE ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
