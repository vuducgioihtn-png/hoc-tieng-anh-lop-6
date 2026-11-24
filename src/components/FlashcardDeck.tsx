import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Shuffle,
  Turtle,
  Volume2,
} from 'lucide-react';
import { VocabItem } from '../types';
import { playFeedbackSound, speakEnglish } from '../utils/speech';

interface FlashcardDeckProps {
  vocabulary: VocabItem[];
  learnedVocabIds: string[];
  soundEnabled: boolean;
  onToggleLearned: (vocabId: string) => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  vocabulary,
  learnedVocabIds,
  soundEnabled,
  onToggleLearned,
}) => {
  const [mode, setMode] = useState<'cards' | 'list' | 'quick_match'>('cards');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Quick Match game state
  const [matchRoundSeed, setMatchRoundSeed] = useState(0);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongPair, setWrongPair] = useState<{ left: string; right: string } | null>(null);

  const safeIndex = Math.min(currentIndex, Math.max(0, vocabulary.length - 1));
  const currentCard = vocabulary[safeIndex];
  const isLearned = currentCard ? learnedVocabIds.includes(currentCard.id) : false;

  const learnedCount = vocabulary.filter((v) => learnedVocabIds.includes(v.id)).length;

  const matchSet = useMemo(() => {
    const items = [...vocabulary];
    // Deterministic-ish shuffle seeded by matchRoundSeed
    for (let i = items.length - 1; i > 0; i--) {
      const j = (i * 7 + matchRoundSeed * 3 + 1) % (i + 1);
      [items[i], items[j]] = [items[j], items[i]];
    }
    const chosen = items.slice(0, Math.min(4, items.length));
    const rightOrder = [...chosen].sort((a, b) =>
      ((a.word.charCodeAt(0) + matchRoundSeed) % 11) - ((b.word.charCodeAt(0) + matchRoundSeed) % 11)
    );
    return { left: chosen, right: rightOrder };
  }, [vocabulary, matchRoundSeed]);

  const handleNext = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % vocabulary.length);
  };

  const handlePrev = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + vocabulary.length) % vocabulary.length);
  };

  const handleMatchRightClick = (rightId: string) => {
    if (!selectedLeft || matchedIds.includes(rightId)) return;
    if (selectedLeft === rightId) {
      playFeedbackSound('correct', soundEnabled);
      const nextMatched = [...matchedIds, rightId];
      setMatchedIds(nextMatched);
      setSelectedLeft(null);
      if (nextMatched.length === matchSet.left.length) {
        playFeedbackSound('complete', soundEnabled);
      }
    } else {
      playFeedbackSound('wrong', soundEnabled);
      setWrongPair({ left: selectedLeft, right: rightId });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
      }, 450);
    }
  };

  const resetMatchGame = () => {
    setMatchRoundSeed((s) => s + 1);
    setSelectedLeft(null);
    setMatchedIds([]);
    setWrongPair(null);
  };

  if (!currentCard) return null;

  return (
    <div className="space-y-6">
      {/* Mode Switcher & Learned Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start">
          {(
            [
              { id: 'cards', label: 'Thẻ lật 3D' },
              { id: 'list', label: 'Bảng từ đầy đủ' },
              { id: 'quick_match', label: 'Trò chơi ghép nhanh' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setMode(item.id);
                if (item.id === 'quick_match') resetMatchGame();
              }}
              className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
                mode === item.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <p className="text-sm text-slate-600">
          Đã thuộc:{' '}
          <span className="font-mono-code font-bold text-emerald-700 tabular-nums">
            {learnedCount}/{vocabulary.length}
          </span>{' '}
          từ vựng
        </p>
      </div>

      {/* Mode 1: 3D Flip Flashcards */}
      {mode === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div
              onClick={() => setFlipped((f) => !f)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setFlipped((f) => !f);
                }
              }}
              aria-label="Chạm để lật thẻ từ vựng"
              className="perspective-1000 w-full h-80 sm:h-88 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-2xl"
            >
              <div
                className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                  flipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Front Face: English */}
                <div className="absolute inset-0 backface-hidden bg-white border-2 border-slate-200 hover:border-sky-300 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>
                      Thẻ{' '}
                      <strong className="font-mono-code text-slate-800 tabular-nums">
                        {safeIndex + 1}/{vocabulary.length}
                      </strong>{' '}
                      · {currentCard.topicTag}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sky-700 font-semibold">
                      <RotateCw className="w-3.5 h-3.5" />
                      Chạm để xem nghĩa
                    </span>
                  </div>

                  <div className="text-center space-y-3 my-auto">
                    <p className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
                      {currentCard.word}
                    </p>
                    <p className="font-mono-code text-base text-sky-700">
                      {currentCard.ipa}{' '}
                      <span className="text-slate-400 font-sans text-sm">({currentCard.pos})</span>
                    </p>

                    <div
                      className="pt-2 flex items-center justify-center gap-2.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => speakEnglish(currentCard.word, { rate: 0.95 })}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-sm font-semibold transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Nghe chuẩn</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => speakEnglish(currentCard.word, { rate: 0.68 })}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
                      >
                        <Turtle className="w-4 h-4" />
                        <span>Đọc chậm</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <span>Mặt trước · Tiếng Anh</span>
                    {isLearned && (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        Đã thuộc từ này
                      </span>
                    )}
                  </div>
                </div>

                {/* Back Face: Vietnamese Meaning & Example */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-sky-50/60 border-2 border-sky-300 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between text-xs font-medium text-sky-800">
                    <span>
                      {currentCard.word} · <span className="font-mono-code">{currentCard.ipa}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <RotateCw className="w-3.5 h-3.5" />
                      Lật lại mặt trước
                    </span>
                  </div>

                  <div className="text-center space-y-4 my-auto">
                    <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                      {currentCard.meaning}
                    </p>
                    <div
                      className="bg-white border border-sky-200 rounded-xl p-4 text-left space-y-1.5 max-w-lg mx-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm sm:text-base font-medium text-slate-900 leading-relaxed">
                          &ldquo;{currentCard.example}&rdquo;
                        </p>
                        <button
                          type="button"
                          onClick={() => speakEnglish(currentCard.example, { rate: 0.92 })}
                          title="Nghe câu ví dụ"
                          className="p-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 shrink-0 transition-colors"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600">{currentCard.exampleVi}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-sky-200/70 text-xs text-sky-800">
                    <span>Mặt sau · Nghĩa &amp; Câu ví dụ</span>
                    <span>Chạm để lật lại</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Controls */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Thẻ trước</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleLearned(currentCard.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                  isLearned
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isLearned ? 'Đã thuộc từ này' : 'Đánh dấu đã thuộc'}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Thẻ tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Quick Word Jump List */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-2 pb-1">
              Danh sách từ trong bài
            </p>
            <div className="divide-y divide-slate-100">
              {vocabulary.map((item, idx) => {
                const active = idx === safeIndex;
                const done = learnedVocabIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setFlipped(false);
                    }}
                    className={`w-full px-2.5 py-2.5 text-left flex items-center justify-between gap-2 rounded-lg transition-colors ${
                      active ? 'bg-sky-50 text-sky-900' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{item.word}</p>
                      <p className="text-xs text-slate-500 truncate">{item.meaning}</p>
                    </div>
                    {done && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Full Scannable Vocabulary Table */}
      {mode === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
          {vocabulary.map((item) => {
            const done = learnedVocabIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="font-display font-bold text-lg text-slate-900">
                      {item.word}
                    </span>
                    <span className="font-mono-code text-xs text-sky-700">{item.ipa}</span>
                    <span className="text-xs text-slate-500">({item.pos})</span>
                    <span className="text-sm font-semibold text-emerald-800">— {item.meaning}</span>
                  </div>
                  <p className="text-sm text-slate-700">{item.example}</p>
                  <p className="text-xs text-slate-500">{item.exampleVi}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => speakEnglish(item.word, { rate: 0.92 })}
                    className="px-3 py-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Nghe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleLearned(item.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                      done
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{done ? 'Đã thuộc' : 'Chưa thuộc'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mode 3: Interactive Quick 4-Pair Matching Mini-Game */}
      {mode === 'quick_match' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">
                Ghép nhanh từ Tiếng Anh với nghĩa Tiếng Việt
              </h3>
              <p className="text-sm text-slate-600">
                Chạm 1 từ ở cột trái, sau đó chạm nghĩa đúng tương ứng ở cột phải.
              </p>
            </div>
            <button
              type="button"
              onClick={resetMatchGame}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700 inline-flex items-center gap-2 self-start"
            >
              <Shuffle className="w-4 h-4" />
              <span>Đổi bộ từ mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tiếng Anh
              </p>
              {matchSet.left.map((item) => {
                const isMatched = matchedIds.includes(item.id);
                const isSelected = selectedLeft === item.id;
                const isWrong = wrongPair?.left === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isMatched}
                    onClick={() => {
                      setSelectedLeft(item.id);
                      speakEnglish(item.word, { rate: 0.95 });
                    }}
                    className={`w-full p-4 rounded-xl border-2 text-left flex items-center justify-between gap-3 transition-all ${
                      isMatched
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 opacity-75'
                        : isWrong
                          ? 'bg-rose-50 border-rose-400 text-rose-800 animate-soft-shake'
                          : isSelected
                            ? 'bg-sky-50 border-sky-500 text-sky-900'
                            : 'bg-white border-slate-200 hover:border-sky-300 text-slate-900'
                    }`}
                  >
                    <div>
                      <p className="font-display font-bold text-base">{item.word}</p>
                      <p className="font-mono-code text-xs text-slate-500">{item.ipa}</p>
                    </div>
                    {isMatched ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nghĩa Tiếng Việt
              </p>
              {matchSet.right.map((item) => {
                const isMatched = matchedIds.includes(item.id);
                const isWrong = wrongPair?.right === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isMatched}
                    onClick={() => handleMatchRightClick(item.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left flex items-center justify-between gap-3 transition-all ${
                      isMatched
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 opacity-75'
                        : isWrong
                          ? 'bg-rose-50 border-rose-400 text-rose-800 animate-soft-shake'
                          : selectedLeft
                            ? 'bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="font-medium text-base">{item.meaning}</span>
                    {isMatched && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {matchedIds.length === matchSet.left.length && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-sm">
                  Tuyệt vời! Em đã ghép đúng cả {matchSet.left.length} cặp từ vựng!
                </span>
              </div>
              <button
                type="button"
                onClick={resetMatchGame}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
              >
                Chơi vòng tiếp theo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
