import { useState } from "react";
import { sanitizeInput } from "../lib/sanitize";

const MAX_AMOUNT = 999999;

export function DayEditor({
  date,
  record,
  onSave,
  onDelete,
  onCancel,
}: {
  date: string;
  record: { bet: number; recovery: number } | null;
  onSave: (date: string, bet: number, recovery: number) => void;
  onDelete: (date: string) => void;
  onCancel: () => void;
}) {
  const [bet, setBet] = useState(record ? record.bet : 0);
  const [recovery, setRecovery] = useState(record ? record.recovery : 0);
  return (
    <div className="modal-overlay" aria-label="閉じる" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-field">
          <span className="field-label">投資</span>
          <input
            className="amount-input"
            type="text"
            inputMode="numeric"
            aria-label="投資"
            value={bet}
            onChange={(e) => setBet(sanitizeInput(e.target.value, MAX_AMOUNT))}
          />
        </div>
        <div className="modal-field">
          <span className="field-label">回収</span>
          <input
            className="amount-input"
            type="text"
            inputMode="numeric"
            aria-label="回収"
            value={recovery}
            onChange={(e) =>
              setRecovery(sanitizeInput(e.target.value, MAX_AMOUNT))
            }
          />
        </div>
        <div className="modal-actions">
          <button type="button" aria-label="キャンセル" onClick={onCancel}>
            キャンセル
          </button>
          {record && (
            <button
              type="button"
              aria-label="削除"
              onClick={() => onDelete(date)}
            >
              削除
            </button>
          )}
          <button
            type="button"
            aria-label="保存"
            onClick={() => onSave(date, bet, recovery)}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
