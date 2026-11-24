import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Headphones,
  Layers,
  Play,
} from 'lucide-react';
import { Exercise, SKILL_META, SkillCategory, StudentProgress, UnitData } from '../types';
import { FlashcardDeck } from './FlashcardDeck';
import { GrammarPhoneticsPanel } from './GrammarPhoneticsPanel';
import { UnitArtwork } from './UnitArtwork';

interface UnitStudioProps {
  unit: UnitData;
  progress: StudentProgress;
  onBack: () => void;
  onNavigateUnit: (unitId: number) => void;
  onToggleLearnedVocab: (vocabId: string) => void;
  onStartExercises: (title: string, exercises: Exercise[]) => void;
  onOpenPhoneticsStudio: (mode?: 'pronunciation' | 'stress') => void;
}

const ORDERED_SKILLS: SkillCategory[] = [
  'pronunciation',
  'stress',
  'multiple_choice',
  'word_form',
  'verb_form',
  'correction',
  'reading',
  'writing_rearrange',
  'listening_choice',
  'matching',
];

export const UnitStudio: React.FC<UnitStudioProps> = ({
  unit,
  progress,
  onBack,
  onNavigateUnit,
  onToggleLearnedVocab,
  onStartExercises,
  onOpenPhoneticsStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'vocab' | 'grammar' | 'practice'>('vocab');

  const doneExercises = unit.exercises.filter((e) =>
    progress.completedExerciseIds.includes(e.id)
  ).length;
  const learnedWords = unit.vocabulary.filter((v) =>
    progress.learnedVocabIds.includes(v.id)
  ).length;
  const totalItems = unit.exercises.length + unit.vocabulary.length;
  const masteryPct = Math.round(((doneExercises + learnedWords) / totalItems) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7 space-y-6">
      {/* Top Breadcrumb & Prev/Next Unit */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Lộ trình 12 Unit</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={unit.id <= 1}
            onClick={() => onNavigateUnit(unit.id - 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            ← Unit {Math.max(1, unit.id - 1)}
          </button>
          <button
            type="button"
            disabled={unit.id >= 12}
            onClick={() => onNavigateUnit(unit.id + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Unit {Math.min(12, unit.id + 1)} →
          </button>
        </div>
      </div>

      {/* Unit Header Card */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <UnitArtwork unitId={unit.id} className="w-16 h-16 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-sky-700">
              Học kỳ {unit.semester} · {unit.code} · {unit.phoneticFocus}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {unit.titleEn}{' '}
              <span className="text-slate-500 font-medium text-lg sm:text-xl">
                — {unit.titleVi}
              </span>
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">{unit.summaryVi}</p>
          </div>
        </div>

        <div className="md:w-56 shrink-0 space-y-2 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Mức độ nắm vững</span>
            <span className="font-mono-code font-bold text-slate-900 tabular-nums">
              {masteryPct}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${masteryPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {learnedWords}/{unit.vocabulary.length} từ · {doneExercises}/{unit.exercises.length} bài tập
          </p>
        </div>
      </section>

      {/* 3-Step Learning Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        {(
          [
            {
              id: 'vocab',
              label: `1. Từ vựng Flashcard (${learnedWords}/${unit.vocabulary.length})`,
              icon: Layers,
            },
            {
              id: 'grammar',
              label: '2. Ngữ pháp & Phát âm',
              icon: BookOpen,
            },
            {
              id: 'practice',
              label: `3. Luyện tập chuẩn đề (${doneExercises}/${unit.exercises.length})`,
              icon: ClipboardCheck,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
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

      {/* Tab Content */}
      <div>
        {activeTab === 'vocab' && (
          <FlashcardDeck
            vocabulary={unit.vocabulary}
            learnedVocabIds={progress.learnedVocabIds}
            soundEnabled={progress.soundEnabled}
            onToggleLearned={onToggleLearnedVocab}
          />
        )}

        {activeTab === 'grammar' && (
          <GrammarPhoneticsPanel
            grammar={unit.grammar}
            phonetics={unit.phonetics}
            onOpenPhoneticsStudio={onOpenPhoneticsStudio}
          />
        )}

        {activeTab === 'practice' && (
          <div className="space-y-6">
            {/* Full Unit Challenge Banner */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-sky-300">
                  Tổng hợp đầy đủ 8 dạng đề + Nghe &amp; Ghép cặp IOE
                </p>
                <h3 className="font-display text-xl font-bold">
                  Luyện toàn bộ {unit.exercises.length} câu hỏi của {unit.code}
                </h3>
                <p className="text-sm text-slate-300">
                  Làm liền mạch từ Ngữ âm, Trọng âm, Trắc nghiệm, Từ loại, Chia động từ, Sửa lỗi sai đến Đọc hiểu &amp; Viết câu.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onStartExercises(`${unit.code}: ${unit.titleEn} — Tổng hợp`, unit.exercises)
                }
                className="px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Làm trọn bộ {unit.code}</span>
              </button>
            </div>

            {/* Individual Skill Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ORDERED_SKILLS.map((skillKey) => {
                const items = unit.exercises.filter((e) => e.type === skillKey);
                if (items.length === 0) return null;
                const meta = SKILL_META[skillKey];
                const completedCount = items.filter((e) =>
                  progress.completedExerciseIds.includes(e.id)
                ).length;
                const allDone = completedCount === items.length;

                return (
                  <button
                    key={skillKey}
                    type="button"
                    onClick={() =>
                      onStartExercises(`${unit.code} · ${meta.shortLabel}`, items)
                    }
                    className="group text-left bg-white border border-slate-200 hover:border-sky-400 rounded-2xl p-5 flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-code text-xs font-bold text-sky-700">
                          {String(meta.pdfGroup).padStart(2, '0')}
                        </span>
                        <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                          {meta.label}
                        </h4>
                        {skillKey === 'listening_choice' && (
                          <Headphones className="w-4 h-4 text-sky-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{meta.description}</p>
                      <p className="text-xs font-medium text-slate-500 pt-1">
                        {items.length} bài tập · Đã đạt{' '}
                        <span
                          className={`font-mono-code font-semibold tabular-nums ${
                            allDone ? 'text-emerald-700' : 'text-slate-700'
                          }`}
                        >
                          {completedCount}/{items.length}
                        </span>
                      </p>
                    </div>

                    <div className="shrink-0">
                      {allDone ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <span className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-sky-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
