import React from 'react';
import { BookCheck, CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';
import { getExerciseById, getUnitById } from '../data/curriculum';
import { Exercise, MistakeRecord, SKILL_META } from '../types';

interface MistakeNotebookProps {
  mistakes: MistakeRecord[];
  onRetryAll: (title: string, exercises: Exercise[]) => void;
  onRemoveMistake: (exerciseId: string) => void;
  onGoRoadmap: () => void;
}

export const MistakeNotebook: React.FC<MistakeNotebookProps> = ({
  mistakes,
  onRetryAll,
  onRemoveMistake,
  onGoRoadmap,
}) => {
  const validItems = mistakes
    .map((m) => ({ record: m, exercise: getExerciseById(m.exerciseId) }))
    .filter((item): item is { record: MistakeRecord; exercise: Exercise } => Boolean(item.exercise));

  const getExercisePromptPreview = (ex: Exercise): string => {
    switch (ex.type) {
      case 'pronunciation':
        return `Ngữ âm: ${ex.options.map((o) => o.word).join(' / ')}`;
      case 'stress':
        return `Trọng âm: ${ex.options.map((o) => o.word).join(' / ')}`;
      case 'multiple_choice':
        return ex.sentence;
      case 'word_form':
        return `${ex.sentenceBefore}(${ex.rootWord})${ex.sentenceAfter}`;
      case 'verb_form':
        return `${ex.sentenceBefore}(${ex.baseVerb})${ex.sentenceAfter}`;
      case 'correction':
        return ex.segments.map((s) => s.text).join('');
      case 'reading':
        return `Đọc hiểu: ${ex.title}`;
      case 'writing_rearrange':
        return `Sắp xếp câu: ${ex.vietnameseMeaning}`;
      case 'listening_choice':
        return `Nghe hiểu: ${ex.question}`;
      case 'matching':
        return `Ghép cặp: ${ex.pairs.map((p) => p.left).join(', ')}`;
    }
  };

  if (validItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Sổ tay câu sai đang trống sạch!
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">
              Mỗi khi em làm nhầm một câu trong bài tập Unit hoặc Đấu trường IOE, câu đó sẽ tự động được lưu tại đây kèm lời giải để em ôn lại.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoRoadmap}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm transition-colors"
          >
            Quay lại Lộ trình 12 Unit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <BookCheck className="w-5 h-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Sổ tay câu sai ({validItems.length} câu cần ôn)
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Làm đúng lại câu hỏi bất kỳ để tự động xóa khỏi danh sách câu sai!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            onRetryAll(
              `Ôn tập ${validItems.length} câu trong Sổ tay câu sai`,
              validItems.map((v) => v.exercise)
            )
          }
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Làm lại tất cả câu sai</span>
        </button>
      </div>

      <div className="space-y-3.5">
        {validItems.map(({ record, exercise }) => {
          const unit = getUnitById(exercise.unitId);
          const skill = SKILL_META[exercise.type];
          return (
            <div
              key={record.exerciseId}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <p className="text-xs font-semibold text-slate-500">
                  <span className="text-sky-700">{unit.code}: {unit.titleEn}</span> · {skill.shortLabel}
                </p>
                <p className="font-display font-bold text-base text-slate-900">
                  {getExercisePromptPreview(exercise)}
                </p>
                <p className="text-xs text-rose-700">
                  Lần trước em trả lời: <strong>{record.wrongAnswer}</strong>
                </p>
                <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200/80 rounded-xl p-3 leading-relaxed">
                  <strong>Giải thích chuẩn: </strong>
                  {exercise.explanation}
                </p>
              </div>

              <div className="flex sm:flex-col items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onRetryAll(`Ôn lại · ${unit.code} · ${skill.shortLabel}`, [exercise])}
                  className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveMistake(record.exerciseId)}
                  title="Đã hiểu, bỏ khỏi sổ tay"
                  className="px-3 py-2 rounded-xl text-slate-500 hover:text-rose-700 hover:bg-rose-50 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bỏ qua</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
