import {
  CorrectionErrorTag,
  CorrectionExercise,
  Exercise,
  MultipleChoiceCategory,
  MultipleChoiceExercise,
  PronunciationExercise,
  ReadingExercise,
  SkillCategory,
  StressExercise,
  UnitData,
  VerbFormExercise,
  VerbFormTenseTag,
  WordFormExercise,
  WordFormTargetPos,
  WritingRearrangeExercise,
} from '../types';
import { PDF_CORRECTION_BANK } from './correctionBank';
import { PDF_MC_BANK } from './multipleChoiceBank';
import { PDF_PRONUNCIATION_BANK } from './phoneticsBank';
import { PDF_READING_BANK } from './readingBank';
import { PDF_STRESS_BANK } from './stressBank';
import { UNITS_1_TO_3 } from './units1to3';
import { UNITS_4_TO_6 } from './units4to6';
import { UNITS_7_TO_9 } from './units7to9';
import { UNITS_10_TO_12 } from './units10to12';
import { PDF_VERB_FORM_BANK } from './verbFormBank';
import { PDF_WORD_FORM_BANK } from './wordFormBank';
import { PDF_WRITING_REARRANGE_BANK } from './writingBank';

const BASE_UNITS: UnitData[] = [
  ...UNITS_1_TO_3,
  ...UNITS_4_TO_6,
  ...UNITS_7_TO_9,
  ...UNITS_10_TO_12,
];

export const ALL_UNITS: UnitData[] = BASE_UNITS.map((unit) => {
  const extraPron = PDF_PRONUNCIATION_BANK[unit.id] ?? [];
  const extraStress = PDF_STRESS_BANK[unit.id] ?? [];
  const extraMc = PDF_MC_BANK[unit.id] ?? [];
  const extraWf = PDF_WORD_FORM_BANK[unit.id] ?? [];
  const extraVf = PDF_VERB_FORM_BANK[unit.id] ?? [];
  const extraCor = PDF_CORRECTION_BANK[unit.id] ?? [];
  const extraRead = PDF_READING_BANK[unit.id] ?? [];
  const extraWriteRe = PDF_WRITING_REARRANGE_BANK[unit.id] ?? [];
  if (
    extraPron.length === 0 &&
    extraStress.length === 0 &&
    extraMc.length === 0 &&
    extraWf.length === 0 &&
    extraVf.length === 0 &&
    extraCor.length === 0 &&
    extraRead.length === 0 &&
    extraWriteRe.length === 0
  ) {
    return unit;
  }
  return {
    ...unit,
    exercises: [
      ...unit.exercises,
      ...extraPron,
      ...extraStress,
      ...extraMc,
      ...extraWf,
      ...extraVf,
      ...extraCor,
      ...extraRead,
      ...extraWriteRe,
    ],
  };
});

export const ALL_EXERCISES: Exercise[] = ALL_UNITS.flatMap((u) => u.exercises);

export function getUnitById(id: number): UnitData {
  return ALL_UNITS.find((u) => u.id === id) ?? ALL_UNITS[0];
}

export function getExerciseById(id: string): Exercise | undefined {
  return ALL_EXERCISES.find((e) => e.id === id);
}

export function getUnitExercisesBySkill(unit: UnitData, skill: SkillCategory): Exercise[] {
  return unit.exercises.filter((e) => e.type === skill);
}

export function getPronunciationByUnit(unitId: number): PronunciationExercise[] {
  const unit = getUnitById(unitId);
  return unit.exercises.filter((e): e is PronunciationExercise => e.type === 'pronunciation');
}

export function getAllPronunciationExercises(semester?: 1 | 2): PronunciationExercise[] {
  const units = semester ? ALL_UNITS.filter((u) => u.semester === semester) : ALL_UNITS;
  return units.flatMap((u) =>
    u.exercises.filter((e): e is PronunciationExercise => e.type === 'pronunciation')
  );
}

export function buildPronunciationMix(semester: 1 | 2 | 'all', count: number): PronunciationExercise[] {
  const pool =
    semester === 'all' ? getAllPronunciationExercises() : getAllPronunciationExercises(semester);
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

export function getStressByUnit(unitId: number): StressExercise[] {
  const unit = getUnitById(unitId);
  return unit.exercises.filter((e): e is StressExercise => e.type === 'stress');
}

export function getAllStressExercises(semester?: 1 | 2): StressExercise[] {
  const units = semester ? ALL_UNITS.filter((u) => u.semester === semester) : ALL_UNITS;
  return units.flatMap((u) =>
    u.exercises.filter((e): e is StressExercise => e.type === 'stress')
  );
}

export function buildStressMix(
  mode: 1 | 2 | 'all' | 'two_syllable' | 'three_plus',
  count: number
): StressExercise[] {
  let pool: StressExercise[];
  if (mode === 'two_syllable') {
    pool = getAllStressExercises().filter((ex) =>
      ex.options.every((opt) => opt.syllables.length === 2)
    );
  } else if (mode === 'three_plus') {
    pool = getAllStressExercises().filter((ex) =>
      ex.options.some((opt) => opt.syllables.length >= 3)
    );
  } else if (mode === 'all') {
    pool = getAllStressExercises();
  } else {
    pool = getAllStressExercises(mode);
  }

  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

export function getMultipleChoiceByUnit(unitId: number): MultipleChoiceExercise[] {
  const unit = getUnitById(unitId);
  return unit.exercises.filter((e): e is MultipleChoiceExercise => e.type === 'multiple_choice');
}

export function getAllMultipleChoiceExercises(semester?: 1 | 2): MultipleChoiceExercise[] {
  const units = semester ? ALL_UNITS.filter((u) => u.semester === semester) : ALL_UNITS;
  return units.flatMap((u) =>
    u.exercises.filter((e): e is MultipleChoiceExercise => e.type === 'multiple_choice')
  );
}

export function buildMultipleChoiceMix(
  mode: 1 | 2 | 'all' | MultipleChoiceCategory | MultipleChoiceCategory[],
  count: number
): MultipleChoiceExercise[] {
  let pool: MultipleChoiceExercise[];
  if (mode === 'all') {
    pool = getAllMultipleChoiceExercises();
  } else if (mode === 1 || mode === 2) {
    pool = getAllMultipleChoiceExercises(mode);
  } else if (Array.isArray(mode)) {
    pool = getAllMultipleChoiceExercises().filter((ex) => ex.category && mode.includes(ex.category));
  } else {
    pool = getAllMultipleChoiceExercises().filter((ex) => ex.category === mode);
  }

  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

export function getWordFormByUnit(unitId: number): WordFormExercise[] {
  const unit = getUnitById(unitId);
  return unit.exercises.filter((e): e is WordFormExercise => e.type === 'word_form');
}

export function getAllWordFormExercises(semester?: 1 | 2): WordFormExercise[] {
  const units = semester ? ALL_UNITS.filter((u) => u.semester === semester) : ALL_UNITS;
  return units.flatMap((u) =>
    u.exercises.filter((e): e is WordFormExercise => e.type === 'word_form')
  );
}

export function buildWordFormMix(
  mode: 1 | 2 | 'all' | WordFormTargetPos | WordFormTargetPos[],
  count: number
): WordFormExercise[] {
  let pool: WordFormExercise[];
  if (mode === 'all') {
    pool = getAllWordFormExercises();
  } else if (mode === 1 || mode === 2) {
    pool = getAllWordFormExercises(mode);
  } else if (Array.isArray(mode)) {
    pool = getAllWordFormExercises().filter((ex) => ex.targetPos && mode.includes(ex.targetPos));
  } else {
    pool = getAllWordFormExercises().filter((ex) => ex.targetPos === mode);
  }

  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

export function getVerbFormByUnit(unitId: number): VerbFormExercise[] {
  const unit = getUnitById(unitId);
  return unit.exercises.filter((e): e is VerbFormExercise => e.type === 'verb_form');
}

export function getAllVerbFormExercises(semester?: 1 | 2): VerbFormExercise[] {
  const units = semester ? ALL_UNITS.filter((u) => u.semester === semester) : ALL_UNITS;
  return units.flatMap((u) =>
    u.exercises.filter((e): e is VerbFormExercise => e.type === 'verb_form')
  );
}

export function buildVerbFormMix(
  mode: 1 | 2 | 'all' | VerbFormTenseTag | VerbFormTenseTag[],
  count: number
): VerbFormExercise[] {
  let pool: VerbFormExercise[];
  if (mode === 'all') {
    pool = getAllVerbFormExercises();
  } else if (mode === 1 || mode === 2) {
    pool = getAllVerbFormExercises(mode);
  } else if (Array.isArray(mode)) {
    pool = getAllVerbFormExercises().filter((ex) => ex.tenseTag && mode.includes(ex.tenseTag));
  } else {
    pool = getAllVerbFormExercises().filter((ex) => ex.tenseTag === mode);
  }

  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

export function getCorrectionByUnit(unitId: number): CorrectionExercise[] {
  const unit = getUnitById(unitId);
  return unit.exercises.filter((e): e is CorrectionExercise => e.type === 'correction');
}

export function getAllCorrectionExercises(semester?: 1 | 2): CorrectionExercise[] {
  const units = semester ? ALL_UNITS.filter((u) => u.semester === semester) : ALL_UNITS;
  return units.flatMap((u) =>
    u.exercises.filter((e): e is CorrectionExercise => e.type === 'correction')
  );
}

export function buildCorrectionMix(
  mode: 1 | 2 | 'all' | CorrectionErrorTag | CorrectionErrorTag[],
  count: number
): CorrectionExercise[] {
  let pool: CorrectionExercise[];
  if (mode === 'all') {
    pool = getAllCorrectionExercises();
  } else if (mode === 1 || mode === 2) {
    pool = getAllCorrectionExercises(mode);
  } else if (Array.isArray(mode)) {
    pool = getAllCorrectionExercises().filter((ex) => ex.errorTag && mode.includes(ex.errorTag));
  } else {
    pool = getAllCorrectionExercises().filter((ex) => ex.errorTag === mode);
  }

  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

export function getReadingByUnit(unitId: number): ReadingExercise[] {
  const unit = getUnitById(unitId);
  return unit.exercises.filter((e): e is ReadingExercise => e.type === 'reading');
}

export function getAllReadingExercises(semester?: 1 | 2): ReadingExercise[] {
  const units = semester ? ALL_UNITS.filter((u) => u.semester === semester) : ALL_UNITS;
  return units.flatMap((u) =>
    u.exercises.filter((e): e is ReadingExercise => e.type === 'reading')
  );
}

export function getWritingRearrangeByUnit(unitId: number): WritingRearrangeExercise[] {
  const unit = getUnitById(unitId);
  return unit.exercises.filter(
    (e): e is WritingRearrangeExercise => e.type === 'writing_rearrange'
  );
}

export function getAllWritingRearrangeExercises(semester?: 1 | 2): WritingRearrangeExercise[] {
  const units = semester ? ALL_UNITS.filter((u) => u.semester === semester) : ALL_UNITS;
  return units.flatMap((u) =>
    u.exercises.filter((e): e is WritingRearrangeExercise => e.type === 'writing_rearrange')
  );
}

// Generate balanced IOE practice set evenly distributing 4 IOE formats:
// 1. FILL_BLANK (word_form / verb_form)
// 2. REARRANGE (writing_rearrange)
// 3. LISTEN_CHOICE (listening_choice)
// 4. MATCHING (matching)
export function buildIoePracticeSet(
  scope: 'all' | 'sem1' | 'sem2' | number,
  count: number
): Exercise[] {
  const units =
    scope === 'all'
      ? ALL_UNITS
      : scope === 'sem1'
        ? ALL_UNITS.filter((u) => u.semester === 1)
        : scope === 'sem2'
          ? ALL_UNITS.filter((u) => u.semester === 2)
          : ALL_UNITS.filter((u) => u.id === scope);

  const pool = units.flatMap((u) => u.exercises);

  const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const buckets: Exercise[][] = [
    shuffle(pool.filter((e) => e.type === 'word_form' || e.type === 'verb_form')),
    shuffle(pool.filter((e) => e.type === 'writing_rearrange')),
    shuffle(pool.filter((e) => e.type === 'listening_choice')),
    shuffle(pool.filter((e) => e.type === 'matching')),
  ];

  // Fallback extras if a single unit doesn't have enough of the 4 IOE buckets
  const extras = shuffle(
    pool.filter(
      (e) =>
        e.type === 'multiple_choice' ||
        e.type === 'pronunciation' ||
        e.type === 'stress' ||
        e.type === 'correction'
    )
  );

  const selected: Exercise[] = [];
  const usedIds = new Set<string>();

  // Round-robin pick evenly across the 4 IOE categories
  let added = true;
  while (selected.length < count && added) {
    added = false;
    for (const bucket of buckets) {
      if (selected.length >= count) break;
      const next = bucket.shift();
      if (next && !usedIds.has(next.id)) {
        selected.push(next);
        usedIds.add(next.id);
        added = true;
      }
    }
  }

  // Top up with extras if user selected 1 specific unit + larger count
  for (const item of extras) {
    if (selected.length >= count) break;
    if (!usedIds.has(item.id)) {
      selected.push(item);
      usedIds.add(item.id);
    }
  }

  return selected;
}
