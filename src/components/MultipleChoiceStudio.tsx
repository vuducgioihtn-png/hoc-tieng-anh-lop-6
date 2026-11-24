import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Layers,
  Lightbulb,
  Play,
  Radar,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  ALL_UNITS,
  buildMultipleChoiceMix,
  getAllMultipleChoiceExercises,
  getMultipleChoiceByUnit,
} from '../data/curriculum';
import {
  MC_BLUEPRINTS,
  MC_CATEGORY_LABELS,
  MC_KEYWORD_RADAR,
  McVisualBlueprint,
} from '../data/multipleChoiceBank';
import { Exercise, MultipleChoiceCategory, StudentProgress } from '../types';
import { speakEnglish } from '../utils/speech';

interface MultipleChoiceStudioProps {
  progress: StudentProgress;
  onStartPractice: (title: string, exercises: Exercise[]) => void;
}

const ACCENT_MAP = {
  sky: {
    card: 'bg-sky-50/60 border-sky-200',
    head: 'border-sky-200/80',
    title: 'text-sky-800',
    formula: 'bg-white border-sky-200 text-sky-900',
  },
  emerald: {
    card: 'bg-emerald-50/60 border-emerald-200',
    head: 'border-emerald-200/80',
    title: 'text-emerald-800',
    formula: 'bg-white border-emerald-200 text-emerald-900',
  },
  amber: {
    card: 'bg-amber-50/60 border-amber-200',
    head: 'border-amber-200/80',
    title: 'text-amber-900',
    formula: 'bg-white border-amber-200 text-amber-950',
  },
  rose: {
    card: 'bg-rose-50/60 border-rose-200',
    head: 'border-rose-200/80',
    title: 'text-rose-800',
    formula: 'bg-white border-rose-200 text-rose-900',
  },
};

function renderHighlightedExample(sentence: string, highlight: string) {
  const idx = sentence.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx < 0) return <span>{sentence}</span>;
  return (
    <span>
      {sentence.slice(0, idx)}
      <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-900 font-bold">
        {sentence.slice(idx, idx + highlight.length)}
      </span>
      {sentence.slice(idx + highlight.length)}
    </span>
  );
}

const VisualMcDiagram: React.FC<{ blueprint: McVisualBlueprint }> = ({ blueprint }) => {
  if (blueprint.visualKind === 'four_verbs') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { verb: 'PLAY', cue: 'Bóng · Bài · Nhạc cụ', sample: 'football · cards · flute', tone: 'bg-sky-50 border-sky-200 text-sky-900' },
          { verb: 'DO', cue: 'Võ · Bài tập · Việc nhà', sample: 'judo · chores · homework', tone: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
          { verb: 'HAVE', cue: 'Bữa ăn · Nghỉ · Đau đầu', sample: 'breakfast · break · chat', tone: 'bg-amber-50 border-amber-200 text-amber-950' },
          { verb: 'STUDY', cue: 'Môn học · Từ vựng', sample: 'English · History · vocab', tone: 'bg-rose-50 border-rose-200 text-rose-900' },
        ].map((box) => (
          <div key={box.verb} className={`rounded-xl border p-3.5 space-y-1 ${box.tone}`}>
            <p className="font-mono-code text-base font-bold">{box.verb}</p>
            <p className="text-xs font-semibold leading-snug">{box.cue}</p>
            <p className="text-[11px] opacity-80">{box.sample}</p>
          </div>
        ))}
      </div>
    );
  }

  if (blueprint.visualKind === 'tense_split') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display font-bold text-sm text-sky-950">Hiện tại đơn (Lặp lại đều đặn)</p>
            <span className="font-mono-code text-xs font-bold text-sky-700">V / V(s,es)</span>
          </div>
          <div className="flex items-center gap-1.5 py-1">
            {['T2', 'T3', 'T4', 'T5', 'T6'].map((d) => (
              <span
                key={d}
                className="flex-1 text-center py-1 rounded-md bg-white border border-sky-200 text-[11px] font-mono-code font-bold text-sky-700"
              >
                {d}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-600">
            Từ khóa: <strong>always, usually, often, sometimes, every...</strong>
          </p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display font-bold text-sm text-emerald-950">Hiện tại tiếp diễn (Đang xảy ra)</p>
            <span className="font-mono-code text-xs font-bold text-emerald-700">am/is/are + V-ing</span>
          </div>
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-2 bg-emerald-200 rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-emerald-600 rounded-full" />
            </div>
            <span className="font-mono-code text-[11px] font-bold text-emerald-800 shrink-0">
              NGAY LÚC NÀY
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Từ khóa: <strong>now, at the moment, right now, On Saturday (kế hoạch)</strong>
          </p>
        </div>
      </div>
    );
  }

  if (blueprint.visualKind === 'prepositions') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {[
          { prep: 'ON', desc: 'Bề mặt phẳng & Ngày', ex: 'on the wall · on the ceiling · on Sept 5th' },
          { prep: 'IN', desc: 'Bên trong · Giữa phòng', ex: 'in Ha Noi · in the middle of · in the kitchen' },
          { prep: 'AT', desc: 'Điểm chốt · Giờ ra chơi', ex: 'at the traffic lights · at break time' },
          { prep: 'IN FRONT OF / UNDER', desc: 'Phía trước · Phía dưới', ex: 'in front of the TV · under a tree' },
        ].map((item) => (
          <div key={item.prep} className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
            <p className="font-mono-code text-sm font-bold text-sky-700">{item.prep}</p>
            <p className="text-xs font-semibold text-slate-800">{item.desc}</p>
            <p className="text-[11px] text-slate-500 leading-snug">{item.ex}</p>
          </div>
        ))}
      </div>
    );
  }

  if (blueprint.visualKind === 'comparison') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-1.5">
          <p className="font-mono-code text-xs font-bold text-sky-700">BẬC 1 · SO SÁNH BẰNG</p>
          <p className="font-display font-bold text-sm text-slate-900">as + adj/adv + as</p>
          <p className="text-xs text-slate-600">Phủ định: not so/as ... as</p>
        </div>
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 sm:py-5 space-y-1.5">
          <p className="font-mono-code text-xs font-bold text-amber-800">BẬC 2 · SO SÁNH HƠN (2 vật)</p>
          <p className="font-display font-bold text-sm text-slate-900">adj-er / more + adj + THAN</p>
          <p className="text-xs text-slate-600">good → better · bad → worse</p>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 sm:py-6 space-y-1.5">
          <p className="font-mono-code text-xs font-bold text-emerald-800">BẬC 3 · SO SÁNH NHẤT (3+ vật)</p>
          <p className="font-display font-bold text-sm text-slate-900">THE + adj-est / THE MOST + adj</p>
          <p className="text-xs text-slate-600">good → the best · Vietnam's most...</p>
        </div>
      </div>
    );
  }

  if (blueprint.visualKind === 'modals') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 space-y-1">
          <p className="font-mono-code text-xs font-bold text-rose-700">ĐÈN ĐỎ · NỘI QUY / CẤM</p>
          <p className="font-display font-bold text-base text-rose-950">MUST / MUSTN'T + V</p>
          <p className="text-xs text-rose-900/80">against the rules · regulations · alone</p>
        </div>
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-1">
          <p className="font-mono-code text-xs font-bold text-amber-800">ĐÈN VÀNG · LỜI KHUYÊN</p>
          <p className="font-display font-bold text-base text-amber-950">SHOULD / SHOULDN'T + V</p>
          <p className="text-xs text-amber-900/80">nên dọn nhà · không nên làm vỡ đồ ngày Tết</p>
        </div>
        <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-1">
          <p className="font-mono-code text-xs font-bold text-sky-700">TƯƠNG LAI · DỰ ĐỊNH</p>
          <p className="font-display font-bold text-base text-sky-950">WILL / WON'T + V (be)</p>
          <p className="text-xs text-sky-900/80">tomorrow · next birthday · next Sunday</p>
        </div>
      </div>
    );
  }

  if (blueprint.visualKind === 'conjunctions_wh') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-1.5">
          <p className="font-mono-code text-xs font-bold text-sky-700">NGUYÊN NHÂN ↔ KẾT QUẢ</p>
          <p className="font-display font-bold text-sm text-sky-950">BECAUSE (vì) · SO (nên)</p>
          <p className="text-xs text-slate-600 leading-snug">
            Vế lý do dùng <strong>because</strong> · Vế kết quả (sau dấu phẩy) dùng <strong>so</strong>
          </p>
        </div>
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-1.5">
          <p className="font-mono-code text-xs font-bold text-amber-800">TƯƠNG PHẢN · TRÁI NGƯỢC</p>
          <p className="font-display font-bold text-sm text-amber-950">BUT · ALTHOUGH</p>
          <p className="text-xs text-slate-600 leading-snug">
            Chỉ chọn <strong>1 trong 2</strong> — không bao giờ dùng cả <em>Although</em> và <em>but</em>!
          </p>
        </div>
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-1.5">
          <p className="font-mono-code text-xs font-bold text-emerald-800">SOI CÂU ĐÁP → CHỌN WH-</p>
          <p className="font-display font-bold text-sm text-emerald-950">How long · How often</p>
          <p className="text-xs text-slate-600 leading-snug">
            <em>Half an hour</em> → <strong>How long</strong> · <em>Twice a week</em> → <strong>How often</strong>
          </p>
        </div>
      </div>
    );
  }

  if (blueprint.visualKind === 'past_vs_perfect') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display font-bold text-sm text-amber-950">Quá khứ đơn (Đã chấm dứt)</p>
            <span className="font-mono-code text-xs font-bold text-amber-800">V2/ed · Did + V</span>
          </div>
          <div className="flex items-center gap-2 py-1">
            <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-mono-code text-[11px] font-bold">
              QUÁ KHỨ
            </span>
            <div className="flex-1 h-0.5 bg-amber-300 border-t border-dashed border-amber-400" />
            <span className="text-[11px] font-mono-code font-semibold text-slate-400">HIỆN TẠI</span>
          </div>
          <p className="text-xs text-slate-600">
            Mốc rõ: <strong>yesterday, last Sunday, 5 minutes ago</strong> (Sau Did/Didn&apos;t → V nguyên!)
          </p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display font-bold text-sm text-emerald-950">Hiện tại hoàn thành (Tới nay)</p>
            <span className="font-mono-code text-xs font-bold text-emerald-700">have/has + V3</span>
          </div>
          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-2 bg-emerald-200 rounded-full overflow-hidden">
              <div className="w-full h-full bg-emerald-600 rounded-full" />
            </div>
            <span className="font-mono-code text-[11px] font-bold text-emerald-800 shrink-0">
              QUÁ KHỨ → NAY
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Dấu hiệu: <strong>since + mốc, for + khoảng, ever, yet, so far</strong> (+ What a nice day!)
          </p>
        </div>
      </div>
    );
  }

  if (blueprint.visualKind === 'conditional_type1') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
        <div className="sm:col-span-5 bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-1">
          <p className="font-mono-code text-[11px] font-bold text-emerald-800">
            VẾ ĐIỀU KIỆN (KHÔNG CÓ WILL)
          </p>
          <p className="font-display font-bold text-sm text-emerald-950">
            If / Unless + S + V(s/es)
          </p>
          <p className="text-xs text-slate-600">
            Chia <strong>Hiện tại đơn</strong> · <em>Unless = If ... not</em> (V khẳng định)
          </p>
        </div>
        <div className="sm:col-span-1 flex items-center justify-center">
          <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 sm:rotate-0" />
        </div>
        <div className="sm:col-span-5 bg-sky-50/80 border border-sky-200 rounded-xl p-3.5 space-y-1">
          <p className="font-mono-code text-[11px] font-bold text-sky-800">
            VẾ KẾT QUẢ (TƯƠNG LAI ĐƠN)
          </p>
          <p className="font-display font-bold text-sm text-sky-950">
            S + will / won&apos;t / can + V
          </p>
          <p className="text-xs text-slate-600">
            3Rs Xanh: <strong>reduce</strong> (giảm) · <strong>reuse</strong> (dùng lại) · <strong>recycle</strong> (tái chế)
          </p>
        </div>
      </div>
    );
  }

  if (blueprint.visualKind === 'ability_timeline') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-1.5">
          <p className="font-mono-code text-xs font-bold text-amber-800">1. QUÁ KHỨ (2 years ago)</p>
          <p className="font-display font-bold text-base text-amber-950">COULD / COULDN&apos;T + V</p>
          <p className="text-xs text-slate-600">when he was 6 · at primary school</p>
        </div>
        <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-1.5">
          <p className="font-mono-code text-xs font-bold text-sky-700">2. HIỆN TẠI · PHỎNG ĐOÁN</p>
          <p className="font-display font-bold text-base text-sky-950">CAN / MIGHT + V</p>
          <p className="text-xs text-slate-600">now → <strong>can</strong> · chưa chắc 50/50 → <strong>might</strong></p>
        </div>
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 space-y-1.5">
          <p className="font-mono-code text-xs font-bold text-rose-700">3. TƯƠNG LAI (in the future)</p>
          <p className="font-display font-bold text-base text-rose-950">WILL BE ABLE TO + V</p>
          <p className="text-xs text-slate-600">Nhớ đủ 4 chữ + <strong>TO</strong> (không dùng can be able to!)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
        <p className="font-mono-code text-xs font-bold text-sky-700">HỎI / LỜI MỜI</p>
        <p className="text-sm font-semibold text-slate-900">&quot;Would you like to come for dinner?&quot;</p>
        <p className="text-sm font-semibold text-slate-900">&quot;Shall we go to the museum?&quot;</p>
      </div>
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1">
        <p className="font-mono-code text-xs font-bold text-emerald-800">PHẢN XẠ ĐÁP CHUẨN</p>
        <p className="text-sm font-semibold text-emerald-950">→ &quot;I&apos;d love to. Thanks.&quot;</p>
        <p className="text-sm font-semibold text-emerald-950">→ &quot;Good idea!&quot;</p>
      </div>
    </div>
  );
};

export const MultipleChoiceStudio: React.FC<MultipleChoiceStudioProps> = ({
  progress,
  onStartPractice,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'blueprints' | 'radar' | 'drills'>('blueprints');
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>('hk2-conjunctions-wh');
  const [radarFilter, setRadarFilter] = useState<'all' | MultipleChoiceCategory>('all');
  const [drillSemester, setDrillSemester] = useState<'all' | 2 | 1>('all');

  const selectedBlueprint = useMemo(
    () => MC_BLUEPRINTS.find((b) => b.id === selectedBlueprintId) ?? MC_BLUEPRINTS[0],
    [selectedBlueprintId]
  );

  const hk2Blueprints = useMemo(
    () => MC_BLUEPRINTS.filter((b) => b.id.startsWith('hk2-')),
    []
  );
  const hk1Blueprints = useMemo(
    () => MC_BLUEPRINTS.filter((b) => !b.id.startsWith('hk2-')),
    []
  );

  const allMc = useMemo(() => getAllMultipleChoiceExercises(), []);
  const sem1Mc = useMemo(() => getAllMultipleChoiceExercises(1), []);
  const sem2Mc = useMemo(() => getAllMultipleChoiceExercises(2), []);
  const completedMcCount = useMemo(
    () => allMc.filter((e) => progress.completedExerciseIds.includes(e.id)).length,
    [allMc, progress.completedExerciseIds]
  );

  const filteredUnits = useMemo(() => {
    if (drillSemester === 'all') return ALL_UNITS;
    return ALL_UNITS.filter((u) => u.semester === drillSemester);
  }, [drillSemester]);

  const filteredRadar = useMemo(() => {
    if (radarFilter === 'all') return MC_KEYWORD_RADAR;
    return MC_KEYWORD_RADAR.filter((r) => r.category === radarFilter);
  }, [radarFilter]);

  return (
    <div className="space-y-7">
      {/* Hero Overview */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
            Phòng Trắc Nghiệm Trực Quan · Chuẩn bộ đề PDF Học kỳ 1 (Unit 1–6) &amp; Học kỳ 2 (Unit 7–12)
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
            Soi đúng từ khóa trong 3 giây, chọn chuẩn Trắc nghiệm Ngữ pháp &amp; Từ vựng
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Học bằng <strong className="text-slate-900">{MC_BLUEPRINTS.length} sơ đồ quyết định màu trực quan</strong>{' '}
            (gồm 4 sơ đồ mới cho HK2: Liên từ, Quá khứ đơn vs HTHT, Điều kiện loại 1, Might/Could/Will be able to),
            tra cứu Ra-đa {MC_KEYWORD_RADAR.length} dấu hiệu và luyện kho{' '}
            <strong className="text-slate-900">{allMc.length} câu Trắc nghiệm chuẩn PDF</strong>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
          <div className="flex items-center gap-5 text-sm">
            <div>
              <p className="text-xs text-slate-500">Đã chinh phục</p>
              <p className="font-display text-xl font-bold text-slate-900 tabular-nums">
                {completedMcCount}/{allMc.length}{' '}
                <span className="text-xs font-normal text-slate-500">câu</span>
              </p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-xs text-slate-500">Kho đề HK2 PDF</p>
              <p className="font-display text-xl font-bold text-sky-700 tabular-nums">
                {sem2Mc.length}{' '}
                <span className="text-xs font-normal text-slate-500">câu</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Thi thử 20 câu Trắc nghiệm Học kỳ 2 (Unit 7–12)',
                  buildMultipleChoiceMix(2, 20)
                )
              }
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Thi thử 20 câu HK2</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Thi thử 20 câu Trắc nghiệm Học kỳ 1 (Unit 1–6)',
                  buildMultipleChoiceMix(1, 20)
                )
              }
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-sky-400 text-slate-800 text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Thi thử 20 câu HK1</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3 Sub-Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        {(
          [
            {
              id: 'blueprints',
              label: `1. ${MC_BLUEPRINTS.length} Sơ đồ Chọn nhanh 3 giây`,
              icon: Layers,
            },
            {
              id: 'radar',
              label: `2. Ra-đa Từ khóa & Công thức (${MC_KEYWORD_RADAR.length} dấu hiệu)`,
              icon: Radar,
            },
            {
              id: 'drills',
              label: `3. Kho luyện đề Trắc nghiệm (${allMc.length} câu)`,
              icon: Sparkles,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
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

      {/* TAB 1: 10 VISUAL DECISION BLUEPRINTS */}
      {activeSubTab === 'blueprints' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Blueprint Selector Grouped by Semester */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700 px-1">
                Học kỳ 2 · Unit 7–12 ({hk2Blueprints.length} sơ đồ mới)
              </p>
              {hk2Blueprints.map((bp, idx) => {
                const active = bp.id === selectedBlueprint.id;
                return (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => setSelectedBlueprintId(bp.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      active
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-white border-slate-200 hover:border-sky-400 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-mono-code text-xs font-bold ${
                          active ? 'text-sky-300' : 'text-sky-700'
                        }`}
                      >
                        HK2 · Sơ đồ {idx + 1} · {bp.unitRange.replace(' · HK2', '')}
                      </span>
                      <ArrowRight
                        className={`w-4 h-4 shrink-0 ${active ? 'text-sky-300' : 'text-slate-400'}`}
                      />
                    </div>
                    <p className="font-display font-bold text-sm mt-1 leading-snug">
                      {bp.shortTitle}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                Học kỳ 1 · Unit 1–6 ({hk1Blueprints.length} sơ đồ nền tảng)
              </p>
              {hk1Blueprints.map((bp, idx) => {
                const active = bp.id === selectedBlueprint.id;
                return (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => setSelectedBlueprintId(bp.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      active
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-white border-slate-200 hover:border-sky-400 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-mono-code text-xs font-bold ${
                          active ? 'text-sky-300' : 'text-slate-600'
                        }`}
                      >
                        HK1 · Sơ đồ {idx + 1} · {bp.unitRange}
                      </span>
                      <ArrowRight
                        className={`w-4 h-4 shrink-0 ${active ? 'text-sky-300' : 'text-slate-400'}`}
                      />
                    </div>
                    <p className="font-display font-bold text-sm mt-1 leading-snug">
                      {bp.shortTitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Interactive Stage */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-sky-700">
                  Trọng tâm {selectedBlueprint.unitRange}
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {selectedBlueprint.title}
                </h2>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {selectedBlueprint.headline}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onStartPractice(
                    `Chuyên đề: ${selectedBlueprint.shortTitle}`,
                    buildMultipleChoiceMix(selectedBlueprint.category, 10)
                  )
                }
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 self-start transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Luyện ngay 10 câu</span>
              </button>
            </div>

            {/* Domain-Specific Visual Diagram */}
            <VisualMcDiagram blueprint={selectedBlueprint} />

            {/* Mnemonic & Trap Warning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                  <strong className="font-semibold block mb-0.5">Mẹo nhớ 3 giây:</strong>
                  {selectedBlueprint.mnemonic}
                </div>
              </div>

              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-rose-950 leading-relaxed">
                  <strong className="font-semibold block mb-0.5">Bẫy hay mất điểm:</strong>
                  {selectedBlueprint.trapWarning}
                </div>
              </div>
            </div>

            {/* Color-Coded Formula Columns with Clickable Audio Examples */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedBlueprint.columns.map((col) => {
                const style = ACCENT_MAP[col.accent];
                return (
                  <div key={col.label} className={`border rounded-xl p-4 space-y-3 ${style.card}`}>
                    <div className={`pb-2.5 border-b ${style.head} space-y-1.5`}>
                      <h3 className={`font-display font-bold text-sm sm:text-base ${style.title}`}>
                        {col.label}
                      </h3>
                      <p
                        className={`font-mono-code text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${style.formula}`}
                      >
                        {col.formula}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {col.items.map((item) => (
                        <button
                          key={item.phrase}
                          type="button"
                          onClick={() => speakEnglish(item.example, { rate: 0.9 })}
                          className="w-full text-left bg-white border border-slate-200 hover:border-sky-400 rounded-xl p-3 flex items-start justify-between gap-2.5 transition-colors group"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <p className="font-display font-bold text-sm text-slate-900">
                              {item.phrase}
                            </p>
                            <p className="text-xs text-slate-600">{item.meaning}</p>
                            <p className="text-xs text-sky-800 font-medium pt-0.5">
                              “{item.example}”
                            </p>
                          </div>
                          <Volume2 className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0 mt-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KEYWORD SCAN RADAR */}
      {activeSubTab === 'radar' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: 'Tất cả dấu hiệu' },
                { id: 'collocation', label: MC_CATEGORY_LABELS.collocation },
                { id: 'tense', label: MC_CATEGORY_LABELS.tense },
                { id: 'preposition', label: MC_CATEGORY_LABELS.preposition },
                { id: 'comparison', label: MC_CATEGORY_LABELS.comparison },
                { id: 'modal', label: MC_CATEGORY_LABELS.modal },
                { id: 'communication', label: MC_CATEGORY_LABELS.communication },
                { id: 'vocabulary', label: MC_CATEGORY_LABELS.vocabulary },
              ] as const
            ).map((f) => {
              const active = radarFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRadarFilter(f.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors ${
                    active
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-sky-400'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRadar.map((row) => (
              <div
                key={row.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-sky-700">{row.categoryLabel}</span>
                    <Compass className="w-4 h-4 text-slate-400" />
                  </div>

                  {/* 2-Step Visual Scan Arrow */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                        1. Nhìn thấy từ khóa
                      </p>
                      <p className="font-mono-code text-xs sm:text-sm font-bold text-amber-950 mt-1">
                        {row.signal}
                      </p>
                    </div>

                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                        2. Chốt ngay đáp án
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-emerald-950 mt-1">
                        {row.action}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => speakEnglish(row.example, { rate: 0.9 })}
                  className="w-full text-left bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl p-3.5 flex items-start justify-between gap-3 transition-colors group"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {renderHighlightedExample(row.example, row.exampleHighlight)}
                    </p>
                    <p className="text-xs text-slate-600">{row.exampleVi}</p>
                  </div>
                  <Volume2 className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0 mt-0.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: UNIT-BY-UNIT PDF MULTIPLE CHOICE DRILL BANK */}
      {activeSubTab === 'drills' && (
        <div className="space-y-6">
          {/* 4 Specialty Mix Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Thi thử 20 câu Trắc nghiệm Học kỳ 2 (Unit 7–12)',
                  buildMultipleChoiceMix(2, 20)
                )
              }
              className="text-left p-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white space-y-2 transition-colors"
            >
              <p className="text-xs font-semibold text-sky-300">Đề tổng hợp HK2 · Mới</p>
              <h3 className="font-display font-bold text-base">20 câu Trắc nghiệm HK2</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Trộn đều từ kho {sem2Mc.length} câu chuẩn đề PDF Unit 7–12.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Thi thử 20 câu Trắc nghiệm Học kỳ 1 (Unit 1–6)',
                  buildMultipleChoiceMix(1, 20)
                )
              }
              className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 space-y-2 transition-colors"
            >
              <p className="text-xs font-semibold text-sky-700">Đề tổng hợp HK1</p>
              <h3 className="font-display font-bold text-base text-slate-900">
                20 câu Trắc nghiệm HK1
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ôn chắc kho {sem1Mc.length} câu chuẩn đề PDF Unit 1–6.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Chuyên đề Thì, Điều kiện Loại 1 & Cụm động từ',
                  buildMultipleChoiceMix(['tense', 'collocation'], 15)
                )
              }
              className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 space-y-2 transition-colors"
            >
              <p className="text-xs font-semibold text-emerald-700">Chuyên đề Động từ &amp; Thì</p>
              <h3 className="font-display font-bold text-base text-slate-900">
                15 câu Thì &amp; Điều kiện
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hiện tại đơn/tiếp diễn, Quá khứ đơn, HTHT &amp; Câu điều kiện If/Unless.
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                onStartPractice(
                  'Chuyên đề Khuyết thiếu, So sánh & Giao tiếp',
                  buildMultipleChoiceMix(['modal', 'comparison', 'communication'], 15)
                )
              }
              className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 space-y-2 transition-colors"
            >
              <p className="text-xs font-semibold text-amber-800">Chuyên đề Ứng dụng</p>
              <h3 className="font-display font-bold text-base text-slate-900">
                15 câu Khuyết thiếu &amp; Liên từ
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Might/Could/Will be able to, Must/Should, So sánh, Liên từ &amp; Wh-.
              </p>
            </button>
          </div>

          {/* 12 Units Grid with Semester Filter */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-display font-bold text-lg text-slate-900">
                Luyện đề Trắc nghiệm chi tiết theo từng Unit (Unit 1 – Unit 12)
              </h3>
              <div className="inline-flex items-center bg-white border border-slate-200 rounded-xl p-1 self-start">
                {(
                  [
                    { id: 'all', label: 'Tất cả 12 Unit' },
                    { id: 2, label: 'Học kỳ 2 (7–12)' },
                    { id: 1, label: 'Học kỳ 1 (1–6)' },
                  ] as const
                ).map((seg) => {
                  const active = drillSemester === seg.id;
                  return (
                    <button
                      key={String(seg.id)}
                      type="button"
                      onClick={() => setDrillSemester(seg.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {seg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUnits.map((unit) => {
                const items = getMultipleChoiceByUnit(unit.id);
                if (items.length === 0) return null;
                const done = items.filter((e) =>
                  progress.completedExerciseIds.includes(e.id)
                ).length;
                const pct = Math.round((done / items.length) * 100);
                const allDone = done === items.length;

                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() =>
                      onStartPractice(`${unit.code}: ${unit.titleEn} · Trắc nghiệm`, items)
                    }
                    className="group text-left bg-white border border-slate-200 hover:border-sky-400 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono-code text-xs font-bold text-sky-700">
                          {unit.code} · HK{unit.semester}
                        </span>
                        {allDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <span className="font-mono-code text-xs font-semibold text-slate-500 tabular-nums">
                            {done}/{items.length} câu
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-sky-700 transition-colors">
                        {unit.titleEn}
                      </h4>
                      <p className="text-xs text-slate-600">{unit.grammarFocus}</p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-sky-700 pt-1">
                        <span>Luyện {items.length} câu Trắc nghiệm</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
