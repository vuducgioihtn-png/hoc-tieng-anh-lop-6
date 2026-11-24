import { MistakeRecord, StudentProgress } from '../types';

const STORAGE_KEY = 'english6_studio_progress_v1';

export const DEFAULT_PROGRESS: StudentProgress = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  soundEnabled: true,
  completedExerciseIds: [],
  learnedVocabIds: [],
  mistakes: [],
  lastActiveUnitId: 1,
};

export function loadProgress(): StudentProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<StudentProgress>;
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      completedExerciseIds: Array.isArray(parsed.completedExerciseIds) ? parsed.completedExerciseIds : [],
      learnedVocabIds: Array.isArray(parsed.learnedVocabIds) ? parsed.learnedVocabIds : [],
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: StudentProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore quota errors
  }
}

export function normalizeAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s+([?.!,])/g, '$1')
    .replace(/[.!?]+$/g, '');
}

export function checkTextAnswer(userInput: string, acceptedAnswers: string[]): boolean {
  const normUser = normalizeAnswer(userInput);
  if (!normUser) return false;

  // Also allow matching common contractions interchangeably
  const expandContractions = (s: string) =>
    s
      .replace(/\bdon't\b/g, 'do not')
      .replace(/\bdoesn't\b/g, 'does not')
      .replace(/\bdidn't\b/g, 'did not')
      .replace(/\bwon't\b/g, 'will not')
      .replace(/\bcan't\b/g, 'cannot')
      .replace(/\bcouldn't\b/g, 'could not')
      .replace(/\bisn't\b/g, 'is not')
      .replace(/\baren't\b/g, 'are not')
      .replace(/\bwasn't\b/g, 'was not')
      .replace(/\bweren't\b/g, 'were not')
      .replace(/\bshouldn't\b/g, 'should not')
      .replace(/\bmustn't\b/g, 'must not')
      .replace(/\bhaven't\b/g, 'have not')
      .replace(/\bhasn't\b/g, 'has not')
      .replace(/\bi'm\b/g, 'i am')
      .replace(/\bhe's\b/g, 'he is')
      .replace(/\bshe's\b/g, 'she is')
      .replace(/\bit's\b/g, 'it is')
      .replace(/\bwe're\b/g, 'we are')
      .replace(/\bthey're\b/g, 'they are')
      .replace(/\byou're\b/g, 'you are');

  const expandedUser = expandContractions(normUser);

  return acceptedAnswers.some((ans) => {
    const normAns = normalizeAnswer(ans);
    return normUser === normAns || expandedUser === expandContractions(normAns);
  });
}

export function upsertMistake(mistakes: MistakeRecord[], record: MistakeRecord): MistakeRecord[] {
  const filtered = mistakes.filter((m) => m.exerciseId !== record.exerciseId);
  return [record, ...filtered];
}

export function removeMistake(mistakes: MistakeRecord[], exerciseId: string): MistakeRecord[] {
  return mistakes.filter((m) => m.exerciseId !== exerciseId);
}
