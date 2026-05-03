'use client';
import { useState } from 'react';
import type { VerifiedNutrition } from '@/hooks/useNutritionSearch';

interface Props {
  result:    VerifiedNutrition;
  loading?:  boolean;
  onConfirm: (entry: VerifiedNutrition & { mealType: string }) => void;
  onCancel:  () => void;
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

const cardCls     = "mt-0.5 rounded-[10px] border border-primary bg-card p-3 text-foreground";
const inpCls      = "w-full rounded-md border border-border bg-muted px-2 py-1 text-[13px] text-foreground outline-none focus:border-primary box-border";
const labelCls    = "block text-[11px] text-muted-foreground mb-0.5";
const btnPrimCls  = "flex-1 cursor-pointer rounded-md border-none bg-primary px-3 py-[7px] text-[13px] font-medium text-primary-foreground transition-colors hover:opacity-90";
const btnCancelCls = "cursor-pointer rounded-md border border-border bg-transparent px-3 py-[7px] text-[13px] text-muted-foreground transition-colors hover:bg-muted";

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
    <div className={cardCls}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0 truncate text-[13px] font-medium text-foreground">{edited.foodName}</div>
        <span
          className="shrink-0 rounded px-2 py-0.5 text-[11px] font-medium"
          style={{
            background: edited.dataVerified
              ? 'color-mix(in oklch, var(--status-success) 15%, transparent)'
              : 'color-mix(in oklch, var(--status-warning) 15%, transparent)',
            color: edited.dataVerified ? 'var(--status-success)' : 'var(--status-warning)',
          }}
        >
          {edited.dataVerified ? '✓ Verified' : '⚠ Estimated'}
        </span>
      </div>

      {!edited.dataVerified && (
        <p className="mb-1.5 text-[11px]" style={{ color: 'var(--status-warning)' }}>
          {edited.verificationNote}
        </p>
      )}
      <p className="mb-2 text-[11px] text-muted-foreground">
        Source:{' '}
        {edited.sourceUrl ? (
          <a
            href={edited.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            {edited.source}
          </a>
        ) : (
          edited.source
        )}
      </p>

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
          className="w-full cursor-pointer rounded-md border border-border bg-muted px-2 py-[7px] text-[13px] text-foreground outline-none focus:border-primary"
          value={mealType}
          onChange={e => setMealType(e.target.value)}
        >
          {MEAL_TYPES.map(t => (
            <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          className={`${btnPrimCls} disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={loading}
          onClick={() => onConfirm({ ...edited, mealType })}
        >
          {loading ? <><span className="ht-spin" />Saving…</> : 'Add to Log'}
        </button>
        <button type="button" className={btnCancelCls} disabled={loading} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
