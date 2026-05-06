'use client';
import { useState } from 'react';

import type { VerifiedNutrition } from '@/hooks/useNutritionSearch';
import { isAbsoluteHttpUrl } from '@/lib/health-track/nutrition-source-url';

interface Props {
  result:    VerifiedNutrition;
  loading?:  boolean;
  onConfirm: (entry: VerifiedNutrition & { mealType: string }) => void;
  onCancel:  () => void;
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

const inpCls      = "w-full rounded-md border border-border bg-[var(--card2)] px-2 py-1 text-[13px] text-foreground outline-none focus:border-primary box-border";
const labelCls    = "block text-[11px] text-muted-foreground mb-0.5";
const btnPrimCls  = "flex-1 cursor-pointer rounded-[5px] border-none bg-primary px-3 py-[7px] text-[13px] font-bold text-primary-foreground transition-opacity hover:opacity-90";
const btnCancelCls = "cursor-pointer rounded-[5px] border border-border bg-transparent px-3 py-[7px] text-[13px] text-[var(--sub-foreground)] transition-colors hover:bg-muted";

export function FoodReviewCard({ result, loading = false, onConfirm, onCancel }: Props) {
  const [mealType, setMealType] = useState<string>('lunch');
  const [edited,   setEdited]   = useState({ ...result });

  const handleChange = (field: keyof VerifiedNutrition, value: string) => {
    setEdited(prev => ({
      ...prev,
      [field]: ['foodName', 'servingUnit', 'source', 'verificationNote'].includes(field as string)
        ? value
        : Number(value),
    }));
  };

  return (
    <div
      className="mt-1 rounded-[8px] border-2 border-primary p-3.5"
      style={{
        background:
          'color-mix(in oklch, var(--primary) 8%, var(--card2))',
      }}
    >
      <div className="mb-2.5 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-foreground">{edited.foodName}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {edited.servingSize} {edited.servingUnit}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[22px] font-bold leading-none text-primary">{edited.calories}</div>
          <div className="text-[10px] text-muted-foreground">kcal</div>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-1.5">
        {([
          ['Protein', edited.protein, 'var(--chart-1)'],
          ['Carbs', edited.carbs, 'var(--status-warning)'],
          ['Fat', edited.fat, 'var(--status-danger)'],
        ] as const).map(([label, v, c]) => (
          <div key={label} className="rounded-[5px] bg-[var(--card2)] px-1.5 py-2 text-center">
            <div className="text-sm font-bold" style={{ color: c }}>
              {v}g
            </div>
            <div className="mt-0.5 text-[9px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded border border-border bg-[var(--card2)] px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {edited.dataVerified ? 'verified' : 'est.'}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Source:{' '}
            {edited.sourceUrl && isAbsoluteHttpUrl(edited.sourceUrl) ? (
              <a
                href={edited.sourceUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                {edited.source}
              </a>
            ) : (
              edited.source
            )}
          </span>
        </div>
      </div>

      {!edited.dataVerified && (
        <p className="mb-2 text-[11px]" style={{ color: 'var(--status-warning)' }}>
          {edited.verificationNote}
        </p>
      )}

      <div className="mb-2 grid grid-cols-2 gap-1.5">
        {([
          ['Calories (kcal)', 'calories'],
          ['Protein (g)',     'protein'],
          ['Carbs (g)',       'carbs'],
          ['Fat (g)',         'fat'],
        ] as [string, keyof VerifiedNutrition][]).map(([label, field]) => (
          <div key={field}>
            <label className={labelCls}>{label}</label>
            <input
              type="number"
              className={inpCls}
              value={edited[field] as number}
              onChange={e => handleChange(field, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="mb-2">
        <label className={labelCls}>Meal Type</label>
        <select
          className="w-full cursor-pointer rounded-md border border-border bg-[var(--card2)] px-2 py-[7px] text-[13px] text-foreground outline-none focus:border-primary"
          value={mealType}
          onChange={e => setMealType(e.target.value)}
        >
          {MEAL_TYPES.map(t => (
            <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className={`${btnPrimCls} disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={loading}
          onClick={() => onConfirm({ ...edited, mealType })}
        >
          {loading ? <><span className="ht-spin" />Saving…</> : 'Add to log'}
        </button>
        <button type="button" className={btnCancelCls} disabled={loading} onClick={onCancel}>
          Discard
        </button>
      </div>
    </div>
  );
}
