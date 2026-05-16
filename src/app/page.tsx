"use client";

import { useEffect, useMemo, useState } from "react";

type ReportKey = "M11" | "M15";
type Floor = "1F" | "4F" | "5F" | "6F";
type Row2Mode = "seconds" | "slash";

type Row1 = {
  v1: string;
  v2: string;
  v3: string;
  v4: string;
  v5: string;
  v6: string;
  v7: string;
  ratio1: string;
  ratio2: string;
  min: string;
  max: string;
  current: string;
};

type Row2 = {
  min: string;
  max: string;
  current: string;
  a1: string;
  a2: string;
  b1: string;
  b2: string;
};

type Row3 = {
  target1: string;
  current1: string;
  target2: string;
  current2: string;
};

type Machine = {
  id: string;
  floor: Floor;
  inactive?: boolean;
  row1?: Row1;
  row2?: Row2;
  row3?: Row3;
  alarms?: string[];
};

type ReportConfig = {
  label: ReportKey;
  storageKey: string;
  defaultText: string;
  floors: Floor[];
  row2Mode: Row2Mode;
  defaultInactiveAlarm: string;
};

const now = new Date();
const formatted = `${String(now.getFullYear()).slice(2)}.${String(
  now.getMonth() + 1,
).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

const defaultInactiveAlarmM15 = "O3 generator 공압벨브 이상없음";
const defaultInactiveAlarmM11 = "O3 generator O2, O3공압벨브 Fail";

const defaultTextM11 = `M11 가동 점검 (${formatted})

[1F]
#1
24 74 2   14  22  0   360   7/2   (10.0~10.5)9.8
(-160.0~-180.0)-123.1  290/5400   80/800
(35.0)35.0   (8.0)8.0

#2
25  55  0   14 23 0   360   7/2   (10.0~10.5)9.1
(-130.0~-135.0)-137.4  290/5400   80/800
(35.0)35.0   (8.0)8.0

#3
26 92 0   16  28  0   360   7/2   (10.0~10.5)10.8
(-140.0~-150.0)-56.5  290/5400   80/800
(35.0)35.0   (8.0)8.1

#4 (비가동)
O3 generator O2, O3공압벨브 Fail

[4F] 
#1
C   24 63 0   360   5/3   (10.0~10.5)8.8
(-120.0~-126.0)-75.5  290/5400   80/800
(45.0)45.0   (8.0)8.0

#2 
C   24  83  0   360   5/3   (10.1~10.4)11.6
(-48.0~-50.0)15.1
 290/5400   80/800
(45.0)45.0   (8.0)8.0

#3 (비가동)
O3 generator O2, O3공압벨브 Fail
ORG Scr
17.97  7.0  0  -70ILT   -90OLT  19.95Hz


[6F]
#1 (비가동)
O3 generatorO3 공압벨브 Fail

#2 
24  59  0   360   7/3  (11.0~11.5)9.0
(-100~-105)8.7  20/5400   100/750
(55.0)55.0   (8.0)8.0

#3
24 49  1  360   7/3   (3.4~3.5)9.8
(-70.0~-75.0)-25.0  20/5400   100/750
(55.0)55.0   (8.0)8.0`;

const defaultTextM15 = `M15 가동 점검 (${formatted})

[1F]
#1010
21 10 0   14  10  0   360   5/2   (11.0~11.5)11.3
(-130.0~-140.0)-256.5   15s  150s   15s  170s
(55.0)54.5   (10.0)10.0
1. OXI #A PCW FLOW RATE HI, HH ALM 반복

#1011
24  24  4     14  22  0   360   2/5   (11.0~11.5)12.6
(-150.0~-160.0)-120.8  15s  150s   15s  170s
(55.0)55.5   (10.0)10.0

#1012
26  28  0   C  999   5/5   (11.0~11.5)11.7
(-130.0~-140.0)-126.2  15s  150s   15s  170s
(55.0)55.0   (10.0)9.5
1. OXI #A PCW FLOW RATE HI, HH ALM 반복

#1013 (비가동)
O3 generator 공압벨브 이상없음

#1014
21  3  1    C   360  3/10  (10.0~11.0)12.5
(-130.0~-140.0)-201.9   14s  171s   15s  150s
(55.0)55.0   (10.0)10.0

#1015 (비가동)
O3 generator 공압벨브 이상없음

#1016
24  17  2   16  5  0   360   10/3   (11.0~11.5)11.3
(-130.0~-140.0)-85.6  10s  150s   10s  150s
(55.0)54.5   (10.0)10.0
1. OXI #A PCW FLOW RATE HI, HH ALM 반복

#1017
24  20  0   15  35  0   365   15/2   (11.0~11.5)11.3
(-140.0~-150.0)-110.2  10s  150s   10s  150s
(55.0)54.0   (10.0)10.0

#1018
27  47  0   17  25  0   999   10/2   (11.0~11.5)12.6
(-130.0~-140.0)-134.6  10s  150s   10s  150s
(55.0)55.0   (10.0)10.0

[5F]
#53001
22  16  0   13.5  27  1   360   8/3   (9 .0~9.2)10.6
(51.0~50.0)-77.0   10s  200s   10s  100s
(60.0)60.0   (10.0)10.0

#53002 (비가동)
O3 generator 공압벨브 이상 없음

#53003
20  7  0   14  6  0   999   8/3   (11.0~11.5)11.2
(-110.0~-120.0)-130.4  10s  120s   15s  165s
(60.0)55 ~ 67 헌팅 (10.0)10.0 ~ 10.6 헌팅

#53004
19  8  0   13  21  0   360   10/2   (11.0~11.5)10.4
(-165.0~-175.0)-52.9   10s  120s   15s  165s
(60.0)60.0   (10.0)10.0
1. OXI #A O3 CONCENTRATION HI,HH 반복

#53005
28  65  0   C   360   2/5   (9.9~11.5)11.6
(13.0~10.0)-67.9   10s  180s   10s  300s
(20.0)20.0   (10.0)10.0

#53006
27  72  0   12.5  22  0   999   7/3   (11.0~11.5)10.8
(70.0~60.0)-54.4  10s  180s   10s  300s
(20.0)20.0   (10.0)9.98`;

const REPORT_CONFIGS: Record<ReportKey, ReportConfig> = {
  M11: {
    label: "M11",
    storageKey: "m11-check-form-v1",
    defaultText: defaultTextM11,
    floors: ["1F", "4F", "6F"],
    row2Mode: "slash",
    defaultInactiveAlarm: defaultInactiveAlarmM11,
  },
  M15: {
    label: "M15",
    storageKey: "m15-check-form-v1",
    defaultText: defaultTextM15,
    floors: ["1F", "5F"],
    row2Mode: "seconds",
    defaultInactiveAlarm: defaultInactiveAlarmM15,
  },
};

const defaultRow1: Row1 = {
  v1: "21",
  v2: "10",
  v3: "0",
  v4: "14",
  v5: "10",
  v6: "0",
  v7: "360",
  ratio1: "5",
  ratio2: "2",
  min: "11.0",
  max: "11.5",
  current: "11.3",
};

const defaultRow2: Row2 = {
  min: "-130.0",
  max: "-140.0",
  current: "-256.5",
  a1: "15",
  a2: "150",
  b1: "15",
  b2: "170",
};

const defaultRow3: Row3 = {
  target1: "55.0",
  current1: "54.5",
  target2: "10.0",
  current2: "10.0",
};

const isBlank = (value: string) => value.trim() === "";
const fmt = (value: string) => (isBlank(value) ? "C" : value);

const formatTriple = (a: string, b: string, c: string) => {
  if (isBlank(a) && isBlank(b) && isBlank(c)) return "C";
  return `${fmt(a)}  ${fmt(b)}  ${fmt(c)}`;
};

const normalizeAlarm = (line: string) => {
  return line.replace(/^\d+\.\s*/, "").trim();
};

const isFloorLine = (line: string) => /^\[(1F|4F|5F|6F)\]$/.test(line.trim());
const getFloorFromLine = (line: string): Floor | null => {
  const match = line.trim().match(/^\[(1F|4F|5F|6F)\]$/);
  return match ? (match[1] as Floor) : null;
};

const parseTriple = (tokens: string[]) => {
  if (tokens.length === 1 && tokens[0] === "C") return ["", "", ""];
  return [tokens[0] ?? "", tokens[1] ?? "", tokens[2] ?? ""];
};

const parseRow1 = (line: string): Row1 => {
  const rangeMatch = line.match(/\(([^~]+)~([^)]+)\)(.+)$/);
  if (!rangeMatch) return { ...defaultRow1 };

  const min = rangeMatch[1].trim();
  const max = rangeMatch[2].trim();
  const current = rangeMatch[3].trim();
  const beforeRange = line.slice(0, rangeMatch.index).trim();
  const tokens = beforeRange.split(/\s+/).filter(Boolean);

  const ratio = tokens[tokens.length - 1] ?? "";
  const v7 = tokens[tokens.length - 2] ?? "";
  const valueTokens = tokens.slice(0, -2);

  let first = ["", "", ""];
  let second = ["", "", ""];

  if (valueTokens.length === 6) {
    first = parseTriple(valueTokens.slice(0, 3));
    second = parseTriple(valueTokens.slice(3, 6));
  } else if (valueTokens.length === 4) {
    first = parseTriple(valueTokens.slice(0, 3));
    second = parseTriple([valueTokens[3]]);
  } else if (valueTokens.length === 2 && valueTokens[0] === "C") {
    first = parseTriple(["C"]);
    second = parseTriple([]);
  } else {
    first = parseTriple(valueTokens.slice(0, 3));
    second = parseTriple(valueTokens.slice(3));
  }

  const [ratio1, ratio2] = ratio.split("/");

  return {
    v1: first[0],
    v2: first[1],
    v3: first[2],
    v4: second[0],
    v5: second[1],
    v6: second[2],
    v7,
    ratio1: ratio1 ?? "",
    ratio2: ratio2 ?? "",
    min,
    max,
    current,
  };
};

const parsePair = (value: string) => {
  const [left, right] = value.split("/");
  return [left ?? "", right ?? ""];
};

const parseRow2 = (line: string, mode: Row2Mode): Row2 => {
  const compactLine = line.trim().replace(/\s+/g, " ");
  const rangeMatch = compactLine.match(/^\(([^~]+)~([^)]+)\)(\S+)\s*(.*)$/);
  if (!rangeMatch) return { ...defaultRow2 };

  const min = rangeMatch[1].trim();
  const max = rangeMatch[2].trim();
  const current = rangeMatch[3].trim();
  const rest = rangeMatch[4].trim();
  const tokens = rest.split(/\s+/).filter(Boolean);

  if (mode === "seconds") {
    return {
      min,
      max,
      current,
      a1: (tokens[0] ?? "").replace(/s$/i, ""),
      a2: (tokens[1] ?? "").replace(/s$/i, ""),
      b1: (tokens[2] ?? "").replace(/s$/i, ""),
      b2: (tokens[3] ?? "").replace(/s$/i, ""),
    };
  }

  const [a1, a2] = parsePair(tokens[0] ?? "");
  const [b1, b2] = parsePair(tokens[1] ?? "");

  return { min, max, current, a1, a2, b1, b2 };
};

const parseRow3 = (line: string): Row3 => {
  const match = line.match(/^\(([^)]+)\)(.*?)\s+\(([^)]+)\)(.*)$/);
  if (!match) return { ...defaultRow3 };

  return {
    target1: match[1].trim(),
    current1: match[2].trim(),
    target2: match[3].trim(),
    current2: match[4].trim(),
  };
};

const shouldJoinRow2NextLine = (row2Line: string, nextLine: string) => {
  const row2HasRangeAndCurrentOnly = /^\([^~]+~[^)]+\)\S+$/.test(
    row2Line.trim(),
  );
  const nextHasSlashPairs = /^\d+\/?\d*\s+\d+\/?\d*/.test(nextLine.trim());
  return row2HasRangeAndCurrentOnly && nextHasSlashPairs;
};

const parseReport = (text: string, config: ReportConfig) => {
  const rawLines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const title = rawLines[0] || `${config.label} 가동 점검 (${formatted})`;
  let floor: Floor = config.floors[0] ?? "1F";
  const machines: Machine[] = [];

  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i];
    const nextFloor = getFloorFromLine(line);

    if (nextFloor) {
      floor = nextFloor;
      continue;
    }

    if (!line.startsWith("#")) continue;

    const headerMatch = line.match(/^#(\d+)\s*(\(비가동\))?/);
    if (!headerMatch) continue;

    const id = headerMatch[1];
    const inactive = !!headerMatch[2];

    if (inactive) {
      const alarms: string[] = [];
      let j = i + 1;

      while (
        j < rawLines.length &&
        !rawLines[j].startsWith("#") &&
        !isFloorLine(rawLines[j])
      ) {
        alarms.push(normalizeAlarm(rawLines[j]));
        j++;
      }

      machines.push({
        id,
        floor,
        inactive: true,
        alarms: alarms.length ? alarms : [config.defaultInactiveAlarm],
      });

      i = j - 1;
      continue;
    }

    const row1Line = rawLines[i + 1] ?? "";
    let row2Line = rawLines[i + 2] ?? "";
    let row3LineIndex = i + 3;

    if (shouldJoinRow2NextLine(row2Line, rawLines[i + 3] ?? "")) {
      row2Line = `${row2Line} ${rawLines[i + 3]}`;
      row3LineIndex = i + 4;
    }

    const row3Line = rawLines[row3LineIndex] ?? "";
    const alarms: string[] = [];
    let j = row3LineIndex + 1;

    while (
      j < rawLines.length &&
      !rawLines[j].startsWith("#") &&
      !isFloorLine(rawLines[j])
    ) {
      alarms.push(normalizeAlarm(rawLines[j]));
      j++;
    }

    machines.push({
      id,
      floor,
      inactive: false,
      row1: parseRow1(row1Line),
      row2: parseRow2(row2Line, config.row2Mode),
      row3: parseRow3(row3Line),
      alarms,
    });

    i = j - 1;
  }

  return { title, machines };
};

const formatRulesText = `[붙여넣기 파싱 가능 범위]

공통 가능

M11 / M15 탭 전환
각 탭별 자동 저장
공백 개수 다름
C 묶음 처리
알람 번호 포함
비가동 장비 여러 줄 특이사항
문자열 포함 현재값

M15 2행
예) (-130.0~-140.0)-256.5 15s 150s 15s 170s

M11 2행
예) (-160.0~-180.0)-123.1 290/5400 80/800
예) (-48.0~-50.0)15.1 다음 줄에 290/5400 80/800 이 와도 자동 결합

필수 형식

층은 [1F], [4F], [5F], [6F] 형태
장비번호는 #1010 또는 #1 형태
비가동은 #1 (비가동) 형태
줄 순서는 장비번호 → 1행 → 2행 → 3행 → 알람 순서

깨질 수 있는 경우

장비번호 앞에 #이 없음
비가동 표시가 다름
비율이 / 형태가 아님
기준 범위 괄호가 없음
줄 순서가 바뀜
한 장비 안에서 1행/2행/3행 중 일부 줄이 빠짐
알람이 장비 데이터 중간에 들어감`;

const getInitialState = (config: ReportConfig) =>
  parseReport(config.defaultText, config);

export default function Page() {
  const [activeReport, setActiveReport] = useState<ReportKey>("M15");
  const config = REPORT_CONFIGS[activeReport];

  const initialParsed = useMemo(() => getInitialState(config), [config]);

  const [title, setTitle] = useState(initialParsed.title);
  const [machines, setMachines] = useState<Machine[]>(initialParsed.machines);
  const [pasteText, setPasteText] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isFormatRulesOpen, setIsFormatRulesOpen] = useState(false);

  useEffect(() => {
    const parsedDefault = getInitialState(config);
    const savedData = localStorage.getItem(config.storageKey);

    if (!savedData) {
      setTitle(parsedDefault.title);
      setMachines(parsedDefault.machines);
      setPasteText("");
      return;
    }

    try {
      const parsed = JSON.parse(savedData);
      setTitle(
        typeof parsed.title === "string" ? parsed.title : parsedDefault.title,
      );
      setMachines(
        Array.isArray(parsed.machines)
          ? parsed.machines
          : parsedDefault.machines,
      );
      setPasteText("");
    } catch {
      console.warn("저장 데이터 복원 실패");
      setTitle(parsedDefault.title);
      setMachines(parsedDefault.machines);
      setPasteText("");
    }
  }, [config]);

  useEffect(() => {
    localStorage.setItem(config.storageKey, JSON.stringify({ machines }));
    setSaved(true);

    const timer = setTimeout(() => setSaved(false), 800);
    return () => clearTimeout(timer);
  }, [config.storageKey, title, machines]);

  const updateMachine = (
    machineIndex: number,
    updater: (machine: Machine) => Machine,
  ) => {
    setMachines((prev) =>
      prev.map((machine, index) =>
        index === machineIndex ? updater(machine) : machine,
      ),
    );
  };

  const updateRow1 = (index: number, key: keyof Row1, value: string) => {
    updateMachine(index, (machine) => ({
      ...machine,
      row1: { ...(machine.row1 ?? defaultRow1), [key]: value },
    }));
  };

  const updateRow2 = (index: number, key: keyof Row2, value: string) => {
    updateMachine(index, (machine) => ({
      ...machine,
      row2: { ...(machine.row2 ?? defaultRow2), [key]: value },
    }));
  };

  const updateRow3 = (index: number, key: keyof Row3, value: string) => {
    updateMachine(index, (machine) => ({
      ...machine,
      row3: { ...(machine.row3 ?? defaultRow3), [key]: value },
    }));
  };

  const outputText = useMemo(() => {
    return [
      title,
      "",
      ...config.floors.flatMap((floor) => {
        const floorMachines = machines.filter((m) => m.floor === floor);
        if (floorMachines.length === 0) return [];

        return [
          `[${floor}]`,
          ...floorMachines.flatMap((machine) => {
            const header = `#${machine.id}${
              machine.inactive ? " (비가동)" : ""
            }`;

            if (machine.inactive) {
              return [header, ...(machine.alarms ?? []), ""];
            }

            const row1 = machine.row1 ?? defaultRow1;
            const row2 = machine.row2 ?? defaultRow2;
            const row3 = machine.row3 ?? defaultRow3;

            const row2Text =
              config.row2Mode === "seconds"
                ? `(${fmt(row2.min)}~${fmt(row2.max)})${fmt(
                    row2.current,
                  )}   ${fmt(row2.a1)}s  ${fmt(row2.a2)}s   ${fmt(
                    row2.b1,
                  )}s  ${fmt(row2.b2)}s`
                : `(${fmt(row2.min)}~${fmt(row2.max)})${fmt(
                    row2.current,
                  )}   ${fmt(row2.a1)}/${fmt(row2.a2)}   ${fmt(
                    row2.b1,
                  )}/${fmt(row2.b2)}`;

            return [
              header,
              `${formatTriple(row1.v1, row1.v2, row1.v3)}   ${formatTriple(
                row1.v4,
                row1.v5,
                row1.v6,
              )}   ${fmt(row1.v7)}   ${fmt(row1.ratio1)}/${fmt(
                row1.ratio2,
              )}   (${fmt(row1.min)}~${fmt(row1.max)})${fmt(row1.current)}`,
              row2Text,
              `(${fmt(row3.target1)})${fmt(row3.current1)}   (${fmt(
                row3.target2,
              )})${fmt(row3.current2)}`,
              ...(machine.alarms ?? []).map(
                (alarm, index) => `${index + 1}. ${alarm}`,
              ),
              "",
            ];
          }),
        ];
      }),
    ]
      .join("\n")
      .trim();
  }, [config.floors, config.row2Mode, machines, title]);

  const copyText = async () => {
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const applyPasteText = () => {
    const parsed = parseReport(pasteText, config);
    setTitle(parsed.title);
    setMachines(parsed.machines);
  };

  const resetStorage = () => {
    localStorage.removeItem(config.storageKey);
    const parsed = parseReport(config.defaultText, config);
    setTitle(parsed.title);
    setMachines(parsed.machines);
    setPasteText("");
  };

  return (
    <main style={styles.page}>
      <div style={styles.reportTabs}>
        {(Object.keys(REPORT_CONFIGS) as ReportKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveReport(key)}
            style={{
              ...styles.reportTab,
              ...(activeReport === key ? styles.reportTabActive : {}),
            }}
          >
            {key}
          </button>
        ))}
      </div>

      <div style={styles.header}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          style={styles.titleInput}
        />

        <div style={styles.headerButtons}>
          <button
            type="button"
            onClick={() => setIsFormatRulesOpen(true)}
            style={styles.rulesButton}
          >
            포맷규칙
          </button>

          <button onClick={copyText} style={styles.copyButton}>
            {copied ? "복사 완료" : "위 포맷으로 복사"}
          </button>
        </div>
      </div>

      {isFormatRulesOpen && (
        <FormatRulesModal onClose={() => setIsFormatRulesOpen(false)} />
      )}

      <section style={styles.pasteBox}>
        <div style={styles.pasteHeader}>
          <strong>{activeReport} 점검표 붙여넣기</strong>
          <span style={styles.savedText}>
            {saved ? "자동 저장됨" : `${activeReport} 브라우저에 자동 저장`}
          </span>
        </div>

        <textarea
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          placeholder="여기에 기존 점검표 전체를 붙여넣고 [붙여넣은 내용 반영]을 누르세요."
          style={styles.textarea}
        />

        <div style={styles.pasteButtons}>
          <button onClick={applyPasteText} style={styles.applyButton}>
            붙여넣은 내용 반영
          </button>

          <button onClick={resetStorage} style={styles.resetButton}>
            {activeReport} 저장값 초기화
          </button>
        </div>
      </section>

      <section style={styles.grid}>
        {machines.map((machine, machineIndex) => {
          const row1 = machine.row1 ?? defaultRow1;
          const row2 = machine.row2 ?? defaultRow2;
          const row3 = machine.row3 ?? defaultRow3;

          return (
            <div
              key={`${activeReport}-${machine.floor}-${machine.id}`}
              style={styles.card}
            >
              <div style={styles.cardHeader}>
                <h2 style={styles.machineTitle}>#{machine.id}</h2>
                <span style={styles.floorBadge}>{machine.floor}</span>

                <label style={styles.inactiveLabel}>
                  <input
                    type="checkbox"
                    checked={!!machine.inactive}
                    onChange={(event) =>
                      updateMachine(machineIndex, (prev) => {
                        const checked = event.target.checked;

                        return {
                          ...prev,
                          inactive: checked,
                          alarms: checked
                            ? prev.alarms && prev.alarms.length > 0
                              ? prev.alarms
                              : [config.defaultInactiveAlarm]
                            : prev.alarms,
                          row1: checked ? prev.row1 : { ...defaultRow1 },
                          row2: checked ? prev.row2 : { ...defaultRow2 },
                          row3: checked ? prev.row3 : { ...defaultRow3 },
                        };
                      })
                    }
                  />
                  비가동
                </label>
              </div>

              {!machine.inactive && (
                <>
                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>1행</div>
                    <div style={styles.inputGrid}>
                      <Field
                        label="앞1"
                        value={row1.v1}
                        onChange={(v) => updateRow1(machineIndex, "v1", v)}
                      />
                      <Field
                        label="앞2"
                        value={row1.v2}
                        onChange={(v) => updateRow1(machineIndex, "v2", v)}
                      />
                      <Field
                        label="앞3"
                        value={row1.v3}
                        onChange={(v) => updateRow1(machineIndex, "v3", v)}
                      />
                      <Field
                        label="뒤1"
                        value={row1.v4}
                        onChange={(v) => updateRow1(machineIndex, "v4", v)}
                      />
                      <Field
                        label="뒤2"
                        value={row1.v5}
                        onChange={(v) => updateRow1(machineIndex, "v5", v)}
                      />
                      <Field
                        label="뒤3"
                        value={row1.v6}
                        onChange={(v) => updateRow1(machineIndex, "v6", v)}
                      />
                      <Field
                        label="시간/값"
                        value={row1.v7}
                        onChange={(v) => updateRow1(machineIndex, "v7", v)}
                      />
                      <Field
                        label="분자"
                        value={row1.ratio1}
                        onChange={(v) => updateRow1(machineIndex, "ratio1", v)}
                      />
                      <Field
                        label="분모"
                        value={row1.ratio2}
                        onChange={(v) => updateRow1(machineIndex, "ratio2", v)}
                      />
                      <Field
                        label="기준 최소"
                        value={row1.min}
                        onChange={(v) => updateRow1(machineIndex, "min", v)}
                      />
                      <Field
                        label="기준 최대"
                        value={row1.max}
                        onChange={(v) => updateRow1(machineIndex, "max", v)}
                      />
                      <Field
                        label="현재값"
                        value={row1.current}
                        onChange={(v) => updateRow1(machineIndex, "current", v)}
                      />
                    </div>
                  </div>

                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>2행</div>
                    <div style={styles.inputGrid}>
                      <Field
                        label="기준 최소"
                        value={row2.min}
                        onChange={(v) => updateRow2(machineIndex, "min", v)}
                      />
                      <Field
                        label="기준 최대"
                        value={row2.max}
                        onChange={(v) => updateRow2(machineIndex, "max", v)}
                      />
                      <Field
                        label="현재값"
                        value={row2.current}
                        onChange={(v) => updateRow2(machineIndex, "current", v)}
                      />
                      <Field
                        label={
                          config.row2Mode === "seconds" ? "초1" : "앞 분자"
                        }
                        value={row2.a1}
                        onChange={(v) => updateRow2(machineIndex, "a1", v)}
                      />
                      <Field
                        label={
                          config.row2Mode === "seconds" ? "초2" : "앞 분모"
                        }
                        value={row2.a2}
                        onChange={(v) => updateRow2(machineIndex, "a2", v)}
                      />
                      <Field
                        label={
                          config.row2Mode === "seconds" ? "초3" : "뒤 분자"
                        }
                        value={row2.b1}
                        onChange={(v) => updateRow2(machineIndex, "b1", v)}
                      />
                      <Field
                        label={
                          config.row2Mode === "seconds" ? "초4" : "뒤 분모"
                        }
                        value={row2.b2}
                        onChange={(v) => updateRow2(machineIndex, "b2", v)}
                      />
                    </div>
                  </div>

                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>3행</div>
                    <div style={styles.inputGrid}>
                      <Field
                        label="기준1"
                        value={row3.target1}
                        onChange={(v) => updateRow3(machineIndex, "target1", v)}
                      />
                      <Field
                        label="현재1"
                        value={row3.current1}
                        onChange={(v) =>
                          updateRow3(machineIndex, "current1", v)
                        }
                      />
                      <Field
                        label="기준2"
                        value={row3.target2}
                        onChange={(v) => updateRow3(machineIndex, "target2", v)}
                      />
                      <Field
                        label="현재2"
                        value={row3.current2}
                        onChange={(v) =>
                          updateRow3(machineIndex, "current2", v)
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              <AlarmEditor
                alarms={machine.alarms ?? []}
                onAdd={() =>
                  updateMachine(machineIndex, (prev) => ({
                    ...prev,
                    alarms: [...(prev.alarms ?? []), ""],
                  }))
                }
                onDelete={(alarmIndex) =>
                  updateMachine(machineIndex, (prev) => ({
                    ...prev,
                    alarms: (prev.alarms ?? []).filter(
                      (_, index) => index !== alarmIndex,
                    ),
                  }))
                }
                onChange={(alarmIndex, value) =>
                  updateMachine(machineIndex, (prev) => {
                    const nextAlarms = [...(prev.alarms ?? [])];
                    nextAlarms[alarmIndex] = value;
                    return { ...prev, alarms: nextAlarms };
                  })
                }
              />
            </div>
          );
        })}
      </section>

      <section style={styles.previewBox}>
        <div style={styles.previewHeader}>복사 결과 미리보기</div>
        <pre style={styles.preview}>{outputText}</pre>
      </section>
    </main>
  );
}

function FormatRulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose} role="presentation">
      <section
        aria-modal="true"
        role="dialog"
        aria-labelledby="format-rules-title"
        style={styles.modalPanel}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <h2 id="format-rules-title" style={styles.modalTitle}>
            포맷규칙
          </h2>
          <button type="button" onClick={onClose} style={styles.closeButton}>
            닫기
          </button>
        </div>

        <pre style={styles.rulesText}>{formatRulesText}</pre>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={styles.input}
      />
    </label>
  );
}

function AlarmEditor({
  alarms,
  onAdd,
  onDelete,
  onChange,
}: {
  alarms: string[];
  onAdd: () => void;
  onDelete: (index: number) => void;
  onChange: (index: number, value: string) => void;
}) {
  return (
    <div style={styles.alarmBox}>
      <div style={styles.sectionTitle}>알람 / 특이사항</div>

      {alarms.map((alarm, index) => (
        <div key={index} style={styles.alarmRow}>
          <input
            value={alarm}
            onChange={(event) => onChange(index, event.target.value)}
            style={styles.input}
          />

          <button
            type="button"
            style={styles.smallButton}
            onClick={() => onDelete(index)}
          >
            삭제
          </button>
        </div>
      ))}

      <button type="button" style={styles.addButton} onClick={onAdd}>
        알람 추가
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "clamp(12px, 3vw, 24px)",
    background: "#f6f6f7",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  reportTabs: {
    display: "flex",
    gap: 8,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  reportTab: {
    padding: "10px 18px",
    border: "1px solid #d6d6d6",
    borderRadius: 999,
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    cursor: "pointer",
  },
  reportTabActive: {
    background: "#111",
    color: "#fff",
    border: "1px solid #111",
  },
  header: {
    display: "flex",
    gap: 12,
    marginBottom: 16,
    alignItems: "center",
    flexWrap: "wrap",
  },
  titleInput: {
    flex: "1 1 260px",
    minWidth: 0,
    padding: "12px 14px",
    border: "1px solid #ddd",
    borderRadius: 10,
    background: "#fff",
    fontSize: 22,
    fontWeight: 700,
  },
  headerButtons: {
    display: "flex",
    gap: 8,
    flex: "0 1 auto",
    flexWrap: "wrap",
  },
  rulesButton: {
    padding: "13px 18px",
    border: "1px solid #d6d6d6",
    borderRadius: 10,
    background: "#fff",
    color: "#111",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  copyButton: {
    padding: "13px 18px",
    border: "none",
    borderRadius: 10,
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  pasteBox: {
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  pasteHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 14,
    gap: 10,
    flexWrap: "wrap",
  },
  savedText: {
    color: "#666",
    fontSize: 12,
  },
  textarea: {
    width: "100%",
    height: 90,
    resize: "vertical",
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 13,
    boxSizing: "border-box",
  },
  pasteButtons: {
    display: "flex",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  applyButton: {
    padding: "9px 12px",
    border: "none",
    borderRadius: 8,
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  resetButton: {
    padding: "9px 12px",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
    gap: 16,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  machineTitle: {
    margin: 0,
    fontSize: 22,
  },
  floorBadge: {
    padding: "4px 9px",
    borderRadius: 999,
    background: "#eee",
    fontSize: 12,
    fontWeight: 700,
  },
  inactiveLabel: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 14,
    fontWeight: 800,
  },
  inputGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))",
    gap: 10,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: "#666",
    fontWeight: 700,
  },
  input: {
    width: "100%",
    padding: "9px 10px",
    border: "1px solid #dcdcdc",
    borderRadius: 8,
    fontSize: 13,
    boxSizing: "border-box",
    background: "#fff",
  },
  alarmBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTop: "1px dashed #ddd",
  },
  alarmRow: {
    display: "flex",
    gap: 8,
    marginBottom: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  smallButton: {
    padding: "9px 10px",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  addButton: {
    padding: "9px 12px",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fafafa",
    cursor: "pointer",
    fontWeight: 700,
  },
  previewBox: {
    marginTop: 24,
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 14,
    overflow: "hidden",
  },
  previewHeader: {
    padding: "12px 16px",
    borderBottom: "1px solid #eee",
    background: "#fafafa",
    fontWeight: 800,
  },
  preview: {
    margin: 0,
    padding: 16,
    whiteSpace: "pre-wrap",
    overflowX: "auto",
    fontSize: 13,
    lineHeight: 1.55,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "clamp(10px, 3vw, 24px)",
    background: "rgba(0,0,0,0.45)",
  },
  modalPanel: {
    width: "min(760px, 100%)",
    maxHeight: "min(82vh, 720px)",
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 18px 60px rgba(0,0,0,0.24)",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 16px",
    borderBottom: "1px solid #eee",
    background: "#fafafa",
  },
  modalTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 900,
  },
  closeButton: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  rulesText: {
    margin: 0,
    padding: "16px",
    overflow: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
    overflowWrap: "anywhere",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "clamp(12px, 3.2vw, 14px)",
    lineHeight: 1.65,
  },
};
