import React, { useState } from "react";

// ダミーデータ例
const CASES = [
  {
    name: "症例A",
    summary: "胸痛を訴える患者。",
    hotline: "123-456-7890",
  },
  {
    name: "症例B",
    summary: "腹痛を訴える患者。",
    hotline: "987-654-3210",
  },
];

// JTASチップのダミーコンポーネント
function JTASChip({ level }) {
  return (
    <span className="px-2 py-1 bg-indigo-200 text-indigo-800 rounded text-xs font-semibold">
      JTAS {level}
    </span>
  );
}

export default function App() {
  // 状態管理
  const [selectedCase, setSelectedCase] = useState(0);
  const [time, setTime] = useState(0);
  const [jtasLevel, setJtasLevel] = useState(3);

  // リスクデータ（例）
  const riskData = {
    phase: "初期",
    currentRisk: 12,
  };

  // 簡単なケース切り替えUI
  const changeCase = () => {
    setSelectedCase((prev) => (prev + 1) % CASES.length);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <button
        onClick={changeCase}
        className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded"
      >
        症例を切り替え
      </button>

      {/* 概要・フェーズ・JTAS・確率・スコア */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-slate-500">症例概要</div>
          <div className="flex items-center gap-2">
            <div className="font-semibold text-slate-800">
              {CASES[selectedCase].name}
            </div>
            <JTASChip level={jtasLevel} />
          </div>
          <div className="text-slate-700 mt-2">{CASES[selectedCase].summary}</div>
          <div className="text-slate-500 text-sm mt-2">
            ホットライン：{CASES[selectedCase].hotline}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">現在フェーズ</div>
            <JTASChip level={jtasLevel} />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600">
            {riskData.phase}
          </div>
          <div className="mt-3 text-sm text-slate-500">経過時間（分）</div>
          <input
            type="number"
            value={time}
            onChange={(e) => setTime(parseInt(e.target.value || "0", 10))}
            className="border rounded px-2 py-1 w-28 text-right"
          />
          <div className="mt-3 text-sm text-slate-500">急変リスク</div>
          <div
            className={`text-2xl font-extrabold ${
              riskData.currentRisk > 15 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {riskData.currentRisk} / 20
          </div>
        </div>

        {/* 3列目があればここに追加 */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-slate-500">その他情報</div>
          <div className="text-slate-700 mt-2">ここに追加情報を表示可能</div>
        </div>
      </div>
    </div>
  );
}
