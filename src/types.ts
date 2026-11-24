export type SkillCategory =
  | 'pronunciation'
  | 'stress'
  | 'multiple_choice'
  | 'word_form'
  | 'verb_form'
  | 'correction'
  | 'reading'
  | 'writing_rearrange'
  | 'listening_choice'
  | 'matching';

export interface VocabItem {
  id: string;
  word: string;
  ipa: string;
  pos: string; // e.g., "n", "v", "adj", "phr"
  meaning: string;
  example: string;
  exampleVi: string;
  topicTag: string;
}

export type FormulaRole = 'subject' | 'verb' | 'aux' | 'object' | 'keyword' | 'connector';

export interface FormulaToken {
  text: string;
  role: FormulaRole;
  note?: string;
}

export interface GrammarFormRow {
  label: string; // e.g. "Khẳng định (+)", "Phủ định (-)", "Nghi vấn (?)"
  formula: FormulaToken[];
  example: string;
  exampleVi: string;
}

export interface GrammarPoint {
  id: string;
  title: string;
  englishTitle: string;
  summary: string;
  forms: GrammarFormRow[];
  signalWords?: string[];
  memoryTip: string;
  commonMistake?: {
    wrong: string;
    right: string;
    reason: string;
  };
}

export interface SoundGroup {
  symbol: string; // e.g. "/ɑː/" or "Trọng âm 1"
  vietnameseCue: string; // e.g. "âm 'a' kéo dài"
  rule: string;
  examples: {
    word: string;
    highlight: string;
    ipa: string;
    meaning: string;
  }[];
}

export interface PhoneticGuide {
  title: string;
  description: string;
  groups: SoundGroup[];
}

interface BaseExercise {
  id: string;
  unitId: number;
  type: SkillCategory;
  prompt?: string;
  explanation: string;
}

export interface PronunciationOption {
  word: string;
  underline: string; // exact substring to underline
  underlineIndex?: number; // optional exact 0-based start index when substring repeats in word
  ipa: string;
  soundLabel: string; // e.g., "/ɑː/"
}

export interface PronunciationExercise extends BaseExercise {
  type: 'pronunciation';
  options: [PronunciationOption, PronunciationOption, PronunciationOption, PronunciationOption];
  correctIndex: number;
  ruleTip?: string; // optional quick phonetic hint shown before checking
}

export interface StressOption {
  word: string;
  syllables: string[];
  stressIndex: number; // 0-based index of stressed syllable
  ipa: string;
}

export interface StressExercise extends BaseExercise {
  type: 'stress';
  options: [StressOption, StressOption, StressOption, StressOption];
  correctIndex: number;
  ruleTip?: string;
}

export type MultipleChoiceCategory =
  | 'tense'
  | 'collocation'
  | 'preposition'
  | 'comparison'
  | 'modal'
  | 'vocabulary'
  | 'communication';

export interface MultipleChoiceExercise extends BaseExercise {
  type: 'multiple_choice';
  sentence: string; // uses ____ for blank
  options: [string, string, string, string];
  correctIndex: number;
  cluePhrase?: string; // exact signal word/phrase inside sentence to highlight
  category?: MultipleChoiceCategory;
  formulaTip?: string; // concise 1-line decision rule
  translation?: string; // natural Vietnamese translation of completed sentence
}

export type WordFormTargetPos = 'noun' | 'adj' | 'adv' | 'verb' | 'plural';

export interface WordFormExercise extends BaseExercise {
  type: 'word_form';
  sentenceBefore: string;
  sentenceAfter: string;
  rootWord: string; // e.g., "BEAUTY"
  acceptedAnswers: string[];
  hint: string;
  targetPos?: WordFormTargetPos;
  clueWord?: string; // signal word right before/after blank
  transformFormula?: string; // e.g. "CREATE (v) → creat + -ive → creative (adj)"
  translation?: string; // natural Vietnamese translation
}

export type VerbFormTenseTag =
  | 'present_simple'
  | 'present_continuous'
  | 'simple_future'
  | 'gerund_infinitive'
  | 'modals'
  | 'past_simple'
  | 'present_perfect'
  | 'conditional_type1'
  | 'ability_modals';

export interface VerbFormExercise extends BaseExercise {
  type: 'verb_form';
  sentenceBefore: string;
  sentenceAfter: string;
  baseVerb: string; // e.g., "not / go" or "watch"
  acceptedAnswers: string[];
  hint: string;
  tenseTag?: VerbFormTenseTag;
  signalPhrase?: string;
  conjugationFormula?: string;
  translation?: string;
}

export interface CorrectionPart {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface CorrectionSegment {
  text: string;
  partLabel?: 'A' | 'B' | 'C' | 'D';
}

export type CorrectionErrorTag =
  | 'sv_agreement'
  | 'tense_verb'
  | 'preposition'
  | 'noun_article'
  | 'comparison'
  | 'word_choice'
  | 'conjunction_wh'
  | 'past_perfect_trap'
  | 'conditional_trap'
  | 'modal_ability_trap';

export interface CorrectionExercise extends BaseExercise {
  type: 'correction';
  segments: CorrectionSegment[];
  wrongLabel: 'A' | 'B' | 'C' | 'D';
  correctedText: string;
  errorTag?: CorrectionErrorTag;
  cluePhrase?: string;
  fixFormula?: string;
  translation?: string;
}

export interface ReadingSubQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  evidenceQuote?: string;
  questionType?: 'detail' | 'true_false' | 'main_idea' | 'not_mentioned';
}

export interface ReadingExercise extends BaseExercise {
  type: 'reading';
  title: string;
  passage: string;
  glossary: { word: string; meaning: string }[];
  questions: ReadingSubQuestion[];
  format?: 'comprehension' | 'true_false' | 'profile';
  vietnameseSummary?: string;
  sourceLabel?: string;
}

export interface WritingRearrangeExercise extends BaseExercise {
  type: 'writing_rearrange';
  instruction: string;
  vietnameseMeaning: string;
  segments: string[]; // shuffled words/chunks
  correctSentence: string;
  acceptedSentences?: string[];
  formulaTip?: string;
  sourceLabel?: string;
}

export interface ListeningChoiceExercise extends BaseExercise {
  type: 'listening_choice';
  audioScript: string;
  audioTranslation: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface MatchingExercise extends BaseExercise {
  type: 'matching';
  instruction: string;
  pairs: [MatchingPair, MatchingPair, MatchingPair, MatchingPair];
}

export type Exercise =
  | PronunciationExercise
  | StressExercise
  | MultipleChoiceExercise
  | WordFormExercise
  | VerbFormExercise
  | CorrectionExercise
  | ReadingExercise
  | WritingRearrangeExercise
  | ListeningChoiceExercise
  | MatchingExercise;

export interface UnitData {
  id: number;
  semester: 1 | 2;
  code: string; // "Unit 1"
  titleEn: string;
  titleVi: string;
  themeColor: string; // subtle editorial accent hex for unit artwork
  grammarFocus: string;
  phoneticFocus: string;
  summaryVi: string;
  vocabulary: VocabItem[];
  grammar: GrammarPoint[];
  phonetics: PhoneticGuide;
  exercises: Exercise[];
}

export interface MistakeRecord {
  exerciseId: string;
  unitId: number;
  type: SkillCategory;
  wrongAnswer: string;
  timestamp: number;
}

export interface StudentProgress {
  xp: number;
  streak: number;
  bestStreak: number;
  soundEnabled: boolean;
  completedExerciseIds: string[];
  learnedVocabIds: string[];
  mistakes: MistakeRecord[];
  lastActiveUnitId: number;
}

export const SKILL_META: Record<
  SkillCategory,
  { label: string; shortLabel: string; description: string; pdfGroup: number }
> = {
  pronunciation: {
    label: 'Ngữ âm (Pronunciation)',
    shortLabel: 'Ngữ âm',
    description: 'Chọn từ có phần gạch chân phát âm khác các từ còn lại',
    pdfGroup: 1,
  },
  stress: {
    label: 'Trọng âm (Stress)',
    shortLabel: 'Trọng âm',
    description: 'Nhận diện vị trí âm tiết mang trọng âm chính khác biệt',
    pdfGroup: 2,
  },
  multiple_choice: {
    label: 'Trắc nghiệm Ngữ pháp & Từ vựng',
    shortLabel: 'Trắc nghiệm',
    description: 'Chọn đáp án A, B, C, D đúng về ngữ pháp và từ vựng Unit',
    pdfGroup: 3,
  },
  word_form: {
    label: 'Từ loại (Word Forms)',
    shortLabel: 'Từ loại',
    description: 'Chuyển đổi đúng dạng danh từ, tính từ, trạng từ trong ngoặc',
    pdfGroup: 4,
  },
  verb_form: {
    label: 'Chia động từ (Verb Forms)',
    shortLabel: 'Chia động từ',
    description: 'Chia đúng thì và dạng của động từ theo ngữ cảnh câu',
    pdfGroup: 5,
  },
  correction: {
    label: 'Tìm & Sửa lỗi sai',
    shortLabel: 'Sửa lỗi sai',
    description: 'Chạm trực tiếp vào phần gạch chân sai ngữ pháp trong câu',
    pdfGroup: 6,
  },
  reading: {
    label: 'Đọc hiểu (Reading)',
    shortLabel: 'Đọc hiểu',
    description: 'Đọc đoạn văn chuẩn sách giáo khoa kèm từ điển nhanh và câu hỏi',
    pdfGroup: 7,
  },
  writing_rearrange: {
    label: 'Sắp xếp & Viết câu',
    shortLabel: 'Viết câu',
    description: 'Chạm ghép các mảnh từ thành câu tiếng Anh đúng ngữ pháp',
    pdfGroup: 8,
  },
  listening_choice: {
    label: 'Nghe hiểu IOE',
    shortLabel: 'Nghe hiểu',
    description: 'Nghe phát âm tiếng Anh chuẩn và chọn đáp án chính xác',
    pdfGroup: 9,
  },
  matching: {
    label: 'Ghép cặp Từ vựng / Giao tiếp',
    shortLabel: 'Ghép cặp',
    description: 'Nối nhanh 4 cặp từ vựng Tiếng Anh – Tiếng Việt chuẩn xác',
    pdfGroup: 10,
  },
};
