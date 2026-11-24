import { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  CheckSquare,
  Ear,
  FileText,
  PenLine,
  Puzzle,
  Repeat,
  SearchCheck,
} from 'lucide-react';
import { CorrectionStudio } from './components/CorrectionStudio';
import { ExercisePlayer } from './components/ExercisePlayer';
import { GrammarAtlas } from './components/GrammarAtlas';
import { IoeArena } from './components/IoeArena';
import { MistakeNotebook } from './components/MistakeNotebook';
import { MultipleChoiceStudio } from './components/MultipleChoiceStudio';
import { PhoneticsStudio } from './components/PhoneticsStudio';
import { ReadingStudio } from './components/ReadingStudio';
import { RoadmapView } from './components/RoadmapView';
import { StressStudio } from './components/StressStudio';
import { NavTab, TopNav } from './components/TopNav';
import { UnitStudio } from './components/UnitStudio';
import { VerbFormStudio } from './components/VerbFormStudio';
import { WordFormStudio } from './components/WordFormStudio';
import { WritingStudio } from './components/WritingStudio';
import { buildIoePracticeSet, getUnitById } from './data/curriculum';
import { Exercise, StudentProgress } from './types';
import { stopSpeaking } from './utils/speech';
import { loadProgress, removeMistake, saveProgress, upsertMistake } from './utils/storage';

interface ActiveSession {
  key: number;
  title: string;
  exercises: Exercise[];
  timedSeconds?: number;
  returnTo: 'unit' | 'phonetics' | 'atlas' | 'ioe' | 'mistakes' | 'roadmap';
}

export default function App() {
  const [progress, setProgress] = useState<StudentProgress>(() => loadProgress());
  const [activeTab, setActiveTab] = useState<NavTab>('roadmap');
  const [soundLabMode, setSoundLabMode] = useState<'pronunciation' | 'stress'>('stress');
  const [grammarLabMode, setGrammarLabMode] = useState<
    'multiple_choice' | 'word_form' | 'verb_form' | 'correction' | 'reading' | 'writing' | 'atlas'
  >('writing');
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const handleSelectTab = (tab: NavTab) => {
    stopSpeaking();
    setSession(null);
    setSelectedUnitId(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSoundLab = (mode: 'pronunciation' | 'stress' = 'pronunciation') => {
    stopSpeaking();
    setSession(null);
    setSelectedUnitId(null);
    setSoundLabMode(mode);
    setActiveTab('phonetics');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectUnit = (unitId: number) => {
    stopSpeaking();
    setSession(null);
    setSelectedUnitId(unitId);
    setActiveTab('roadmap');
    setProgress((prev) => ({ ...prev, lastActiveUnitId: unitId }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSound = () => {
    setProgress((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const handleToggleLearnedVocab = (vocabId: string) => {
    setProgress((prev) => {
      const exists = prev.learnedVocabIds.includes(vocabId);
      const nextLearned = exists
        ? prev.learnedVocabIds.filter((id) => id !== vocabId)
        : [...prev.learnedVocabIds, vocabId];
      return {
        ...prev,
        learnedVocabIds: nextLearned,
        xp: exists ? prev.xp : prev.xp + 5,
      };
    });
  };

  const handleStartSession = (
    title: string,
    exercises: Exercise[],
    returnTo: ActiveSession['returnTo'],
    timedSeconds?: number
  ) => {
    if (exercises.length === 0) return;
    stopSpeaking();
    setSession({
      key: Date.now(),
      title,
      exercises,
      timedSeconds,
      returnTo,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickPractice = () => {
    const unit = getUnitById(progress.lastActiveUnitId);
    const mix = buildIoePracticeSet(unit.id, 8);
    handleStartSession(`Luyện nhanh · ${unit.code}: ${unit.titleEn}`, mix, 'roadmap');
  };

  const handleRecordAnswer = (
    exercise: Exercise,
    isCorrect: boolean,
    wrongAnswerSummary?: string
  ) => {
    setProgress((prev) => {
      if (isCorrect) {
        const nextStreak = prev.streak + 1;
        const alreadyDone = prev.completedExerciseIds.includes(exercise.id);
        return {
          ...prev,
          xp: prev.xp + 10,
          streak: nextStreak,
          bestStreak: Math.max(prev.bestStreak, nextStreak),
          completedExerciseIds: alreadyDone
            ? prev.completedExerciseIds
            : [...prev.completedExerciseIds, exercise.id],
          mistakes: removeMistake(prev.mistakes, exercise.id),
        };
      }

      return {
        ...prev,
        streak: 0,
        mistakes: upsertMistake(prev.mistakes, {
          exerciseId: exercise.id,
          unitId: exercise.unitId,
          type: exercise.type,
          wrongAnswer: wrongAnswerSummary ?? 'Chưa đúng',
          timestamp: Date.now(),
        }),
      };
    });
  };

  const handleRemoveMistake = (exerciseId: string) => {
    setProgress((prev) => ({
      ...prev,
      mistakes: removeMistake(prev.mistakes, exerciseId),
    }));
  };

  const handleExitSession = () => {
    const target = session?.returnTo ?? 'roadmap';
    setSession(null);
    if (target === 'phonetics') {
      setSelectedUnitId(null);
      setActiveTab('phonetics');
    } else if (target === 'atlas') {
      setSelectedUnitId(null);
      setActiveTab('atlas');
    } else if (target === 'ioe') {
      setSelectedUnitId(null);
      setActiveTab('ioe');
    } else if (target === 'mistakes') {
      setSelectedUnitId(null);
      setActiveTab('mistakes');
    } else if (target === 'roadmap') {
      setSelectedUnitId(null);
      setActiveTab('roadmap');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <TopNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onQuickPractice={handleQuickPractice}
        mistakeCount={progress.mistakes.length}
        xp={progress.xp}
        soundEnabled={progress.soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <main className="flex-1 pb-14">
        {session ? (
          <ExercisePlayer
            key={session.key}
            title={session.title}
            exercises={session.exercises}
            soundEnabled={progress.soundEnabled}
            timedSeconds={session.timedSeconds}
            onExit={handleExitSession}
            onRecordAnswer={handleRecordAnswer}
            onRetryExercises={(retryTitle, retryList) =>
              handleStartSession(retryTitle, retryList, session.returnTo)
            }
          />
        ) : selectedUnitId !== null ? (
          <UnitStudio
            unit={getUnitById(selectedUnitId)}
            progress={progress}
            onBack={() => {
              setSelectedUnitId(null);
              setActiveTab('roadmap');
            }}
            onNavigateUnit={handleSelectUnit}
            onToggleLearnedVocab={handleToggleLearnedVocab}
            onStartExercises={(title, exercises) =>
              handleStartSession(title, exercises, 'unit')
            }
            onOpenPhoneticsStudio={(mode) => handleOpenSoundLab(mode ?? 'pronunciation')}
          />
        ) : activeTab === 'phonetics' ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7 space-y-6">
            {/* Unified Studio Switcher: Pronunciation vs Word Stress */}
            <div className="bg-white border border-slate-200 rounded-2xl p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setSoundLabMode('pronunciation');
                }}
                className={`px-4 py-3 rounded-xl text-left flex items-center gap-3 transition-all ${
                  soundLabMode === 'pronunciation'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-transparent text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    soundLabMode === 'pronunciation'
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-sky-50 text-sky-700'
                  }`}
                >
                  <Ear className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-display font-bold text-sm sm:text-base leading-tight">
                    Phòng Ngữ Âm (Pronunciation)
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      soundLabMode === 'pronunciation' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    10 chuyên đề HK1–HK2, 8 bẫy chữ &amp; Kho đề PDF Unit 1–12
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setSoundLabMode('stress');
                }}
                className={`px-4 py-3 rounded-xl text-left flex items-center gap-3 transition-all ${
                  soundLabMode === 'stress'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-transparent text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    soundLabMode === 'stress'
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                </span>
                <div>
                  <p className="font-display font-bold text-sm sm:text-base leading-tight">
                    Phòng Trọng Âm (Word Stress)
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      soundLabMode === 'stress' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    8 Quy tắc HK1–HK2, 6 Ra-đa đuôi từ &amp; Kho đề PDF Unit 1–12
                  </p>
                </div>
              </button>
            </div>

            {soundLabMode === 'pronunciation' ? (
              <PhoneticsStudio
                progress={progress}
                onStartPractice={(title, exercises) =>
                  handleStartSession(title, exercises, 'phonetics')
                }
              />
            ) : (
              <StressStudio
                progress={progress}
                onStartPractice={(title, exercises) =>
                  handleStartSession(title, exercises, 'phonetics')
                }
              />
            )}
          </div>
        ) : activeTab === 'ioe' ? (
          <IoeArena
            onStartSession={(title, exercises, timedSeconds) =>
              handleStartSession(title, exercises, 'ioe', timedSeconds)
            }
          />
        ) : activeTab === 'atlas' ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7 space-y-6">
            {/* Unified Studio Switcher: Multiple Choice · Word Form · Verb Form · Correction · Reading · Writing · Grammar Atlas */}
            <div className="bg-white border border-slate-200 rounded-2xl p-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setGrammarLabMode('multiple_choice');
                }}
                className={`px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 transition-all ${
                  grammarLabMode === 'multiple_choice'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-transparent text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    grammarLabMode === 'multiple_choice'
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-sky-50 text-sky-700'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-display font-bold text-xs sm:text-sm leading-tight truncate">
                    Trắc nghiệm
                  </p>
                  <p
                    className={`text-[11px] mt-0.5 truncate ${
                      grammarLabMode === 'multiple_choice' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    10 Sơ đồ HK1–HK2
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setGrammarLabMode('word_form');
                }}
                className={`px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 transition-all ${
                  grammarLabMode === 'word_form'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-transparent text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    grammarLabMode === 'word_form'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  <Puzzle className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-display font-bold text-xs sm:text-sm leading-tight truncate">
                    Từ loại
                  </p>
                  <p
                    className={`text-[11px] mt-0.5 truncate ${
                      grammarLabMode === 'word_form' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    30 Gốc từ HK1–HK2
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setGrammarLabMode('verb_form');
                }}
                className={`px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 transition-all ${
                  grammarLabMode === 'verb_form'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-transparent text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    grammarLabMode === 'verb_form'
                      ? 'bg-indigo-400 text-slate-950'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-display font-bold text-xs sm:text-sm leading-tight truncate">
                    Chia động từ
                  </p>
                  <p
                    className={`text-[11px] mt-0.5 truncate ${
                      grammarLabMode === 'verb_form' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    9 Sơ đồ HK1–HK2
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setGrammarLabMode('correction');
                }}
                className={`px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 transition-all ${
                  grammarLabMode === 'correction'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-transparent text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    grammarLabMode === 'correction'
                      ? 'bg-rose-400 text-slate-950'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  <SearchCheck className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-display font-bold text-xs sm:text-sm leading-tight truncate">
                    Sửa lỗi sai
                  </p>
                  <p
                    className={`text-[11px] mt-0.5 truncate ${
                      grammarLabMode === 'correction' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    10 Bẫy HK1–HK2
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setGrammarLabMode('reading');
                }}
                className={`px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 transition-all ${
                  grammarLabMode === 'reading'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-transparent text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    grammarLabMode === 'reading'
                      ? 'bg-teal-400 text-slate-950'
                      : 'bg-teal-50 text-teal-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-display font-bold text-xs sm:text-sm leading-tight truncate">
                    Đọc hiểu
                  </p>
                  <p
                    className={`text-[11px] mt-0.5 truncate ${
                      grammarLabMode === 'reading' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    10 Cloze &amp; Kho HK1–HK2
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setGrammarLabMode('writing');
                }}
                className={`px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 transition-all ${
                  grammarLabMode === 'writing'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-transparent text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    grammarLabMode === 'writing'
                      ? 'bg-violet-400 text-slate-950'
                      : 'bg-violet-50 text-violet-700'
                  }`}
                >
                  <PenLine className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-display font-bold text-xs sm:text-sm leading-tight truncate">
                    Luyện viết
                  </p>
                  <p
                    className={`text-[11px] mt-0.5 truncate ${
                      grammarLabMode === 'writing' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    12 Công thức HK1–HK2
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setGrammarLabMode('atlas');
                }}
                className={`px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 transition-all ${
                  grammarLabMode === 'atlas'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-transparent text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    grammarLabMode === 'atlas'
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-display font-bold text-xs sm:text-sm leading-tight truncate">
                    Ngữ pháp
                  </p>
                  <p
                    className={`text-[11px] mt-0.5 truncate ${
                      grammarLabMode === 'atlas' ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    Tra cứu 12 Unit
                  </p>
                </div>
              </button>
            </div>

            {grammarLabMode === 'multiple_choice' ? (
              <MultipleChoiceStudio
                progress={progress}
                onStartPractice={(title, exercises) =>
                  handleStartSession(title, exercises, 'atlas')
                }
              />
            ) : grammarLabMode === 'word_form' ? (
              <WordFormStudio
                progress={progress}
                onStartPractice={(title, exercises) =>
                  handleStartSession(title, exercises, 'atlas')
                }
              />
            ) : grammarLabMode === 'verb_form' ? (
              <VerbFormStudio
                progress={progress}
                onStartPractice={(title, exercises) =>
                  handleStartSession(title, exercises, 'atlas')
                }
              />
            ) : grammarLabMode === 'correction' ? (
              <CorrectionStudio
                progress={progress}
                onStartPractice={(title, exercises) =>
                  handleStartSession(title, exercises, 'atlas')
                }
              />
            ) : grammarLabMode === 'reading' ? (
              <ReadingStudio
                progress={progress}
                onStartPractice={(title, exercises) =>
                  handleStartSession(title, exercises, 'atlas')
                }
              />
            ) : grammarLabMode === 'writing' ? (
              <WritingStudio
                progress={progress}
                onStartPractice={(title, exercises) =>
                  handleStartSession(title, exercises, 'atlas')
                }
              />
            ) : (
              <GrammarAtlas onOpenUnit={handleSelectUnit} />
            )}
          </div>
        ) : activeTab === 'mistakes' ? (
          <MistakeNotebook
            mistakes={progress.mistakes}
            onRetryAll={(title, exercises) =>
              handleStartSession(title, exercises, 'mistakes')
            }
            onRemoveMistake={handleRemoveMistake}
            onGoRoadmap={() => handleSelectTab('roadmap')}
          />
        ) : (
          <RoadmapView
            progress={progress}
            onSelectUnit={handleSelectUnit}
            onStartIoe={() => handleSelectTab('ioe')}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p className="font-medium text-slate-700">
            English 6 Studio · Lộ trình Tiếng Anh Lớp 6 trọn bộ 12 Unit
          </p>
          <p>
            Tiến độ học tập và Sổ tay câu sai được tự động lưu trên trình duyệt của em.
          </p>
        </div>
      </footer>
    </div>
  );
}
