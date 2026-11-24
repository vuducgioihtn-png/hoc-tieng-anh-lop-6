import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Trophy,
  Turtle,
  Volume2,
  XCircle,
} from 'lucide-react';
import {
  CorrectionExercise,
  Exercise,
  ListeningChoiceExercise,
  MatchingExercise,
  MultipleChoiceExercise,
  PronunciationExercise,
  ReadingExercise,
  SKILL_META,
  StressExercise,
  VerbFormExercise,
  WordFormExercise,
  WritingRearrangeExercise,
} from '../types';
import { playFeedbackSound, speakEnglish, stopSpeaking } from '../utils/speech';
import { checkTextAnswer } from '../utils/storage';

export interface ExerciseResultItem {
  exercise: Exercise;
  isCorrect: boolean;
  userAnswerSummary: string;
}

interface ExercisePlayerProps {
  title: string;
  exercises: Exercise[];
  soundEnabled: boolean;
  timedSeconds?: number; // optional countdown timer for IOE mode
  onExit: () => void;
  onRecordAnswer: (exercise: Exercise, isCorrect: boolean, wrongAnswerSummary?: string) => void;
  onRetryExercises?: (title: string, exercises: Exercise[]) => void;
}

function renderUnderlinedOption(word: string, underline: string, underlineIndex?: number) {
  const idx =
    typeof underlineIndex === 'number'
      ? underlineIndex
      : word.toLowerCase().indexOf(underline.toLowerCase());
  if (idx < 0) return <span>{word}</span>;
  const before = word.slice(0, idx);
  const mid = word.slice(idx, idx + underline.length);
  const after = word.slice(idx + underline.length);
  return (
    <span>
      {before}
      <span className="underline decoration-2 decoration-sky-600 underline-offset-4 font-bold text-sky-800">
        {mid}
      </span>
      {after}
    </span>
  );
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const ExercisePlayer: React.FC<ExercisePlayerProps> = ({
  title,
  exercises,
  soundEnabled,
  timedSeconds,
  onExit,
  onRecordAnswer,
  onRetryExercises,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResultItem[]>([]);
  const [finished, setFinished] = useState(false);

  // Per-question interactive state
  const [submitted, setSubmitted] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [textInput, setTextInput] = useState('');
  const [showHint, setShowHint] = useState(false);

  // Rearrange state
  const [pickedIndices, setPickedIndices] = useState<number[]>([]);

  // Reading sub-answers state: map questionId -> chosen option index
  const [readingAnswers, setReadingAnswers] = useState<Record<string, number>>({});
  const [activeEvidenceQuote, setActiveEvidenceQuote] = useState<string | null>(null);
  const [showReadingSummary, setShowReadingSummary] = useState(false);

  // Matching state
  const [matchLeftSelected, setMatchLeftSelected] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [matchMistakes, setMatchMistakes] = useState(0);
  const [wrongMatchFlash, setWrongMatchFlash] = useState<{ left: string; right: string } | null>(
    null
  );

  // Audio playback state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Timer state
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    typeof timedSeconds === 'number' ? timedSeconds : null
  );

  const currentExercise = exercises[currentIndex];

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    if (secondsLeft === null || finished) return;
    if (secondsLeft <= 0) {
      setFinished(true);
      stopSpeaking();
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => (s !== null ? Math.max(0, s - 1) : null));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft, finished]);

  // Reset per-question state when moving to a new exercise
  const resetQuestionState = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setSubmitted(false);
    setIsCurrentCorrect(false);
    setSelectedChoice(null);
    setSelectedLabel(null);
    setTextInput('');
    setShowHint(false);
    setPickedIndices([]);
    setReadingAnswers({});
    setActiveEvidenceQuote(null);
    setShowReadingSummary(false);
    setMatchLeftSelected(null);
    setMatchedPairs([]);
    setMatchMistakes(0);
    setWrongMatchFlash(null);
  };

  // Shuffled right column for matching exercises
  const shuffledMatchingRight = useMemo(() => {
    if (!currentExercise || currentExercise.type !== 'matching') return [];
    const pairs = [...currentExercise.pairs];
    return pairs.sort((a, b) => a.right.localeCompare(b.right, 'vi'));
  }, [currentExercise]);

  const finishQuestion = (isCorrect: boolean, userAnswerSummary: string) => {
    if (!currentExercise || submitted) return;
    setSubmitted(true);
    setIsCurrentCorrect(isCorrect);
    playFeedbackSound(isCorrect ? 'correct' : 'wrong', soundEnabled);
    onRecordAnswer(currentExercise, isCorrect, isCorrect ? undefined : userAnswerSummary);
    setResults((prev) => [...prev, { exercise: currentExercise, isCorrect, userAnswerSummary }]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= exercises.length) {
      stopSpeaking();
      playFeedbackSound('complete', soundEnabled);
      setFinished(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    resetQuestionState();
  };

  const handleCheck = () => {
    if (!currentExercise || submitted) return;

    switch (currentExercise.type) {
      case 'pronunciation':
      case 'stress':
      case 'multiple_choice':
      case 'listening_choice': {
        if (selectedChoice === null) return;
        const ok = selectedChoice === currentExercise.correctIndex;
        const chosenText =
          currentExercise.type === 'pronunciation' || currentExercise.type === 'stress'
            ? currentExercise.options[selectedChoice].word
            : currentExercise.options[selectedChoice];
        finishQuestion(ok, chosenText);
        break;
      }

      case 'word_form':
      case 'verb_form': {
        if (!textInput.trim()) return;
        const ok = checkTextAnswer(textInput, currentExercise.acceptedAnswers);
        finishQuestion(ok, textInput.trim());
        break;
      }

      case 'correction': {
        if (!selectedLabel) return;
        const ok = selectedLabel === currentExercise.wrongLabel;
        const seg = currentExercise.segments.find((s) => s.partLabel === selectedLabel);
        finishQuestion(ok, `${selectedLabel}: ${seg?.text ?? ''}`);
        break;
      }

      case 'writing_rearrange': {
        if (pickedIndices.length === 0) return;
        const built = pickedIndices.map((i) => currentExercise.segments[i]).join(' ');
        const accepted = [
          currentExercise.correctSentence,
          ...(currentExercise.acceptedSentences ?? []),
        ];
        const ok = checkTextAnswer(built, accepted);
        finishQuestion(ok, built);
        break;
      }

      case 'reading': {
        if (Object.keys(readingAnswers).length < currentExercise.questions.length) return;
        const rightCount = currentExercise.questions.filter(
          (q) => readingAnswers[q.id] === q.correctIndex
        ).length;
        const ok = rightCount === currentExercise.questions.length;
        finishQuestion(ok, `Đúng ${rightCount}/${currentExercise.questions.length} câu đọc hiểu`);
        break;
      }

      case 'matching':
        break;
    }
  };

  const handleMatchRightClick = (exercise: MatchingExercise, pairId: string) => {
    if (submitted || !matchLeftSelected || matchedPairs.includes(pairId)) return;
    if (matchLeftSelected === pairId) {
      playFeedbackSound('correct', soundEnabled);
      const nextMatched = [...matchedPairs, pairId];
      setMatchedPairs(nextMatched);
      setMatchLeftSelected(null);
      if (nextMatched.length === exercise.pairs.length) {
        const cleanPass = matchMistakes <= 1;
        finishQuestion(
          cleanPass,
          cleanPass ? 'Ghép đúng 4/4 cặp' : `Hoàn thành với ${matchMistakes} lần ghép nhầm`
        );
      }
    } else {
      playFeedbackSound('wrong', soundEnabled);
      setMatchMistakes((m) => m + 1);
      setWrongMatchFlash({ left: matchLeftSelected, right: pairId });
      setTimeout(() => {
        setWrongMatchFlash(null);
        setMatchLeftSelected(null);
      }, 420);
    }
  };

  const formatClock = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // =========================================================================
  // SUMMARY SCREEN
  // =========================================================================
  if (finished) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const totalCount = exercises.length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const wrongExercises = results.filter((r) => !r.isCorrect).map((r) => r.exercise);
    const earnedXp = correctCount * 10;

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              Hoàn thành phiên luyện tập
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {accuracy >= 80
                ? 'Xuất sắc lắm! Em nắm bài rất chắc!'
                : accuracy >= 50
                  ? 'Làm tốt lắm! Ôn thêm vài câu nữa là đạt điểm tuyệt đối!'
                  : 'Cố lên nhé! Xem lại giải thích bên dưới để nhớ lâu hơn!'}
            </h2>
            <p className="text-sm text-slate-600">{title}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto py-4 border-y border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Số câu đúng</p>
              <p className="font-mono-code text-2xl font-bold text-emerald-700 tabular-nums mt-0.5">
                {correctCount}/{totalCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Độ chính xác</p>
              <p className="font-mono-code text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
                {accuracy}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">XP nhận được</p>
              <p className="font-mono-code text-2xl font-bold text-sky-700 tabular-nums mt-0.5">
                +{earnedXp}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onExit}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
            >
              Quay về bài học
            </button>

            {wrongExercises.length > 0 && onRetryExercises && (
              <button
                type="button"
                onClick={() =>
                  onRetryExercises(`Ôn lại ${wrongExercises.length} câu chưa đúng`, wrongExercises)
                }
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm lại {wrongExercises.length} câu sai</span>
              </button>
            )}
          </div>
        </div>

        {/* Review Breakdown */}
        {results.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900">
              Chi tiết từng câu đã làm
            </h3>
            <div className="divide-y divide-slate-100">
              {results.map((item, idx) => (
                <div key={`${item.exercise.id}-${idx}`} className="py-3.5 flex items-start gap-3">
                  {item.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-slate-900">
                      Câu {idx + 1} · {SKILL_META[item.exercise.type].shortLabel} —{' '}
                      <span className={item.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                        {item.isCorrect ? 'Chính xác' : `Em chọn: ${item.userAnswerSummary}`}
                      </span>
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.exercise.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!currentExercise) return null;

  const progressPct = Math.round(((currentIndex + (submitted ? 1 : 0)) / exercises.length) * 100);
  const canCheck = (() => {
    if (submitted) return false;
    switch (currentExercise.type) {
      case 'pronunciation':
      case 'stress':
      case 'multiple_choice':
      case 'listening_choice':
        return selectedChoice !== null;
      case 'word_form':
      case 'verb_form':
        return textInput.trim().length > 0;
      case 'correction':
        return selectedLabel !== null;
      case 'writing_rearrange':
        return pickedIndices.length === currentExercise.segments.length;
      case 'reading':
        return Object.keys(readingAnswers).length === currentExercise.questions.length;
      case 'matching':
        return false; // auto-completes on 4/4 match
    }
  })();

  // =========================================================================
  // QUESTION RENDERERS
  // =========================================================================
  const renderPronunciation = (ex: PronunciationExercise) => {
    const oddOption = ex.options[ex.correctIndex];
    const sameGroup = ex.options
      .map((opt, idx) => ({ opt, idx }))
      .filter(({ idx }) => idx !== ex.correctIndex);

    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              Ngữ âm · Chọn từ phát âm khác
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Chọn từ có phần gạch chân phát âm KHÁC các từ còn lại:
            </h2>
          </div>

          {ex.ruleTip && !submitted && (
            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHint ? 'Ẩn mẹo âm' : 'Xem mẹo âm'}</span>
            </button>
          )}
        </div>

        {showHint && ex.ruleTip && !submitted && (
          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <strong>Mẹo phân biệt nhanh: </strong>
            {ex.ruleTip}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {ex.options.map((opt, idx) => {
            const isSelected = selectedChoice === idx;
            const isCorrectOpt = idx === ex.correctIndex;

            let cardClass = 'bg-white border-slate-200 hover:border-sky-400 text-slate-900';
            if (submitted) {
              if (isCorrectOpt) cardClass = 'bg-emerald-50 border-emerald-500 text-emerald-950';
              else if (isSelected) cardClass = 'bg-rose-50 border-rose-400 text-rose-950';
              else cardClass = 'bg-slate-50 border-slate-200 text-slate-600';
            } else if (isSelected) {
              cardClass = 'bg-sky-50 border-sky-600 text-sky-950';
            }

            return (
              <div
                key={`${opt.word}-${idx}`}
                className={`rounded-xl border-2 p-4 flex items-center justify-between gap-3 transition-all ${cardClass}`}
              >
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => setSelectedChoice(idx)}
                  className="flex-1 text-left flex items-center gap-3 focus:outline-none"
                >
                  <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-mono-code text-sm font-bold flex items-center justify-center shrink-0">
                    {OPTION_LETTERS[idx]}
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold">
                      {renderUnderlinedOption(opt.word, opt.underline, opt.underlineIndex)}
                    </p>
                    {submitted && (
                      <p className="font-mono-code text-xs mt-0.5 text-slate-600">
                        {opt.ipa} → <strong className="text-sky-800">{opt.soundLabel}</strong>
                      </p>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => speakEnglish(opt.word, { rate: 0.85 })}
                  title={`Nghe phát âm từ ${opt.word}`}
                  className="p-2 rounded-lg bg-white/90 border border-slate-200 hover:border-sky-400 text-slate-600 hover:text-sky-700 shrink-0 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Visual 3-vs-1 Sound Grouping Comparison Card after answering */}
        {submitted && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="sm:col-span-7 bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
              <p className="text-xs font-semibold text-slate-500">
                3 từ CÙNG nhóm âm{' '}
                <span className="font-mono-code font-bold text-sky-700">
                  {sameGroup[0]?.opt.soundLabel}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {sameGroup.map(({ opt, idx }) => (
                  <button
                    key={`${opt.word}-${idx}`}
                    type="button"
                    onClick={() => speakEnglish(opt.word, { rate: 0.82 })}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-sky-50 border border-slate-200 text-xs inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span className="font-bold text-slate-900">
                      {OPTION_LETTERS[idx]}. {opt.word}
                    </span>
                    <span className="font-mono-code text-slate-500">{opt.ipa}</span>
                    <Volume2 className="w-3 h-3 text-sky-600" />
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-5 bg-emerald-50/70 border border-emerald-300 rounded-xl p-3.5 space-y-2">
              <p className="text-xs font-semibold text-emerald-800">
                1 từ KHÁC âm (Đáp án{' '}
                <span className="font-mono-code font-bold">{oddOption.soundLabel}</span>)
              </p>
              <button
                type="button"
                onClick={() => speakEnglish(oddOption.word, { rate: 0.82 })}
                className="w-full px-3 py-2 rounded-lg bg-white hover:bg-emerald-50 border border-emerald-300 text-left flex items-center justify-between gap-2 transition-colors"
              >
                <div>
                  <p className="font-display font-bold text-sm text-emerald-950">
                    {OPTION_LETTERS[ex.correctIndex]}.{' '}
                    {renderUnderlinedOption(
                      oddOption.word,
                      oddOption.underline,
                      oddOption.underlineIndex
                    )}
                  </p>
                  <p className="font-mono-code text-xs text-emerald-800">{oddOption.ipa}</p>
                </div>
                <Volume2 className="w-4 h-4 text-emerald-700 shrink-0" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStress = (ex: StressExercise) => {
    const oddOption = ex.options[ex.correctIndex];
    const matchingOptions = ex.options
      .map((opt, idx) => ({ opt, idx }))
      .filter(({ idx }) => idx !== ex.correctIndex);
    const majorityStressNum = (matchingOptions[0]?.opt.stressIndex ?? 0) + 1;
    const oddStressNum = (oddOption?.stressIndex ?? 0) + 1;

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              Trọng âm · Chọn từ nhấn âm khác
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Chọn từ có vị trí TRỌNG ÂM chính khác với các từ còn lại:
            </h2>
          </div>

          {!submitted && ex.ruleTip && (
            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 self-start transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{showHint ? 'Ẩn mẹo trọng âm' : 'Xem mẹo trọng âm'}</span>
            </button>
          )}
        </div>

        {!submitted && showHint && ex.ruleTip && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs sm:text-sm text-amber-950 leading-relaxed flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong className="font-semibold">Mẹo nhận diện nhanh: </strong>
              {ex.ruleTip}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {ex.options.map((opt, idx) => {
            const isSelected = selectedChoice === idx;
            const isCorrectOpt = idx === ex.correctIndex;

            let cardClass = 'bg-white border-slate-200 hover:border-sky-400 text-slate-900';
            if (submitted) {
              if (isCorrectOpt) cardClass = 'bg-emerald-50 border-emerald-500 text-emerald-950';
              else if (isSelected) cardClass = 'bg-rose-50 border-rose-400 text-rose-950';
              else cardClass = 'bg-slate-50 border-slate-200 text-slate-600';
            } else if (isSelected) {
              cardClass = 'bg-sky-50 border-sky-600 text-sky-950';
            }

            return (
              <div
                key={opt.word}
                className={`rounded-xl border-2 p-4 flex items-center justify-between gap-3 transition-all ${cardClass}`}
              >
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => setSelectedChoice(idx)}
                  className="flex-1 text-left flex items-center gap-3 focus:outline-none min-w-0"
                >
                  <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-mono-code text-sm font-bold flex items-center justify-center shrink-0">
                    {OPTION_LETTERS[idx]}
                  </span>
                  <div className="min-w-0">
                    {submitted ? (
                      <div className="space-y-1.5">
                        <div className="flex items-end gap-1.5 flex-wrap">
                          {opt.syllables.map((syl, sIdx) => {
                            const isStressed = sIdx === opt.stressIndex;
                            return (
                              <div key={`${syl}-${sIdx}`} className="flex flex-col items-center gap-0.5">
                                <span
                                  className={`block rounded-full ${
                                    isStressed
                                      ? isCorrectOpt
                                        ? 'w-2.5 h-3.5 bg-emerald-600'
                                        : 'w-2.5 h-3.5 bg-sky-600'
                                      : 'w-1.5 h-1.5 bg-slate-300'
                                  }`}
                                />
                                <span
                                  className={`px-1.5 py-0.5 rounded font-display text-xs sm:text-sm leading-tight ${
                                    isStressed
                                      ? isCorrectOpt
                                        ? 'bg-emerald-600 text-white font-bold uppercase'
                                        : 'bg-sky-600 text-white font-bold uppercase'
                                      : 'bg-white/90 text-slate-700 font-medium border border-slate-200'
                                  }`}
                                >
                                  {syl}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <p className="font-mono-code text-xs text-slate-600">
                          {opt.ipa} · <strong className="text-slate-900">Âm {opt.stressIndex + 1}</strong>
                        </p>
                      </div>
                    ) : (
                      <p className="font-display text-lg font-semibold">{opt.word}</p>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => speakEnglish(opt.word, { rate: 0.85 })}
                  title={`Nghe từ ${opt.word}`}
                  className="p-2 rounded-lg bg-white/90 border border-slate-200 hover:border-sky-400 text-slate-600 hover:text-sky-700 shrink-0 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Visual 3-vs-1 Stress Grouping Breakdown after submission */}
        {submitted && oddOption && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3.5">
            <div className="md:col-span-7 space-y-2">
              <p className="text-xs font-semibold text-slate-600">
                3 từ CÙNG nhấn{' '}
                <span className="font-mono-code font-bold text-sky-700">
                  Âm tiết {majorityStressNum}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {matchingOptions.map(({ opt, idx }) => (
                  <button
                    key={opt.word}
                    type="button"
                    onClick={() => speakEnglish(opt.word, { rate: 0.85 })}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-sky-50 border border-slate-200 text-left flex items-center gap-2 transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-900">
                      {OPTION_LETTERS[idx]}.{' '}
                      {opt.syllables.map((s, i) => (
                        <React.Fragment key={`${s}-${i}`}>
                          {i > 0 && '-'}
                          <span className={i === opt.stressIndex ? 'text-sky-700 font-bold uppercase' : ''}>
                            {s}
                          </span>
                        </React.Fragment>
                      ))}
                    </span>
                    <span className="font-mono-code text-[11px] text-slate-500">{opt.ipa}</span>
                    <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-5 md:border-l md:border-slate-200 md:pl-3.5 space-y-2">
              <p className="text-xs font-semibold text-emerald-800">
                1 từ KHÁC vị trí (Đáp án ·{' '}
                <span className="font-mono-code font-bold">Âm tiết {oddStressNum}</span>)
              </p>
              <button
                type="button"
                onClick={() => speakEnglish(oddOption.word, { rate: 0.82 })}
                className="w-full px-3 py-2 rounded-lg bg-white hover:bg-emerald-50 border border-emerald-300 text-left flex items-center justify-between gap-2 transition-colors"
              >
                <div>
                  <p className="font-display font-bold text-sm text-emerald-950">
                    {OPTION_LETTERS[ex.correctIndex]}.{' '}
                    {oddOption.syllables.map((s, i) => (
                      <React.Fragment key={`${s}-${i}`}>
                        {i > 0 && '-'}
                        <span
                          className={
                            i === oddOption.stressIndex
                              ? 'text-emerald-700 font-bold uppercase underline decoration-2 underline-offset-2'
                              : ''
                          }
                        >
                          {s}
                        </span>
                      </React.Fragment>
                    ))}
                  </p>
                  <p className="font-mono-code text-xs text-emerald-800">{oddOption.ipa}</p>
                </div>
                <Volume2 className="w-4 h-4 text-emerald-700 shrink-0" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMultipleChoice = (ex: MultipleChoiceExercise) => {
    const chosenText =
      submitted
        ? ex.options[ex.correctIndex]
        : selectedChoice !== null
          ? ex.options[selectedChoice]
          : null;

    // Build completed sentence for TTS read-aloud
    const buildSpokenSentence = () => {
      const answer = ex.options[ex.correctIndex] ?? '';
      const blankRegex = /_{2,}/g;
      if (answer.includes(' - ') || answer.includes(' / ')) {
        const parts = answer.split(/\s*[-/]\s*/);
        let idx = 0;
        return ex.sentence.replace(blankRegex, () => {
          const piece = parts[idx++] ?? '';
          return piece === 'Ø' ? '' : piece;
        });
      }
      return ex.sentence.replace(blankRegex, answer === 'Ø' ? '' : answer);
    };

    const highlightClueInSegment = (segment: string, keyPrefix: string) => {
      if (!ex.cluePhrase || (!submitted && !showHint)) {
        return <React.Fragment key={keyPrefix}>{segment}</React.Fragment>;
      }
      const lowerSeg = segment.toLowerCase();
      const lowerClue = ex.cluePhrase.toLowerCase();
      const matchIdx = lowerSeg.indexOf(lowerClue);
      if (matchIdx === -1) {
        return <React.Fragment key={keyPrefix}>{segment}</React.Fragment>;
      }
      return (
        <React.Fragment key={keyPrefix}>
          {segment.slice(0, matchIdx)}
          <mark className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-950 font-bold underline decoration-2 decoration-amber-400 underline-offset-4">
            {segment.slice(matchIdx, matchIdx + ex.cluePhrase.length)}
          </mark>
          {segment.slice(matchIdx + ex.cluePhrase.length)}
        </React.Fragment>
      );
    };

    const renderDynamicSentence = () => {
      const chunks = ex.sentence.split(/_{2,}/g);
      if (chunks.length === 1) {
        return highlightClueInSegment(ex.sentence, 'mc-full');
      }
      const splitChosen =
        chosenText && chunks.length > 2 && (chosenText.includes(' - ') || chosenText.includes(' / '))
          ? chosenText.split(/\s*[-/]\s*/)
          : null;

      return chunks.map((chunk, cIdx) => {
        const fillValue =
          cIdx < chunks.length - 1
            ? splitChosen
              ? splitChosen[cIdx] ?? chosenText
              : chosenText
            : null;
        return (
          <React.Fragment key={`mc-chunk-${cIdx}`}>
            {highlightClueInSegment(chunk, `mc-seg-${cIdx}`)}
            {cIdx < chunks.length - 1 && (
              <span
                className={`inline-block align-baseline mx-1 px-2.5 py-0.5 rounded-lg border-b-2 font-display transition-colors ${
                  submitted
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                    : fillValue
                      ? 'bg-sky-50 border-sky-600 text-sky-800 font-bold'
                      : 'bg-slate-100 border-slate-400 text-slate-400 min-w-[4.5rem] text-center'
                }`}
              >
                {fillValue ?? '______'}
              </span>
            )}
          </React.Fragment>
        );
      });
    };

    const hasAssist = Boolean(ex.cluePhrase || ex.formulaTip);

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              Trắc nghiệm Ngữ pháp &amp; Từ vựng
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn đáp án A, B, C, D phù hợp nhất để hoàn thiện câu.
            </p>
          </div>

          {!submitted && hasAssist && (
            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 self-start transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{showHint ? 'Ẩn từ khóa & công thức' : 'Soi từ khóa & công thức'}</span>
            </button>
          )}
        </div>

        {/* Visual Sentence Context Stage */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 flex items-start justify-between gap-3">
          <h2 className="font-display text-lg sm:text-2xl font-bold text-slate-900 leading-relaxed">
            {renderDynamicSentence()}
          </h2>

          {submitted && (
            <button
              type="button"
              onClick={() => speakEnglish(buildSpokenSentence(), { rate: 0.9 })}
              title="Nghe cả câu hoàn chỉnh"
              className="p-2.5 rounded-xl bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-400 text-slate-600 hover:text-sky-700 shrink-0 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Pre-check Formula Hint */}
        {!submitted && showHint && ex.formulaTip && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs sm:text-sm text-amber-950 leading-relaxed flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong className="font-semibold">Công thức 3 giây: </strong>
              {ex.formulaTip}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {ex.options.map((opt, idx) => {
            const isSelected = selectedChoice === idx;
            const isCorrectOpt = idx === ex.correctIndex;

            let cardClass = 'bg-white border-slate-200 hover:border-sky-400 text-slate-900';
            if (submitted) {
              if (isCorrectOpt) cardClass = 'bg-emerald-50 border-emerald-500 text-emerald-950';
              else if (isSelected) cardClass = 'bg-rose-50 border-rose-400 text-rose-950';
              else cardClass = 'bg-slate-50 border-slate-200 text-slate-500';
            } else if (isSelected) {
              cardClass = 'bg-sky-50 border-sky-600 text-sky-950';
            }

            return (
              <button
                key={`${opt}-${idx}`}
                type="button"
                disabled={submitted}
                onClick={() => setSelectedChoice(idx)}
                className={`rounded-xl border-2 p-4 text-left flex items-center gap-3 transition-all ${cardClass}`}
              >
                <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-mono-code text-sm font-bold flex items-center justify-center shrink-0">
                  {OPTION_LETTERS[idx]}
                </span>
                <span className="font-semibold text-base">{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Post-check Translation & Formula Summary Box */}
        {submitted && (ex.translation || ex.formulaTip) && (
          <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-4 space-y-2">
            {ex.translation && (
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                <strong className="font-semibold text-sky-900">Dịch nghĩa câu hoàn chỉnh: </strong>
                {ex.translation}
              </p>
            )}
            {ex.formulaTip && (
              <p className="text-xs sm:text-sm text-sky-950 leading-relaxed">
                <strong className="font-semibold text-sky-900">Chìa khóa ghi nhớ: </strong>
                {ex.formulaTip}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFillBlank = (ex: WordFormExercise | VerbFormExercise) => {
    const isWordForm = ex.type === 'word_form';
    const rootPrompt = isWordForm ? ex.rootWord : ex.baseVerb;
    const wfEx = isWordForm ? ex : null;
    const vfEx = !isWordForm ? ex : null;

    const posMeta =
      wfEx?.targetPos === 'noun'
        ? { label: 'DANH TỪ (N)', style: 'bg-sky-100 text-sky-900 border-sky-300' }
        : wfEx?.targetPos === 'adj'
          ? { label: 'TÍNH TỪ (Adj)', style: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
          : wfEx?.targetPos === 'adv'
            ? { label: 'TRẠNG TỪ (Adv)', style: 'bg-amber-100 text-amber-950 border-amber-300' }
            : wfEx?.targetPos === 'verb'
              ? { label: 'ĐỘNG TỪ (V)', style: 'bg-rose-100 text-rose-900 border-rose-300' }
              : wfEx?.targetPos === 'plural'
                ? {
                    label: 'SỐ NHIỀU / ĐẶC BIỆT',
                    style: 'bg-indigo-100 text-indigo-900 border-indigo-300',
                  }
                : null;

    const tenseMeta =
      vfEx?.tenseTag === 'present_simple'
        ? { label: 'HIỆN TẠI ĐƠN', style: 'bg-sky-100 text-sky-900 border-sky-300' }
        : vfEx?.tenseTag === 'present_continuous'
          ? {
              label: 'HIỆN TẠI TIẾP DIỄN',
              style: 'bg-emerald-100 text-emerald-900 border-emerald-300',
            }
          : vfEx?.tenseTag === 'simple_future'
            ? {
                label: 'TƯƠNG LAI ĐƠN',
                style: 'bg-indigo-100 text-indigo-900 border-indigo-300',
              }
            : vfEx?.tenseTag === 'gerund_infinitive'
              ? { label: 'DẠNG V-ING', style: 'bg-amber-100 text-amber-950 border-amber-300' }
              : vfEx?.tenseTag === 'modals'
                ? { label: 'KHUYẾT THIẾU', style: 'bg-rose-100 text-rose-900 border-rose-300' }
                : null;

    const activeMeta = isWordForm ? posMeta : tenseMeta;
    const activeClueText = isWordForm ? wfEx?.clueWord : vfEx?.signalPhrase;
    const activeFormula = isWordForm ? wfEx?.transformFormula : vfEx?.conjugationFormula;
    const activeTranslation = isWordForm ? wfEx?.translation : vfEx?.translation;

    const spokenFullSentence = `${ex.sentenceBefore}${ex.acceptedAnswers[0]}${ex.sentenceAfter}`.trim();

    const previewWord = submitted
      ? ex.acceptedAnswers[0]
      : textInput.trim()
        ? textInput.trim()
        : null;

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              {isWordForm ? 'Từ loại (Word Forms)' : 'Chia động từ (Verb Forms)'}
            </p>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 mt-1">
              {isWordForm
                ? 'Biến đổi từ gốc trong ngoặc sang đúng Từ loại:'
                : 'Chia đúng thì / dạng của động từ trong ngoặc:'}
            </h2>
          </div>

          {!submitted && (
            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 self-start transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>
                {showHint
                  ? 'Ẩn gợi ý'
                  : isWordForm
                    ? 'Soi từ loại & gợi ý'
                    : 'Soi dấu hiệu & thì'}
              </span>
            </button>
          )}
        </div>

        {/* Visual Sentence Context */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-lg sm:text-xl text-slate-900 leading-relaxed">
              <span>{ex.sentenceBefore}</span>
              <span
                className={`inline-block mx-1 px-2.5 py-0.5 rounded-lg border-b-2 font-display transition-colors ${
                  submitted
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                    : previewWord
                      ? 'bg-sky-50 border-sky-600 text-sky-800 font-bold'
                      : 'bg-white border-slate-400 text-slate-400 min-w-[4.5rem] text-center'
                }`}
              >
                {previewWord ?? '______'}
              </span>
              <span className="inline-block mx-1 px-2 py-0.5 rounded-lg bg-sky-100 text-sky-900 font-mono-code text-sm font-bold align-baseline">
                ({rootPrompt})
              </span>
              <span>{ex.sentenceAfter}</span>
            </p>

            {submitted && (
              <button
                type="button"
                onClick={() => speakEnglish(spokenFullSentence, { rate: 0.9 })}
                title="Nghe cả câu hoàn chỉnh"
                className="p-2.5 rounded-xl bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-400 text-slate-600 hover:text-sky-700 shrink-0 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              disabled={submitted}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canCheck) handleCheck();
              }}
              placeholder="Gõ đáp án Tiếng Anh vào đây..."
              autoFocus
              className={`flex-1 px-4 py-3 rounded-xl border-2 text-base font-semibold bg-white focus:outline-none transition-colors ${
                submitted
                  ? isCurrentCorrect
                    ? 'border-emerald-500 text-emerald-800 bg-emerald-50'
                    : 'border-rose-400 text-rose-800 bg-rose-50'
                  : 'border-slate-300 focus:border-sky-600 text-slate-900'
              }`}
            />
            {submitted && !isCurrentCorrect && (
              <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-300 text-sm text-emerald-900 shrink-0">
                Đáp án đúng:{' '}
                <strong className="font-mono-code">{ex.acceptedAnswers[0]}</strong>
              </div>
            )}
          </div>

          {/* Pre-check Visual Hint & Target POS / Tense Card */}
          {showHint && !submitted && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 space-y-2">
              {(activeMeta || activeClueText) && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {activeMeta && (
                    <span
                      className={`px-2.5 py-1 rounded-lg border font-mono-code font-bold ${activeMeta.style}`}
                    >
                      {isWordForm ? `Cần điền: ${activeMeta.label}` : `Thì / Dạng: ${activeMeta.label}`}
                    </span>
                  )}
                  {activeClueText && (
                    <span className="text-amber-900 font-medium">
                      {isWordForm ? 'Dấu hiệu xung quanh: ' : 'Dấu hiệu nhận biết: '}
                      <strong className="font-mono-code text-amber-950">“{activeClueText}”</strong>
                    </span>
                  )}
                </div>
              )}
              <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                <strong>Gợi ý:</strong> {ex.hint}
              </p>
            </div>
          )}

          {/* Post-check Visual Transformation / Conjugation & Translation Card */}
          {submitted && (activeFormula || activeTranslation) && (
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-2">
              {activeFormula && (
                <div className="flex flex-wrap items-center gap-2">
                  {activeMeta && (
                    <span
                      className={`px-2 py-0.5 rounded-md border font-mono-code text-[11px] font-bold ${activeMeta.style}`}
                    >
                      {activeMeta.label}
                    </span>
                  )}
                  <p className="font-mono-code text-xs sm:text-sm font-bold text-sky-950">
                    {activeFormula}
                  </p>
                </div>
              )}
              {activeTranslation && (
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                  <strong className="font-semibold text-sky-900">Dịch nghĩa: </strong>
                  {activeTranslation}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCorrection = (ex: CorrectionExercise) => {
    const errorTagMeta =
      ex.errorTag === 'sv_agreement'
        ? { label: 'LỖI CHỦ – VỊ', style: 'bg-sky-100 text-sky-900 border-sky-300' }
        : ex.errorTag === 'tense_verb'
          ? { label: 'LỖI THÌ & ĐỘNG TỪ', style: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
          : ex.errorTag === 'preposition'
            ? { label: 'LỖI GIỚI TỪ', style: 'bg-amber-100 text-amber-950 border-amber-300' }
            : ex.errorTag === 'noun_article'
              ? { label: 'LỖI DANH TỪ / MẠO TỪ', style: 'bg-indigo-100 text-indigo-900 border-indigo-300' }
              : ex.errorTag === 'comparison'
                ? { label: 'LỖI SO SÁNH', style: 'bg-rose-100 text-rose-900 border-rose-300' }
                : ex.errorTag === 'word_choice'
                  ? { label: 'LỖI TỪ LOẠI & LOGIC', style: 'bg-violet-100 text-violet-900 border-violet-300' }
                  : null;

    const wrongPartText =
      ex.segments.find((s) => s.partLabel === ex.wrongLabel)?.text ?? ex.wrongLabel;

    const correctedFullSentence = ex.segments
      .map((s) => {
        if (s.partLabel !== ex.wrongLabel) return s.text;
        if (ex.correctedText.startsWith('(bỏ')) return '';
        return ex.correctedText.split('/')[0].replace(/\(.*?\)/g, '').trim();
      })
      .join('')
      .replace(/\s+([.,?!])/g, '$1')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              Tìm &amp; Sửa lỗi sai (Error Correction)
            </p>
            <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 mt-1">
              Chạm trực tiếp vào phần gạch chân (A, B, C hoặc D) chứa LỖI SAI:
            </h2>
          </div>

          {!submitted && (errorTagMeta || ex.cluePhrase) && (
            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 self-start transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{showHint ? 'Ẩn gợi ý' : 'Soi vùng nghi vấn'}</span>
            </button>
          )}
        </div>

        {/* Interactive Sentence with Clickable Underlined Spans */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-lg sm:text-xl leading-loose text-slate-900">
              {ex.segments.map((seg, idx) => {
                if (!seg.partLabel) {
                  return <span key={idx}>{seg.text}</span>;
                }
                const label = seg.partLabel;
                const isSelected = selectedLabel === label;
                const isWrongTarget = label === ex.wrongLabel;

                let btnStyle =
                  'bg-white border-b-2 border-sky-500 text-slate-900 hover:bg-sky-50 px-1.5 py-0.5 rounded-t';
                if (submitted) {
                  if (isWrongTarget) {
                    btnStyle =
                      'bg-emerald-100 border-b-2 border-emerald-600 text-emerald-950 px-1.5 py-0.5 rounded';
                  } else if (isSelected) {
                    btnStyle =
                      'bg-rose-100 border-b-2 border-rose-500 text-rose-900 px-1.5 py-0.5 rounded';
                  } else {
                    btnStyle = 'border-b border-slate-300 text-slate-500 px-1';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-sky-600 text-white px-2 py-0.5 rounded font-semibold';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={submitted}
                    onClick={() => setSelectedLabel(label)}
                    className={`inline-flex items-baseline gap-1 mx-0.5 transition-all ${btnStyle}`}
                  >
                    <sup className="font-mono-code text-xs font-bold opacity-80">{label}</sup>
                    <span className={submitted && isWrongTarget ? 'line-through decoration-rose-500' : ''}>
                      {seg.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {submitted && (
              <button
                type="button"
                onClick={() => speakEnglish(correctedFullSentence, { rate: 0.9 })}
                title="Nghe câu đã sửa đúng hoàn chỉnh"
                className="p-2.5 rounded-xl bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-400 text-slate-600 hover:text-sky-700 shrink-0 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Pre-check Radar Hint */}
          {showHint && !submitted && (errorTagMeta || ex.cluePhrase) && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 flex flex-wrap items-center gap-2 text-xs">
              {errorTagMeta && (
                <span
                  className={`px-2.5 py-1 rounded-lg border font-mono-code font-bold ${errorTagMeta.style}`}
                >
                  Nhóm lỗi: {errorTagMeta.label}
                </span>
              )}
              {ex.cluePhrase && (
                <span className="text-amber-950 font-medium">
                  Từ khóa soi lỗi:{' '}
                  <strong className="font-mono-code">“{ex.cluePhrase}”</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Explicit A/B/C/D buttons for accessibility and easy tapping on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ex.segments
            .filter((s): s is { text: string; partLabel: 'A' | 'B' | 'C' | 'D' } =>
              Boolean(s.partLabel)
            )
            .map((part) => {
              const isSelected = selectedLabel === part.partLabel;
              const isTarget = part.partLabel === ex.wrongLabel;
              let style = 'bg-white border-slate-200 hover:border-sky-400 text-slate-800';
              if (submitted) {
                if (isTarget) style = 'bg-emerald-50 border-emerald-500 text-emerald-900';
                else if (isSelected) style = 'bg-rose-50 border-rose-400 text-rose-900';
              } else if (isSelected) {
                style = 'bg-sky-50 border-sky-600 text-sky-950';
              }
              return (
                <button
                  key={part.partLabel}
                  type="button"
                  disabled={submitted}
                  onClick={() => setSelectedLabel(part.partLabel)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${style}`}
                >
                  <span className="font-mono-code text-xs font-bold block text-slate-500">
                    Phương án {part.partLabel}
                  </span>
                  <span className="font-semibold text-sm">{part.text}</span>
                </button>
              );
            })}
        </div>

        {/* Post-check Visual Diff, Formula & Translation Card */}
        {submitted && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-sm text-emerald-950">
            <div className="flex flex-wrap items-center gap-2">
              {errorTagMeta && (
                <span
                  className={`px-2 py-0.5 rounded-md border font-mono-code text-[11px] font-bold ${errorTagMeta.style}`}
                >
                  {errorTagMeta.label}
                </span>
              )}
              <span>
                Đáp án <strong>{ex.wrongLabel}</strong>:
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono-code text-xs line-through">
                {wrongPartText}
              </span>
              <span className="text-emerald-700 font-bold">→</span>
              <strong className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono-code text-xs sm:text-sm">
                {ex.correctedText}
              </strong>
            </div>

            {ex.fixFormula && (
              <p className="font-mono-code text-xs sm:text-sm font-bold text-sky-950">
                Quy tắc: {ex.fixFormula}
              </p>
            )}

            {ex.translation && (
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                <strong className="font-semibold text-emerald-900">Câu chuẩn: </strong>
                {ex.translation}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderReading = (ex: ReadingExercise) => {
    const paragraphs = ex.passage.split('\n\n');

    const renderParagraphWithEvidence = (text: string) => {
      if (!activeEvidenceQuote) return text;
      const idx = text.toLowerCase().indexOf(activeEvidenceQuote.toLowerCase());
      if (idx < 0) return text;
      return (
        <>
          {text.slice(0, idx)}
          <mark className="bg-amber-200 text-slate-950 font-semibold px-1 py-0.5 rounded">
            {text.slice(idx, idx + activeEvidenceQuote.length)}
          </mark>
          {text.slice(idx + activeEvidenceQuote.length)}
        </>
      );
    };

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              Đọc hiểu (Reading Comprehension)
              {ex.sourceLabel ? ` · ${ex.sourceLabel}` : ''}
            </p>
            <h2 className="font-display text-xl font-bold text-slate-900 mt-0.5">{ex.title}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ex.vietnameseSummary && (
              <button
                type="button"
                onClick={() => setShowReadingSummary((v) => !v)}
                className="px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showReadingSummary ? 'Ẩn tóm tắt' : 'Tóm tắt Tiếng Việt'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                  setIsSpeaking(false);
                } else {
                  speakEnglish(ex.passage, {
                    rate: 0.88,
                    onStart: () => setIsSpeaking(true),
                    onEnd: () => setIsSpeaking(false),
                  });
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSpeaking ? 'Dừng đọc' : 'Nghe bài đọc'}</span>
            </button>
          </div>
        </div>

        {showReadingSummary && ex.vietnameseSummary && (
          <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-4 text-xs sm:text-sm text-amber-950 leading-relaxed">
            <strong>Tóm tắt ý chính Tiếng Việt: </strong>
            {ex.vietnameseSummary}
          </div>
        )}

        {/* Two-zone split layout: Sticky Passage left, Questions right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-6 lg:sticky lg:top-20 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            {activeEvidenceQuote && (
              <div className="flex items-center justify-between gap-2 text-xs bg-amber-100/80 border border-amber-300 rounded-lg px-3 py-1.5 text-amber-950">
                <span className="font-semibold">Đang tô sáng câu dẫn chứng trong bài đọc</span>
                <button
                  type="button"
                  onClick={() => setActiveEvidenceQuote(null)}
                  className="underline font-semibold shrink-0"
                >
                  Tắt
                </button>
              </div>
            )}

            <div className="space-y-3">
              {paragraphs.map((para, pIdx) => (
                <p key={pIdx} className="text-sm sm:text-base text-slate-800 leading-7">
                  {renderParagraphWithEvidence(para)}
                </p>
              ))}
            </div>

            {ex.glossary.length > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Từ mới chú thích (chạm từ để nghe đọc)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs sm:text-sm text-slate-700">
                  {ex.glossary.map((g) => (
                    <button
                      key={g.word}
                      type="button"
                      onClick={() => speakEnglish(g.word, { rate: 0.85 })}
                      className="text-left inline-flex items-center gap-1.5 hover:text-sky-800 py-0.5 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>
                        <strong className="text-sky-900">{g.word}</strong>: {g.meaning}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-6 space-y-4">
            {ex.questions.map((subQ, qIdx) => {
              const chosen = readingAnswers[subQ.id];
              const isShowingThisEvidence =
                Boolean(subQ.evidenceQuote) && activeEvidenceQuote === subQ.evidenceQuote;
              return (
                <div
                  key={subQ.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-slate-900 leading-snug">
                      {qIdx + 1}. {subQ.question}
                    </p>
                    {subQ.evidenceQuote && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveEvidenceQuote(
                            isShowingThisEvidence ? null : (subQ.evidenceQuote ?? null)
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
                          isShowingThisEvidence
                            ? 'bg-amber-200 border-amber-400 text-amber-950'
                            : 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-900'
                        }`}
                      >
                        {isShowingThisEvidence
                          ? 'Đang soi'
                          : submitted
                            ? 'Xem dẫn chứng'
                            : 'Soi dẫn chứng'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {subQ.options.map((opt, oIdx) => {
                      const isPicked = chosen === oIdx;
                      const isRight = oIdx === subQ.correctIndex;
                      let cls = 'bg-slate-50 border-slate-200 hover:border-sky-400 text-slate-800';
                      if (submitted) {
                        if (isRight) {
                          cls = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold';
                        } else if (isPicked) {
                          cls = 'bg-rose-50 border-rose-400 text-rose-900';
                        }
                      } else if (isPicked) {
                        cls = 'bg-sky-50 border-sky-600 text-sky-950 font-semibold';
                      }
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={submitted}
                          onClick={() =>
                            setReadingAnswers((prev) => ({ ...prev, [subQ.id]: oIdx }))
                          }
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-left text-xs sm:text-sm transition-colors ${cls}`}
                        >
                          <span className="font-mono-code font-bold mr-2">
                            {OPTION_LETTERS[oIdx]}.
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {submitted && (
                    <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 leading-relaxed">
                      {subQ.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderRearrange = (ex: WritingRearrangeExercise) => {
    const builtSentence = pickedIndices.map((i) => ex.segments[i]).join(' ');

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-sky-700">
              Sắp xếp &amp; Viết câu (Rearrange)
              {ex.sourceLabel ? ` · ${ex.sourceLabel}` : ''}
            </p>
            <h2 className="font-display text-xl font-bold text-slate-900 mt-1">{ex.instruction}</h2>
            <p className="text-sm text-slate-600 mt-1">
              Nghĩa gợi ý: <strong className="text-slate-800">{ex.vietnameseMeaning}</strong>
            </p>
          </div>

          {!submitted && ex.formulaTip && (
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>{showHint ? 'Ẩn khung câu' : 'Gợi ý khung câu'}</span>
            </button>
          )}
        </div>

        {!submitted && showHint && ex.formulaTip && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs sm:text-sm text-amber-950">
            <strong>Khung cấu trúc: </strong>
            <span className="font-mono-code font-semibold">{ex.formulaTip}</span>
          </div>
        )}

        {/* Answer Assembly Tray */}
        <div
          className={`min-h-20 p-4 rounded-2xl border-2 border-dashed flex flex-wrap items-center gap-2 transition-colors ${
            submitted
              ? isCurrentCorrect
                ? 'bg-emerald-50 border-emerald-400'
                : 'bg-rose-50 border-rose-400'
              : 'bg-slate-50 border-slate-300'
          }`}
        >
          {pickedIndices.length === 0 ? (
            <span className="text-sm text-slate-400">
              Chạm vào các thẻ từ bên dưới theo đúng thứ tự câu...
            </span>
          ) : (
            pickedIndices.map((segIdx, pos) => (
              <button
                key={`${segIdx}-${pos}`}
                type="button"
                disabled={submitted}
                onClick={() => setPickedIndices((prev) => prev.filter((_, p) => p !== pos))}
                className="px-3.5 py-2 rounded-xl bg-white border border-sky-300 hover:border-rose-300 text-slate-900 font-semibold text-sm shadow-xs transition-colors"
              >
                {ex.segments[segIdx]}
              </button>
            ))
          )}
        </div>

        {/* Word Bank */}
        <div className="flex flex-wrap items-center gap-2.5">
          {ex.segments.map((seg, idx) => {
            const used = pickedIndices.includes(idx);
            return (
              <button
                key={`${seg}-${idx}`}
                type="button"
                disabled={submitted || used}
                onClick={() => setPickedIndices((prev) => [...prev, idx])}
                className={`px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                  used
                    ? 'bg-slate-100 border-slate-200 text-slate-300'
                    : 'bg-white border-slate-200 hover:border-sky-500 hover:bg-sky-50 text-slate-900'
                }`}
              >
                {seg}
              </button>
            );
          })}

          {!submitted && pickedIndices.length > 0 && (
            <button
              type="button"
              onClick={() => setPickedIndices([])}
              className="ml-auto text-xs font-semibold text-slate-500 hover:text-rose-600 px-2 py-1"
            >
              Xóa xếp lại
            </button>
          )}
        </div>

        {submitted && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              {!isCurrentCorrect && (
                <p className="text-xs text-rose-700">Câu em ghép: {builtSentence}</p>
              )}
              <p>
                <strong>Câu chuẩn xác: </strong>
                <span className="font-semibold text-emerald-800">{ex.correctSentence}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => speakEnglish(ex.correctSentence)}
              className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 hover:border-emerald-400 text-emerald-800 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>Nghe đọc chuẩn</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderListening = (ex: ListeningChoiceExercise) => (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
          Nghe hiểu chuẩn IOE (Listen &amp; Choose)
        </p>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-1">
          {ex.question}
        </h2>
      </div>

      {/* Interactive Audio Player Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() =>
              speakEnglish(ex.audioScript, {
                rate: 0.92,
                onStart: () => setIsSpeaking(true),
                onEnd: () => setIsSpeaking(false),
              })
            }
            className="w-12 h-12 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center shrink-0 transition-colors"
            aria-label="Phát câu tiếng Anh tốc độ chuẩn"
          >
            <Volume2 className="w-6 h-6" />
          </button>
          <div>
            <p className="font-display font-semibold text-base">
              {isSpeaking ? 'Đang phát giọng đọc Tiếng Anh...' : 'Bấm để nghe câu Tiếng Anh'}
            </p>
            <p className="text-xs text-slate-300">
              Em có thể nghe lại nhiều lần hoặc chọn tốc độ đọc chậm 0.75x
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSpeaking && (
            <div className="flex items-end gap-1 h-5 mr-1" aria-hidden="true">
              <span className="w-1 h-full bg-sky-400 rounded-full animate-audio-bar" />
              <span
                className="w-1 h-full bg-sky-400 rounded-full animate-audio-bar"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1 h-full bg-sky-400 rounded-full animate-audio-bar"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          )}
          <button
            type="button"
            onClick={() =>
              speakEnglish(ex.audioScript, {
                rate: 0.72,
                onStart: () => setIsSpeaking(true),
                onEnd: () => setIsSpeaking(false),
              })
            }
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
          >
            <Turtle className="w-4 h-4 text-sky-300" />
            <span>Nghe chậm 0.75x</span>
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {ex.options.map((opt, idx) => {
          const isSelected = selectedChoice === idx;
          const isCorrectOpt = idx === ex.correctIndex;
          let cardClass = 'bg-white border-slate-200 hover:border-sky-400 text-slate-900';
          if (submitted) {
            if (isCorrectOpt) cardClass = 'bg-emerald-50 border-emerald-500 text-emerald-950';
            else if (isSelected) cardClass = 'bg-rose-50 border-rose-400 text-rose-950';
            else cardClass = 'bg-slate-50 border-slate-200 text-slate-500';
          } else if (isSelected) {
            cardClass = 'bg-sky-50 border-sky-600 text-sky-950';
          }
          return (
            <button
              key={opt}
              type="button"
              disabled={submitted}
              onClick={() => setSelectedChoice(idx)}
              className={`rounded-xl border-2 p-4 text-left flex items-center gap-3 transition-all ${cardClass}`}
            >
              <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-mono-code text-sm font-bold flex items-center justify-center shrink-0">
                {OPTION_LETTERS[idx]}
              </span>
              <span className="font-semibold text-sm sm:text-base">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Reveal full English + Vietnamese transcript after answering */}
      {submitted && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-sm">
          <p className="font-semibold text-slate-900">
            Nội dung đoạn nghe: &ldquo;{ex.audioScript}&rdquo;
          </p>
          <p className="text-slate-600">Dịch nghĩa: {ex.audioTranslation}</p>
        </div>
      )}
    </div>
  );

  const renderMatching = (ex: MatchingExercise) => (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
          Ghép cặp chuẩn IOE (Matching)
        </p>
        <h2 className="font-display text-xl font-bold text-slate-900 mt-1">{ex.instruction}</h2>
        <p className="text-sm text-slate-600 mt-0.5">
          Chạm 1 ô bên trái rồi chạm nghĩa tương ứng bên phải ({matchedPairs.length}/{ex.pairs.length} cặp).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2.5">
          {ex.pairs.map((pair) => {
            const isMatched = matchedPairs.includes(pair.id);
            const isSelected = matchLeftSelected === pair.id;
            const isWrong = wrongMatchFlash?.left === pair.id;
            return (
              <button
                key={pair.id}
                type="button"
                disabled={isMatched || submitted}
                onClick={() => {
                  setMatchLeftSelected(pair.id);
                  speakEnglish(pair.left, { rate: 0.92 });
                }}
                className={`w-full p-4 rounded-xl border-2 text-left font-display font-semibold flex items-center justify-between gap-2 transition-all ${
                  isMatched
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                    : isWrong
                      ? 'bg-rose-50 border-rose-400 text-rose-800 animate-soft-shake'
                      : isSelected
                        ? 'bg-sky-50 border-sky-600 text-sky-950'
                        : 'bg-white border-slate-200 hover:border-sky-400 text-slate-900'
                }`}
              >
                <span>{pair.left}</span>
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
          {shuffledMatchingRight.map((pair) => {
            const isMatched = matchedPairs.includes(pair.id);
            const isWrong = wrongMatchFlash?.right === pair.id;
            return (
              <button
                key={pair.id}
                type="button"
                disabled={isMatched || submitted}
                onClick={() => handleMatchRightClick(ex, pair.id)}
                className={`w-full p-4 rounded-xl border-2 text-left font-medium flex items-center justify-between gap-2 transition-all ${
                  isMatched
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                    : isWrong
                      ? 'bg-rose-50 border-rose-400 text-rose-800 animate-soft-shake'
                      : matchLeftSelected
                        ? 'bg-white border-slate-300 hover:border-sky-500 hover:bg-sky-50/40 text-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <span>{pair.right}</span>
                {isMatched && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-7 space-y-6">
      {/* Top Progress Bar & Exit */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onExit();
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Thoát</span>
          </button>

          <p className="text-sm font-semibold text-slate-800 truncate">{title}</p>

          <div className="flex items-center gap-3 shrink-0">
            {secondsLeft !== null && (
              <span
                className={`inline-flex items-center gap-1 font-mono-code text-sm font-bold tabular-nums ${
                  secondsLeft <= 30 ? 'text-rose-600' : 'text-slate-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                {formatClock(secondsLeft)}
              </span>
            )}
            <span className="font-mono-code text-sm font-bold text-slate-700 tabular-nums">
              {currentIndex + 1}/{exercises.length}
            </span>
          </div>
        </div>

        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Active Question Stage */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-xs space-y-6">
        {currentExercise.type === 'pronunciation' && renderPronunciation(currentExercise)}
        {currentExercise.type === 'stress' && renderStress(currentExercise)}
        {currentExercise.type === 'multiple_choice' && renderMultipleChoice(currentExercise)}
        {(currentExercise.type === 'word_form' || currentExercise.type === 'verb_form') &&
          renderFillBlank(currentExercise)}
        {currentExercise.type === 'correction' && renderCorrection(currentExercise)}
        {currentExercise.type === 'reading' && renderReading(currentExercise)}
        {currentExercise.type === 'writing_rearrange' && renderRearrange(currentExercise)}
        {currentExercise.type === 'listening_choice' && renderListening(currentExercise)}
        {currentExercise.type === 'matching' && renderMatching(currentExercise)}

        {/* Dual-Coded Feedback & Vietnamese Explanation */}
        {submitted && (
          <div
            className={`rounded-xl border p-4 sm:p-5 space-y-2 ${
              isCurrentCorrect
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2 font-display font-bold text-base">
              {isCurrentCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Chính xác! +10 XP</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Chưa chính xác — Đã lưu vào Sổ tay câu sai để ôn lại</span>
                </>
              )}
            </div>
            <p className="text-sm leading-relaxed opacity-95">
              <strong>Giải thích: </strong>
              {currentExercise.explanation}
            </p>
          </div>
        )}

        {/* Footer Action Bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          {!submitted ? (
            currentExercise.type !== 'matching' && (
              <button
                type="button"
                disabled={!canCheck}
                onClick={handleCheck}
                className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition-colors"
              >
                Kiểm tra đáp án
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm inline-flex items-center gap-2 transition-colors"
            >
              <span>{currentIndex + 1 >= exercises.length ? 'Xem kết quả' : 'Câu tiếp theo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
