import React, { useEffect, useMemo, useState } from "react";
import {
  CASES, JTAS_META, effectiveJTAS,
  simulateRiskPhase, evaluateLogs, rubricScore,
  bayesUpdate
} from "./simulationEngine";
import { saveRecord } from "./historyStore";
import HistoryPanel from "./HistoryPanel";

// JTAS色チップ
function JTASChip({ level }) {
  const meta = JTAS_META[level] ?? JTAS_META[3];
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${meta.color}`}
      title={meta.desc}
      aria-label={`JTASレベル ${level}: ${meta.desc}`}
    >
      {meta.label}
    </span>
  );
}

// 事前→事後のバー表示
function ProbBars({ posterior, prior }) {
  const diseases = Object.keys(posterior);
  return (
    <div className="space-y-2">
      {diseases.map((k) => (
        <div key={k}>
          <div className="text-xs text-slate-600 mb-1">
            {labelOf(k)}{" "}
            <span className="ml-2 text-slate-400">
              ({(prior[k]*100).toFixed(0)}% → <b>{(posterior[k]*100).toFixed(0)}%</b>)
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded h-3 overflow-hidden">
            <div className="h-3 bg-indigo-600" style={{ width: ${posterior[k]*100}% }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function labelOf(key) {
  return CASES[key]?.name || ({
    AMI: "急性心筋梗塞",
    AoD: "大動脈解離",
    PE:  "肺血栓塞栓症",
    TPT: "緊張性気胸",
    Boerhaave: "突発性食道破裂",
  }[key] || key);
}

export default function App() {
  const [selectedCase, setSelectedCase] = useState("AoD");
  const [time, setTime] = useState(0);
  const [logs, setLogs] = useState([]);
  const [diagnosis, setDiagnosis] = useState({ confirmed: false, method: "" });
  const [userName, setUserName] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // 事前確率（均等）
  const prior = useMemo(() => ({
    AMI: 0.2, AoD: 0.2, PE: 0.2, TPT: 0.2, Boerhaave: 0.2
  }), []);

  // logs → evidence配列へ
  const evidences = useMemo(() => {
    const arr = [];
    logs.forEach(l => (l.evidence || []).forEach(ev => arr.push(ev)));
    return arr;
  }, [logs]);

  // ベイズ更新
  const posterior = useMemo(() => bayesUpdate(prior, evidences), [prior, evidences]);

  const caseData = CASES[selectedCase];
  const riskData = simulateRiskPhase(logs, time);
  const jtasLevel = effectiveJTAS(caseData.jtas ?? 3, riskData.currentRisk);
  const feedback = evaluateLogs(logs);
  const score = rubricScore(feedback);

  // アクションボタン（症例別）
  const actionButtons = useMemo(() => {
    const btns = [];
    // 初療
    btns.push({ label: "酸素5Lマスクで流します。", add: { tags: ["oxygen"], delaySec: 0 } });
    btns.push({ label: "モニターを装着します。", add: { tags: ["monitor"], delaySec: 0 } });

    if (caseData.actions.essentials.includes("line_pressure")) {
      btns.push({ label: "右上肢18Gで耐圧ラインで確保します。", add: { tags: ["line","pressure"], delaySec: 0 } });
    } else {
      btns.push({ label: "右上肢18Gでラインを確保します。", add: { tags: ["line"], delaySec: 0 } });
    }

    if (caseData.actions.essentials.includes("bloods_ddimer")) {
      btns.push({ label: "採血（D-ダイマー含む）を実施します。", add: { tags: ["bloods","ddimer"], delaySec: 0 } });
    } else if (caseData.actions.essentials.includes("bloods_abg")) {
      btns.push({ label: "採血（血液ガス含む）を実施します。", add: { tags: ["bloods","abg"], delaySec: 0 } });
    } else {
      btns.push({ label: "採血を実施します。", add: { tags: ["bloods"], delaySec: 0 } });
    }

    // 検査と学習用エビデンス
    if (caseData.actions.essentials.includes("ecg")) {
      btns.push({ label: "12誘導心電図を撮影します。", add: { tags: ["ecg"], delaySec: 0 } });
      btns.push({ label: "ECG：ST上昇（＋）", add: { tags: ["ecg"], evidence: [{ key: "ecg_ste", sign: +1 }] } });
      btns.push({ label: "ECG：ST上昇（−）", add: { tags: ["ecg"], evidence: [{ key: "ecg_ste", sign: -1 }] } });
    }
    if (caseData.actions.essentials.includes("echo") || caseData.actions.essentials.includes("echo_rv")) {
      btns.push({ label: "心エコーを実施します。", add: { tags: ["echo"], delaySec: 0 } });
      if (caseData.key === "AoD") {
        btns.push({ label: "Echo：解離フラップ（＋）", add: { tags: ["echo"], evidence: [{ key: "echo_flap", sign: +1 }] } });
      } else {
        btns.push({ label: "Echo：解離フラップ（−）", add: { tags: ["echo"], evidence: [{ key: "echo_flap", sign: -1 }] } });
      }
      if (caseData.key === "PE" || caseData.actions.essentials.includes("echo_rv")) {
        btns.push({ label: "Echo：右心負荷（＋）", add: { tags: ["echo"], evidence: [{ key: "echo_rv_strain", sign: +1 }] } });
        btns.push({ label: "Echo：右心負荷（−）", add: { tags: ["echo"], evidence: [{ key: "echo_rv_strain", sign: -1 }] } });
      }
    }
    if (caseData.actions.essentials.includes("xray")) {
      btns.push({ label: "胸部X線を撮影します。", add: { tags: ["xray"], delaySec: 0 } });
      btns.push({ label: "X線：気胸像（＋）", add: { tags: ["xray"], evidence: [{ key: "xray_pneumothorax", sign: +1 }] } });
      btns.push({ label: "X線：気胸像（−）", add: { tags: ["xray"], evidence: [{ key: "xray_pneumothorax", sign: -1 }] } });
    }

    // 造影安全
    btns.push({ label: "造影剤アレルギーはありますか？", add: { tags: ["check_allergy"], delaySec: 0 } });

    // D-ダイマー
    if (caseData.actions.essentials.includes("bloods_ddimer")) {
      btns.push({ label: "D-ダイマー高値（＋）", add: { tags: ["ddimer"], evidence: [{ key: "ddimer_high", sign: +1 }] } });
      btns.push({ label: "D-ダイマー正常（−）", add: { tags: ["ddimer"], evidence: [{ key: "ddimer_high", sign: -1 }] } });
    }

    // TPT特異
    if (caseData.actions.essentials.includes("needle_decompression")) {
      btns.push({ label: "緊張性気胸疑い → 直ちに穿刺脱気", add: { tags: ["decompression"], delaySec: 0 } });
    }

    // 評価用（遅延・口調）
    btns.push({ label: "（沈黙で操作し遅延…）", add: { delaySec: 420, missingActions: 1, toneScore: 0 } });
    btns.push({ label: "急げ！早く動いて！", add: { tags: ["command"], toneScore: 0 } });

    return btns;
  }, [selectedCase]);

  const addLog = (text, add = {}) => {
    setLogs(prev => [...prev, {
      utterance: text,
      tags: add.tags || [],
      delaySec: add.delaySec || 0,
      missedDifferentials: add.missedDifferentials || 0,
      missingActions: add.missingActions || 0,
      toneScore: add.toneScore ?? 3,
      evidence: add.evidence || []
    }]);
  };

  const confirmDiagnosis = () => {
    if (diagnosis.confirmed) return;
    setDiagnosis({ confirmed: true, method: CASES[selectedCase].actions.definitiveBtn.tag });
    addLog(`【診断確定】${CASES[selectedCase].definitiveText}`, { tags: ["definitive"] });

    // 履歴保存
    const record = {
      user: userName || "未入力",
      case: selectedCase,
      score: score.total,
      feedbackCount: feedback.length,
      evidenceCount: evidences.length,
      posterior: posterior
    };
    saveRecord(record);
  };

  const resetAll = () => {
    setLogs([]);
    setTime(0);
    setDiagnosis({ confirmed: false, method: "" });
  };

  // posteriorの履歴（軽量にリアルタイム遷移可視化に利用可）
  const [history, setHistory] = useState([]);
  useEffect(() => {
    setHistory(h => [...h, posterior]);
  }, [posterior]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">5 Killer Chest Pain 統合シミュレーション</h1>
            <p className="text-slate-500 text-sm">AMI / 大動脈解離 / 肺塞栓 / 緊張性気胸 / 突発性食道破裂</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">症例選択</label>
            <select
              className="border rounded px-2 py-1"
              value={selectedCase}
              onChange={e => { setSelectedCase(e.target.value); resetAll(); }}
            >
              {Object.keys(CASES).map(k => (
                <option key={k} value={k}>{CASES[k].name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="受講者名"
              className="border rounded px-2 py-1 w-32 text-sm"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            <button
              onClick={() => setShowHistory(true)}
              className="text-xs px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded"
            >
              📜 履歴
            </button>
          </div>
        </header>

        {/* 概要・フェーズ・JTAS・確率・スコア */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="text-sm text-slate-500">症例概要</div>
            <div className="flex items-center gap-2">
              <div className="font-semibold text-slate-800">{CASES[selectedCase].name}</div>
              <JTASChip level={jtasLevel} />
            </div>
            <div className="text-slate-700 mt-2">{CASES[selectedCase].summary}</div>
            <div className="text-slate-500 text-sm mt-2">ホットライン：{CASES[selectedCase].hotline}</div>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">現在フェーズ</div>
              <JTASChip level={jtasLevel} />
            </div>
            <div className="text-2xl font-extrabold text-indigo-600">{riskData.phase}</div>
            <div className="mt-3 text-sm text-slate-500">経過時間（分）</div>
            <input
              type="number"
              value={time}
              onChange={(e) => setTime(parseInt(e.target.value || "0", 10))}
              className="border rounded px-2 py-1 w-28 text-right"
            />
            <div className="mt-3 text-sm text-slate-500">急変リスク</div>
            <div className={`text-2xl font-extrabold ${riskData.currentRisk > 15 ? "text-rose-600" : "text-emerald-600"}`}>
              {riskData.currentRisk} / 20
            </div>
          </div>