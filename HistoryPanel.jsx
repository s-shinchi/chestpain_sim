import React, { useMemo } from "react";
import { loadHistory, clearHistory } from "./historyStore";
import { CASES } from "./simulationEngine";

export default function HistoryPanel({ onClose }) {
  const history = loadHistory().reverse();
  const avgScore = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.round(history.reduce((a, b) => a + (b.score || 0), 0) / history.length);
  }, [history]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-4xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">受講履歴（ローカル保存）</h2>
          <button onClick={onClose} className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300">閉じる</button>
        </div>

        <div className="mb-4">
          <p className="text-slate-700">総回数：{history.length} 回　平均スコア：<b>{avgScore}</b> 点</p>
          <button
            onClick={() => { clearHistory(); onClose(); }}
            className="text-sm text-rose-600 underline"
          >
            履歴をすべて削除
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-slate-500">まだ履歴がありません。</p>
        ) : (
          <table className="w-full text-sm border">
            <thead className="bg-slate-100">
              <tr>
                <th className="border px-2 py-1">日時</th>
                <th className="border px-2 py-1">受講者</th>
                <th className="border px-2 py-1">症例</th>
                <th className="border px-2 py-1">スコア</th>
                <th className="border px-2 py-1">改善提案数</th>
                <th className="border px-2 py-1">証拠数</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r, i) => (
                <tr key={i} className="text-center hover:bg-slate-50">
                  <td className="border px-2 py-1 text-slate-600">{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="border px-2 py-1">{r.user || "-"}</td>
                  <td className="border px-2 py-1">{CASES[r.case]?.name || r.case}</td>
                  <td className="border px-2 py-1">{r.score}</td>
                  <td className="border px-2 py-1">{r.feedbackCount}</td>
                  <td className="border px-2 py-1">{r.evidenceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}