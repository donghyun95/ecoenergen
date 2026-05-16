"use client";

import { useEffect, useMemo, useState } from "react";

type Floor = "1F" | "5F";

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
  sec1: string;
  sec2: string;
  sec3: string;
  sec4: string;
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

const STORAGE_KEY = "m15-check-form-v1";
const defaultInactiveAlarm = "O3 generator 공압벨브 이상없음";

const now = new Date();

const formatted = `${String(now.getFullYear()).slice(2)}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

const defaultText = `M15 가동 점검 (${formatted})

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
  sec1: "15",
  sec2: "150",
  sec3: "15",
  sec4: "170",
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

const parseTriple = (tokens: string[]) => {
  if (tokens.length === 1 && tokens[0] === "C") {
    return ["", "", ""];
  }

  return [tokens[0] ?? "", tokens[1] ?? "", tokens[2] ?? ""];
};

const parseRow1 = (line: string): Row1 => {
  const rangeMatch = line.match(/\(([^~]+)~([^)]+)\)(.+)$/);

  if (!rangeMatch) return { ...defaultRow1 };

  const min = rangeMatch[1].trim();
  const max = rangeMatch[2].trim();
  const current = rangeMatch[3].trim();

  const beforeRange = line.slice(0, rangeMatch.index).trim();
  const tokens = beforeRange.split(/\s+/);

  const ratio = tokens[tokens.length - 1] ?? "5/2";
  const v7 = tokens[tokens.length - 2] ?? "360";
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

const parseRow2 = (line: string): Row2 => {
  const match = line.match(
    /^\(([^~]+)~([^)]+)\)(\S+)\s+(\S+)s\s+(\S+)s\s+(\S+)s\s+(\S+)s$/,
  );

  if (!match) return { ...defaultRow2 };

  return {
    min: match[1].trim(),
    max: match[2].trim(),
    current: match[3].trim(),
    sec1: match[4].trim(),
    sec2: match[5].trim(),
    sec3: match[6].trim(),
    sec4: match[7].trim(),
  };
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

const parseReport = (text: string) => {
  const rawLines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let title = rawLines[0] || `M15 가동 점검 (${formatted})`;
  let floor: Floor = "1F";
  const machines: Machine[] = [];

  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i];

    if (line === "[1F]") {
      floor = "1F";
      continue;
    }

    if (line === "[5F]") {
      floor = "5F";
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
        rawLines[j] !== "[1F]" &&
        rawLines[j] !== "[5F]"
      ) {
        alarms.push(normalizeAlarm(rawLines[j]));
        j++;
      }

      machines.push({
        id,
        floor,
        inactive: true,
        alarms: alarms.length ? alarms : [defaultInactiveAlarm],
      });

      i = j - 1;
      continue;
    }

    const row1Line = rawLines[i + 1] ?? "";
    const row2Line = rawLines[i + 2] ?? "";
    const row3Line = rawLines[i + 3] ?? "";

    const alarms: string[] = [];
    let j = i + 4;

    while (
      j < rawLines.length &&
      !rawLines[j].startsWith("#") &&
      rawLines[j] !== "[1F]" &&
      rawLines[j] !== "[5F]"
    ) {
      alarms.push(normalizeAlarm(rawLines[j]));
      j++;
    }

    machines.push({
      id,
      floor,
      inactive: false,
      row1: parseRow1(row1Line),
      row2: parseRow2(row2Line),
      row3: parseRow3(row3Line),
      alarms,
    });

    i = j - 1;
  }

  return { title, machines };
};

const formatRulesText = `[붙여넣기 파싱 가능 범위]

가능

공백 개수 다름
예) 21 10 0, 21 10 0, 탭 구분
C 묶음 처리
예) 26 28 0 C 999 5/5 (11.0~11.5)11.7
→ 뒤 3개 값이 전부 빈 값으로 처리됨
알람 번호 포함
예) 1. OXI #A PCW FLOW RATE HI, HH ALM 반복
→ 번호 제거 후 알람 내용만 저장
비가동
예)
#1013 (비가동)
O3 generator 공압벨브 이상없음
문자열 포함
예) (60.0)55 ~ 67 헌팅 (10.0)10.0 ~ 10.6 헌팅

필수 형식

장비번호는 #1010 형태
비가동은 #1013 (비가동) 형태
1행은 앞3개 뒤3개 360 5/2 (11.0~11.5)11.3 구조
2행은 (-130.0~-140.0)-256.5 15s 150s 15s 170s 구조
3행은 (55.0)54.5 (10.0)10.0 구조
줄 순서는 장비번호 → 1행 → 2행 → 3행 → 알람 순서

깨질 수 있는 경우

장비번호 앞에 #이 없음
예) 1010
비가동 표시가 다름
예) #1013 비가동, #1013 - 비가동
비율이 / 형태가 아님
예) 5 2, 5:2
기준 범위 괄호가 없음
예) 11.0~11.5 11.3
기준 범위와 현재값 사이가 분리됨
예) (11.0~11.5) 11.3
2행 시간값에 s가 없음
예) 15 150 15 170
C를 묶음이 아니라 중간값으로 사용
예) 14 C 0
1행 값 개수가 애매함
예) 21 10 0 14 10 360 5/2 ...
줄 순서가 바뀜
예) 1행 → 3행 → 2행
한 장비 안에서 1행/2행/3행 중 일부 줄이 빠짐
알람이 장비 데이터 중간에 들어감
예) 1행 → 알람 → 2행 → 3행

요약

기존 점검표 포맷을 유지한 복붙은 안정적
공백 차이는 괜찮음
구조, 괄호, /, s, 줄 순서가 바뀌면 깨질 수 있음`;

const initialParsed = parseReport(defaultText);

export default function Page() {
  const [title, setTitle] = useState(initialParsed.title);
  const [machines, setMachines] = useState<Machine[]>(initialParsed.machines);
  const [pasteText, setPasteText] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isFormatRulesOpen, setIsFormatRulesOpen] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return;

    try {
      const parsed = JSON.parse(savedData);
      if (Array.isArray(parsed.machines)) setMachines(parsed.machines);
    } catch {
      console.warn("저장 데이터 복원 실패");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ machines }));
    setSaved(true);

    const timer = setTimeout(() => setSaved(false), 800);
    return () => clearTimeout(timer);
  }, [title, machines]);

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
    const floors: Floor[] = ["1F", "5F"];

    return [
      title,
      "",
      ...floors.flatMap((floor) => {
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

            return [
              header,
              `${formatTriple(row1.v1, row1.v2, row1.v3)}   ${formatTriple(
                row1.v4,
                row1.v5,
                row1.v6,
              )}   ${fmt(row1.v7)}   ${fmt(row1.ratio1)}/${fmt(
                row1.ratio2,
              )}   (${fmt(row1.min)}~${fmt(row1.max)})${fmt(row1.current)}`,
              `(${fmt(row2.min)}~${fmt(row2.max)})${fmt(
                row2.current,
              )}   ${fmt(row2.sec1)}s  ${fmt(row2.sec2)}s   ${fmt(
                row2.sec3,
              )}s  ${fmt(row2.sec4)}s`,
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
  }, [machines, title]);

  const copyText = async () => {
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const applyPasteText = () => {
    const parsed = parseReport(pasteText);
    setTitle(parsed.title);
    setMachines(parsed.machines);
  };

  const resetStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    const parsed = parseReport(defaultText);
    setTitle(parsed.title);
    setMachines(parsed.machines);
    setPasteText("");
  };

  return (
    <main style={styles.page}>
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
          <strong>점검표 붙여넣기</strong>
          <span style={styles.savedText}>
            {saved ? "자동 저장됨" : "브라우저에 자동 저장"}
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
            저장값 초기화
          </button>
        </div>
      </section>

      <section style={styles.grid}>
        {machines.map((machine, machineIndex) => {
          const row1 = machine.row1 ?? defaultRow1;
          const row2 = machine.row2 ?? defaultRow2;
          const row3 = machine.row3 ?? defaultRow3;

          return (
            <div key={`${machine.floor}-${machine.id}`} style={styles.card}>
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
                              : [defaultInactiveAlarm]
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
                        label="초1"
                        value={row2.sec1}
                        onChange={(v) => updateRow2(machineIndex, "sec1", v)}
                      />
                      <Field
                        label="초2"
                        value={row2.sec2}
                        onChange={(v) => updateRow2(machineIndex, "sec2", v)}
                      />
                      <Field
                        label="초3"
                        value={row2.sec3}
                        onChange={(v) => updateRow2(machineIndex, "sec3", v)}
                      />
                      <Field
                        label="초4"
                        value={row2.sec4}
                        onChange={(v) => updateRow2(machineIndex, "sec4", v)}
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
