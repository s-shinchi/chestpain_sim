// 5 Killer Chest Pain: AMI / AoD / PE / TPT / Boerhaave
export const CASES = {
  AMI: {
    key: "AMI",
    name: "急性心筋梗塞（AMI）",
    summary: "胸骨後部の重圧感・冷汗・悪心、左肩〜左腕に放散。既往：高血圧・糖尿病・喫煙歴。",
    hotline: "ST上昇疑い、BP 96/58, HR 110, SpO₂ 94%。",
    jtas: 2,
    actions: {
      essentials: ["oxygen","monitor","line","bloods","ecg","echo"],
      definitiveBtn: { label: "心カテで確定（PCI準備）", tag: "cath" }
    },
    definitiveText: "心カテでSTEMI確定 → 緊急PCIへ。"
  },
  AoD: {
    key: "AoD",
    name: "大動脈解離（Stanford A）",
    summary: "裂けるような痛み、背部放散、上肢血圧左右差、蒼白・冷汗。",
    hotline: "右100/60 左70/50, HR108, SpO₂95%。",
    jtas: 1,
    actions: {
      essentials: ["oxygen","monitor","line_pressure","bloods","echo"],
      definitiveBtn: { label: "造影CTで確定（心外コール）", tag: "cta" }
    },
    definitiveText: "造影CTでA型解離確定 → 心臓血管外科で緊急手術。"
  },
  PE: {
    key: "PE",
    name: "肺血栓塞栓症（PE）",
    summary: "突然の呼吸困難・胸痛。下肢浮腫。長距離移動歴。",
    hotline: "BP 88/52, HR124, SpO₂ 88%（O₂で改善）, RR30。",
    jtas: 1,
    actions: {
      essentials: ["oxygen","monitor","line","bloods_ddimer","echo_rv"],
      definitiveBtn: { label: "造影CTPAで確定（抗凝固/カテ）", tag: "ctpa" }
    },
    definitiveText: "造影CTPAでPE確定 → 抗凝固/血栓除去検討。"
  },
  TPT: {
    key: "TPT",
    name: "緊張性気胸（TPT）",
    summary: "突然の胸痛と呼吸苦。患側呼吸音消失・気管偏位、鼓音。",
    hotline: "BP 80/50, HR128, SpO₂86%, RR32。",
    jtas: 1,
    actions: {
      essentials: ["oxygen","monitor","needle_decompression","bloods_abg"],
      definitiveBtn: { label: "脱気後ドレーン留置で確定", tag: "decompression" }
    },
    definitiveText: "穿刺脱気で改善 → 胸腔ドレーン留置。"
  },
  Boerhaave: {
    key: "Boerhaave",
    name: "突発性食道破裂（Boerhaave）",
    summary: "嘔吐直後から激しい胸痛・呼吸苦・皮下気腫。",
    hotline: "BP 90/58, HR110, SpO₂90%, T 37.8℃。",
    jtas: 2,
    actions: {
      essentials: ["oxygen","monitor","line","bloods","xray","ct_esoph"],
      definitiveBtn: { label: "造影CTで漏出確認（緊急OP）", tag: "ct_esoph" }
    },
    definitiveText: "造影CTで造影漏出 → 胸部外科/消化器外科で緊急手術。"
  }
};

// JTAS表示用
export const JTAS_META = {
  1: { label: "JTAS 1", color: "bg-red-600 text-white", desc: "最重症（直ちに処置）" },
  2: { label: "JTAS 2", color: "bg-orange-500 text-white", desc: "緊急（10分以内）" },
  3: { label: "JTAS 3", color: "bg-yellow-400 text-slate-900", desc: "準緊急（30分以内）" },
  4: { label: "JTAS 4", color: "bg-green-500 text-white", desc: "待機可（60分以内）" },
  5: { label: "JTAS 5", color: "bg-blue-500 text-white", desc: "軽症（120分以内）" },
};

export function effectiveJTAS(base, risk) {
  if (risk >= 18) return 1; // 急変ならJTAS1扱い
  return base;
}

// ─────────────────────────────────────────────
// リスクモデル
export function simulateRiskPhase(logs, timeMinutes = 0) {
  let riskBase = 6;
  let missed = 0;
  let totalDelaySec = 0;
  let missingActions = 0;

  logs.forEach(l => {
    missed += l.missedDifferentials || 0;
    totalDelaySec += l.delaySec || 0;
    missingActions += l.missingActions || 0;
  });

  const delayMin = totalDelaySec / 60;
  let risk = riskBase * Math.pow(1.05, timeMinutes)
          + 2 * missingActions
          + 3 * missed
          + (delayMin >= 5 ? 1 : 0);
  risk = Math.min(20, Math.round(risk));

  let phase = "初療";
  if (risk >= 18) phase = "急変";
  else if (timeMinutes >= 30) phase = "診断";
  else if (timeMinutes >= 60) phase = "治療";

  return { phase, currentRisk: risk };
}

// ─────────────────────────────────────────────
// 尤度比テーブル（教育用代表値）
export const LR_TABLE = {
  ecg_ste: {
    AMI: { LRp: 13, LRn: 0.2 },
    AoD: { LRp: 1, LRn: 1 },
    PE:  { LRp: 1, LRn: 1 },
    TPT: { LRp: 1, LRn: 1 },
    Boerhaave: { LRp: 1, LRn: 1 }
  },
  echo_flap: {
    AMI: { LRp: 0.7, LRn: 1.2 },
    AoD: { LRp: 20, LRn: 0.1 },
    PE:  { LRp: 1, LRn: 1 },
    TPT: { LRp: 1, LRn: 1 },
    Boerhaave: { LRp: 1, LRn: 1 }
  },
  ddimer_high: {
    AMI: { LRp: 1.2, LRn: 0.9 },
    AoD: { LRp: 2.0, LRn: 0.5 },
    PE:  { LRp: 2.6, LRn: 0.3 },
    TPT: { LRp: 1, LRn: 1 },
    Boerhaave: { LRp: 1.3, LRn: 0.9 }
  },
  echo_rv_strain: {
    AMI: { LRp: 0.8, LRn: 1.1 },
    AoD: { LRp: 0.9, LRn: 1.1 },
    PE:  { LRp: 5, LRn: 0.5 },
    TPT: { LRp: 1, LRn: 1 },
    Boerhaave: { LRp: 1, LRn: 1 }
  },
  xray_pneumothorax: {
    AMI: { LRp: 0.5, LRn: 1.1 },
    AoD: { LRp: 0.7, LRn: 1.0 },
    PE:  { LRp: 0.8, LRn: 1.0 },
    TPT: { LRp: 15, LRn: 0.2 },
    Boerhaave: { LRp: 0.8, LRn: 1.0 }
  },
  ct_esoph_leak: {
    AMI: { LRp: 0.5, LRn: 1.1 },
    AoD: { LRp: 0.8, LRn: 1.0 },
    PE:  { LRp: 0.8, LRn: 1.0 },
    TPT: { LRp: 0.9, LRn: 1.0 },
    Boerhaave: { LRp: 25, LRn: 0.1 }
  }
};

// ロジット変換（安全域）
function clamp01(x) { return Math.max(0.001, Math.min(0.999, x)); }
function logit(p) { p = clamp01(p); return Math.log(p/(1-p)); }
function invLogit(z) { return 1/(1+Math.exp(-z)); }

// ベイズ更新（prior→posterior）
export function bayesUpdate(prior, evidences) {
  const logits = {};
  Object.keys(prior).forEach(k => { logits[k] = logit(prior[k]); });

  evidences.forEach(ev => {
    const lrset = LR_TABLE[ev.key];
    if (!lrset) return;
    Object.keys(prior).forEach(dz => {
      const pair = lrset[dz] || { LRp: 1, LRn: 1 };
      const LR = ev.sign > 0 ? (pair.LRp ?? 1) : (pair.LRn ?? 1);
      logits[dz] += Math.log(LR);
    });
  });

  const raw = {};
  let sum = 0;
  Object.keys(prior).forEach(k => { raw[k] = invLogit(logits[k]); sum += raw[k]; });
  const posterior = {};
  Object.keys(prior).forEach(k => { posterior[k] = raw[k] / sum; });
  return posterior;
}

// 減点・改善提案（フィードバック）
export function evaluateLogs(logs) {
  const feedback = [];

  logs.forEach(l => {
    if ((l.delaySec || 0) > 300) {
      feedback.push({
        category: "初療",
        issue: "初期介入が5分以上遅延",
        improvement: "役割宣言で同時進行（酸素・モニター・耐圧ライン・採血）を徹底しましょう。"
      });
    }
    if ((l.missingActions || 0) > 0) {
      feedback.push({
        category: "初療",
        issue: `初療アクションの抜け（${l.missingActions}件）`,
        improvement: "ABCDEチェックリストで観察→介入→再評価のループを回しましょう。"
      });
    }
    if ((l.missedDifferentials || 0) > 2) {
      feedback.push({
        category: "医学的判断",
        issue: "致死的鑑別（AMI/AoD/PE/TPT/Boerhaave）の想起不足",
        improvement: "胸痛5大鑑別を常に横に置き、検査前に声出し確認しましょう。"
      });
    }
    if (l.tags?.includes("check_allergy")) {
      feedback.push({
        category: "医学的判断",
        issue: "造影前アレルギー確認を実施",
        improvement: "腎機能（Cre/eGFR）も併せて確認するとより安全です。"
      });
    }
    if (l.toneScore !== undefined && l.toneScore < 1) {
      feedback.push({
        category: "コミュニケーション",
        issue: "声のトーンが強く、患者が不安に感じた",
        improvement: "語尾を柔らかく（〜ですね／〜しましょうか）、安心語彙（大丈夫・ゆっくり）を使いましょう。"
      });
    }
  });

  return feedback;
}

// スコア（簡易）：100−5×減点件数（下限60）
export function rubricScore(feedback) {
  const base = 100;
  const penalty = (feedback?.length || 0) * 5;
  const total = Math.max(60, base - penalty);
  const rank = total >= 90 ? "S" : total >= 80 ? "A" : total >= 70 ? "B" : total >= 60 ? "C" : "D";
  return { total, rank };
}
