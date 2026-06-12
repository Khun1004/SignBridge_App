// ══════════════════════════════════════════════════════════════
//  components/PoliceCasePage/PoliceCasePage.tsx
//  경찰서 케이스 목록 + 상세 화면 (React Native)
// ══════════════════════════════════════════════════════════════
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ACCENT = "#dc2626";

const C = {
  accent: ACCENT,
  accentLight: "rgba(220,38,38,0.07)",
  accentBorder: "rgba(220,38,38,0.2)",
  text: "#111",
  sub: "#666",
  border: "#e4e2dc",
  bg: "#fafaf8",
  card: "#ffffff",
  green: "#10b981",
  red: "#ef4444",
  dark: "#13131c",
};

// ── 타입 ──────────────────────────────────────────────────────
interface Officer {
  name: string;
  rank?: string;
  department?: string;
  station?: string;
  badge?: string;
  avatar?: string;
}
interface Subject {
  name: string;
  role?: string;
  birth?: string;
  disability?: string;
  nationality?: string;
  phone?: string;
  address?: string;
  avatar?: string;
}
interface CaseItem {
  id: string;
  caseType?: string;
  caseNum?: string;
  date?: string;
  time?: string;
  location?: string;
  duration?: string;
  status: string;
  statusType: "ok" | "warn" | "pending";
  flagged?: boolean;
  subject: Subject;
  officer: Officer;
  signs?: string[];
  voice?: string[];
  videoId?: number;
  videoIds?: number[];
}
interface Props {
  cases?: CaseItem[];
  loading?: boolean;
  displayName?: string;
  profile?: any;
  onRegister?: () => void;
}

// ── 상세 화면 ─────────────────────────────────────────────────
function CaseDetail({ c, onBack }: { c: CaseItem; onBack: () => void }) {
  const { subject: sb, officer: of_, signs = [], voice = [] } = c;
  const allVids =
    c.videoIds && c.videoIds.length > 0
      ? c.videoIds
      : c.videoId
        ? [c.videoId]
        : [];

  return (
    <ScrollView
      style={dt.scroll}
      contentContainerStyle={dt.body}
      showsVerticalScrollIndicator={false}
    >
      {/* 상세 헤더 */}
      <View style={dt.detailHeader}>
        <View>
          <Text style={dt.detailId}>{c.id}</Text>
          <Text style={dt.detailNum}>사건번호: {c.caseNum}</Text>
        </View>
        <View
          style={[
            dt.statusBadge,
            c.statusType === "ok"
              ? dt.statusOk
              : c.statusType === "warn"
                ? dt.statusWarn
                : dt.statusPending,
          ]}
        >
          <Text
            style={[
              dt.statusTxt,
              c.statusType === "ok"
                ? dt.statusOkTxt
                : c.statusType === "warn"
                  ? dt.statusWarnTxt
                  : dt.statusPendingTxt,
            ]}
          >
            {c.flagged ? "⚠️ " : "✅ "}
            {c.status}
          </Text>
        </View>
      </View>

      {/* 당사자 카드 */}
      <View style={[dt.personCard, { borderColor: C.accentBorder }]}>
        <View style={dt.personHeader}>
          <Text style={dt.personEmoji}>{sb.avatar || "🧏"}</Text>
          <View>
            <Text style={dt.personRole}>🧏 당사자 ({sb.role})</Text>
            <Text style={dt.personName}>{sb.name}</Text>
          </View>
        </View>
        {[
          ["생년월일", sb.birth],
          ["장애 유형", sb.disability],
          ["국적", sb.nationality],
          ["연락처", sb.phone],
          ["주소", sb.address],
        ].map(([k, v]) => (
          <View key={k} style={dt.infoRow}>
            <Text style={dt.infoKey}>{k}</Text>
            <Text style={dt.infoVal}>{v || "-"}</Text>
          </View>
        ))}
      </View>

      {/* 담당 경찰관 카드 */}
      <View style={[dt.personCard, dt.officerCard]}>
        <View style={dt.personHeader}>
          <Text style={dt.personEmoji}>{of_.avatar || "👮"}</Text>
          <View>
            <Text style={dt.personRole}>👮 담당 경찰관</Text>
            <Text style={dt.personName}>{of_.name}</Text>
          </View>
        </View>
        {[
          ["계급", of_.rank],
          ["소속팀", of_.department],
          ["근무지", of_.station],
          ["배지번호", of_.badge],
        ].map(([k, v]) => (
          <View key={k} style={dt.infoRow}>
            <Text style={dt.infoKey}>{k}</Text>
            <Text style={dt.infoVal}>{v || "-"}</Text>
          </View>
        ))}
      </View>

      {/* 사건 정보 */}
      <View style={dt.section}>
        <Text style={dt.sectionTitle}>📁 사건 정보</Text>
        {[
          ["사건 유형", c.caseType],
          ["사건 번호", c.caseNum],
          [
            "날짜·시간",
            c.date && c.time ? `${c.date} ${c.time}` : c.date || c.time,
          ],
          ["장소", c.location],
          ["소요 시간", c.duration],
        ]
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <View key={k} style={dt.infoRow}>
              <Text style={dt.infoKey}>{k}</Text>
              <Text style={dt.infoVal}>{v}</Text>
            </View>
          ))}
      </View>

      {/* 대화 기록 */}
      <View style={dt.section}>
        <View style={dt.sectionTitleRow}>
          <Text style={dt.sectionTitle}>💬 수어 통역 대화 기록</Text>
          <View style={dt.countBadge}>
            <Text style={dt.countBadgeTxt}>
              {signs.length + voice.length}개
            </Text>
          </View>
        </View>
        {signs.length === 0 && voice.length === 0 ? (
          <View style={dt.chatEmpty}>
            <Text style={dt.chatEmptyTxt}>💬 대화 기록이 없습니다.</Text>
          </View>
        ) : (
          <View style={dt.chatList}>
            {signs.map((s, i) => (
              <View key={"s" + i} style={dt.bubbleWrapLeft}>
                <Text style={dt.bubbleAvatar}>🧏</Text>
                <View>
                  <Text style={dt.bubbleName}>
                    {sb.name} ({sb.role || "당사자"})
                  </Text>
                  <View style={[dt.bubble, dt.bubbleSign]}>
                    <Text style={dt.bubbleTxt}>{s}</Text>
                  </View>
                </View>
              </View>
            ))}
            {voice.map((v, i) => (
              <View key={"v" + i} style={dt.bubbleWrapRight}>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={dt.bubbleName}>
                    {of_.name} {of_.rank || "경찰관"}
                  </Text>
                  <View style={[dt.bubble, dt.bubbleVoice]}>
                    <Text style={[dt.bubbleTxt, { color: "#7f1d1d" }]}>
                      {v}
                    </Text>
                  </View>
                </View>
                <Text style={dt.bubbleAvatar}>👮</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 영상 목록 */}
      {allVids.length > 0 && (
        <View style={dt.section}>
          <Text style={dt.sectionTitle}>🎬 녹화 영상 ({allVids.length}개)</Text>
          {allVids.map((vid, vi) => (
            <View key={vid} style={dt.videoCard}>
              <Text style={dt.videoLabel}>영상 {vi + 1}</Text>
              <View style={dt.videoThumb}>
                <Text style={{ fontSize: 28, opacity: 0.4 }}>🎬</Text>
                <Text style={dt.videoThumbTxt}>ID: {vid}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 액션 버튼 */}
      <View style={dt.actions}>
        <TouchableOpacity style={dt.btnPrimary}>
          <Text style={dt.btnPrimaryTxt}>📄 수어 통역 조서 출력</Text>
        </TouchableOpacity>
        <TouchableOpacity style={dt.btnSecondary}>
          <Text style={dt.btnSecondaryTxt}>🔏 디지털 서명 적용</Text>
        </TouchableOpacity>
        <TouchableOpacity style={dt.btnSecondary}>
          <Text style={dt.btnSecondaryTxt}>📥 증거 저장</Text>
        </TouchableOpacity>
        {c.flagged && (
          <TouchableOpacity style={dt.btnDanger}>
            <Text style={dt.btnDangerTxt}>🚨 검토 요청</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

// ── 목록 화면 ─────────────────────────────────────────────────
export default function PoliceCasePage({
  cases = [],
  loading = false,
  displayName = "",
  profile = null,
  onRegister,
}: Props) {
  const [selected, setSelected] = useState<CaseItem | null>(null);
  const [search, setSearch] = useState("");

  if (selected)
    return <CaseDetail c={selected} onBack={() => setSelected(null)} />;

  const filtered = cases.filter(
    (c) =>
      c.subject?.name?.includes(search) ||
      c.id?.includes(search) ||
      c.caseType?.includes(search) ||
      c.caseNum?.includes(search),
  );

  const total = cases.length;
  const flagged = cases.filter((c) => c.flagged).length;
  const complete = cases.filter((c) => c.statusType === "ok").length;

  const officeName = displayName || profile?.officeName || "경찰서";
  const orgCode = profile?.orgCode || "-";
  const address = profile?.address || "-";
  const addressDetail = profile?.addressDetail || "";
  const zonecode = profile?.zonecode || "";
  const email = profile?.email || "-";

  return (
    <ScrollView
      style={ls.scroll}
      contentContainerStyle={ls.body}
      showsVerticalScrollIndicator={false}
    >
      {/* 헤더 */}
      <View style={ls.pageHeader}>
        <View
          style={[ls.officialBar, { backgroundColor: "rgba(220,38,38,0.08)" }]}
        >
          <Text style={[ls.officialBarTxt, { color: ACCENT }]}>
            👮 대한민국 경찰청
          </Text>
        </View>
        <View style={ls.titleRow}>
          <Text style={ls.pageTitle}>청각장애인 당사자 목록</Text>
          {onRegister && (
            <TouchableOpacity
              style={[ls.registerBtn, { backgroundColor: ACCENT }]}
              onPress={onRegister}
            >
              <Text style={ls.registerBtnTxt}>✏️ 새 대화 기록 등록</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={ls.pageSubtitle}>
          이름을 선택하면 당사자와 담당 경찰관 정보를 확인할 수 있습니다.
        </Text>
      </View>

      {/* 기관 정보 */}
      <View
        style={[
          ls.orgCard,
          {
            borderColor: ACCENT + "44",
            backgroundColor: "rgba(220,38,38,0.04)",
          },
        ]}
      >
        <Text style={[ls.orgCardTitle, { color: ACCENT }]}>🏢 기관 정보</Text>
        {[
          ["경찰서명", officeName],
          ["경찰청 기관 코드", orgCode],
          [
            "주소",
            zonecode
              ? `📮 ${zonecode}  ${address}${addressDetail ? ` ${addressDetail}` : ""}`
              : `${address}${addressDetail ? ` ${addressDetail}` : ""}`,
          ],
          ["담당자 이메일", email],
        ].map(([k, v]) => (
          <View key={k} style={ls.orgRow}>
            <Text style={ls.orgKey}>{k}</Text>
            <Text style={ls.orgVal}>{v}</Text>
          </View>
        ))}
      </View>

      {/* 통계 */}
      <View style={ls.statsRow}>
        {[
          { label: "전체 사건", val: `${total}건`, color: C.text },
          { label: "조사 완료", val: `${complete}건`, color: C.green },
          { label: "검토 필요", val: `${flagged}건`, color: C.red },
        ].map((st, i) => (
          <View
            key={i}
            style={[
              ls.statCard,
              i < 2 && { borderRightWidth: 1, borderRightColor: C.border },
            ]}
          >
            <Text style={ls.statLabel}>{st.label}</Text>
            <Text style={[ls.statVal, { color: st.color }]}>{st.val}</Text>
          </View>
        ))}
      </View>

      {/* 검색 */}
      <View style={ls.searchWrap}>
        <Text style={ls.searchIcon}>🔍</Text>
        <TextInput
          style={ls.searchInput}
          placeholder="이름, 사건 유형, 사건번호로 검색..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* 목록 */}
      <View style={ls.list}>
        {loading && (
          <View style={ls.emptyBox}>
            <ActivityIndicator color={ACCENT} />
            <Text style={ls.emptyTxt}>케이스를 불러오는 중...</Text>
          </View>
        )}
        {!loading && filtered.length === 0 && (
          <View style={ls.emptyBox}>
            <Text style={ls.emptyIcon}>📋</Text>
            <Text style={ls.emptyTxt}>
              {cases.length === 0
                ? "등록된 케이스가 없습니다."
                : "검색 결과가 없습니다."}
            </Text>
            {cases.length === 0 && (
              <Text style={ls.emptyHint}>
                번역기에서 대화 후 저장하기를 누르면 여기에 표시됩니다.
              </Text>
            )}
          </View>
        )}
        {filtered.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[ls.caseCard, c.flagged && ls.caseCardFlagged]}
            onPress={() => setSelected(c)}
            activeOpacity={0.8}
          >
            <Text style={ls.caseAvatar}>{c.subject?.avatar || "🧏"}</Text>
            <View style={ls.caseBody}>
              <View style={ls.caseNameRow}>
                <Text style={ls.caseName}>{c.subject?.name}</Text>
                {c.subject?.role && (
                  <View style={ls.roleTag}>
                    <Text style={ls.roleTagTxt}>{c.subject.role}</Text>
                  </View>
                )}
              </View>
              <View style={ls.caseMeta}>
                {c.caseType && (
                  <Text style={ls.caseMetaTxt}>📁 {c.caseType}</Text>
                )}
                {c.caseNum && (
                  <Text style={ls.caseMetaTxt}>🔢 {c.caseNum}</Text>
                )}
                {c.date && <Text style={ls.caseMetaTxt}>📅 {c.date}</Text>}
                {c.officer?.station && (
                  <Text style={ls.caseMetaTxt}>📍 {c.officer.station}</Text>
                )}
              </View>
              <View style={ls.caseBadge}>
                <Text style={ls.caseBadgeTxt}>POLICE</Text>
              </View>
            </View>
            <View style={ls.caseRight}>
              <View
                style={[
                  ls.statusBadge,
                  c.statusType === "ok"
                    ? ls.statusOk
                    : c.statusType === "warn"
                      ? ls.statusWarn
                      : ls.statusPending,
                ]}
              >
                <Text
                  style={[
                    ls.statusTxt,
                    c.statusType === "ok"
                      ? ls.statusOkTxt
                      : c.statusType === "warn"
                        ? ls.statusWarnTxt
                        : ls.statusPendingTxt,
                  ]}
                >
                  {c.flagged ? "⚠️ " : ""}
                  {c.status}
                </Text>
              </View>
              <Text style={ls.caseOfficer}>
                담당: {c.officer?.name} {c.officer?.rank}
              </Text>
              <Text style={{ color: ACCENT, fontSize: 18 }}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ── 상세 스타일 ───────────────────────────────────────────────
const dt = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  body: { padding: 16, gap: 14, paddingBottom: 40 },

  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.accentBorder,
    padding: 16,
  },
  detailId: { fontSize: 18, fontWeight: "900", color: C.text },
  detailNum: { fontSize: 13, color: C.sub, marginTop: 4 },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusOk: { backgroundColor: "#e8fff4", borderColor: "#a7f3d0" },
  statusWarn: { backgroundColor: "#fff7ed", borderColor: "#fed7aa" },
  statusPending: { backgroundColor: "#f0f0ff", borderColor: "#c7d2fe" },
  statusTxt: { fontSize: 12, fontWeight: "700" },
  statusOkTxt: { color: C.green },
  statusWarnTxt: { color: "#ea580c" },
  statusPendingTxt: { color: "#6366f1" },

  personCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.accentBorder,
    overflow: "hidden",
  },
  officerCard: { borderColor: "rgba(37,99,235,0.2)" },
  personHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: C.accentLight,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  personEmoji: { fontSize: 32 },
  personRole: { fontSize: 11, color: C.sub, fontWeight: "600" },
  personName: { fontSize: 16, fontWeight: "800", color: C.text },

  section: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: C.text,
    padding: 14,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  countBadge: {
    backgroundColor: "rgba(220,38,38,0.1)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeTxt: { fontSize: 11, fontWeight: "700", color: ACCENT },

  infoRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f3f8",
  },
  infoKey: { width: 90, fontSize: 12, fontWeight: "600", color: C.sub },
  infoVal: { flex: 1, fontSize: 13, color: C.text },

  chatEmpty: { padding: 24, alignItems: "center" },
  chatEmptyTxt: { color: "#bbb", fontSize: 13 },
  chatList: { padding: 14, gap: 10 },
  bubbleWrapLeft: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bubbleWrapRight: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    gap: 8,
  },
  bubbleAvatar: { fontSize: 22, marginTop: 2 },
  bubbleName: {
    fontSize: 10,
    fontWeight: "700",
    color: C.sub,
    marginBottom: 3,
  },
  bubble: { maxWidth: 260, padding: 10, borderRadius: 12 },
  bubbleSign: {
    backgroundColor: "rgba(220,38,38,0.07)",
    borderBottomLeftRadius: 2,
  },
  bubbleVoice: { backgroundColor: "#fee2e2", borderBottomRightRadius: 2 },
  bubbleTxt: { fontSize: 13, color: C.text, lineHeight: 18 },

  videoCard: {
    margin: 14,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: C.dark,
    borderWidth: 1,
    borderColor: "#2a2a38",
  },
  videoLabel: { fontSize: 11, fontWeight: "700", color: "#6060a0", padding: 8 },
  videoThumb: {
    height: 70,
    backgroundColor: "#0a0a12",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  videoThumbTxt: { fontSize: 10, color: "#404058" },

  actions: { gap: 8 },
  btnPrimary: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnPrimaryTxt: { color: "#fff", fontSize: 14, fontWeight: "700" },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: C.card,
  },
  btnSecondaryTxt: { color: C.sub, fontSize: 14, fontWeight: "700" },
  btnDanger: {
    backgroundColor: "#fef2f2",
    borderWidth: 1.5,
    borderColor: "#fca5a5",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnDangerTxt: { color: C.red, fontSize: 14, fontWeight: "700" },
});

// ── 목록 스타일 ───────────────────────────────────────────────
const ls = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  body: { padding: 16, gap: 14, paddingBottom: 40 },

  pageHeader: { gap: 8 },
  officialBar: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  officialBarTxt: { fontSize: 12, fontWeight: "700" },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -0.5,
  },
  pageSubtitle: { fontSize: 13, color: C.sub },
  registerBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  registerBtnTxt: { color: "#fff", fontSize: 13, fontWeight: "700" },

  orgCard: { borderRadius: 14, borderWidth: 1.5, padding: 16, gap: 8 },
  orgCardTitle: { fontSize: 13, fontWeight: "800", marginBottom: 4 },
  orgRow: { flexDirection: "row" },
  orgKey: { width: 110, fontSize: 12, fontWeight: "600", color: C.sub },
  orgVal: { flex: 1, fontSize: 12, color: C.text },

  statsRow: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: "hidden",
  },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  statLabel: { fontSize: 11, color: C.sub, fontWeight: "600" },
  statVal: { fontSize: 18, fontWeight: "900" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: C.text },

  list: { gap: 10 },
  emptyBox: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 50,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  emptyIcon: { fontSize: 36, opacity: 0.35 },
  emptyTxt: { fontSize: 14, fontWeight: "700", color: C.sub },
  emptyHint: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "center",
    paddingHorizontal: 20,
  },

  caseCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  caseCardFlagged: { borderColor: "#fca5a5", backgroundColor: "#fff5f5" },
  caseAvatar: { fontSize: 28 },
  caseBody: { flex: 1, gap: 4 },
  caseNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  caseName: { fontSize: 15, fontWeight: "800", color: C.text },
  roleTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: "rgba(220,38,38,0.08)",
  },
  roleTagTxt: { fontSize: 10, fontWeight: "700", color: ACCENT },
  caseMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  caseMetaTxt: { fontSize: 11, color: C.sub },
  caseBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(220,38,38,0.08)",
  },
  caseBadgeTxt: {
    fontSize: 9,
    fontWeight: "800",
    color: ACCENT,
    letterSpacing: 1,
  },
  caseRight: { alignItems: "flex-end", gap: 6 },
  caseOfficer: { fontSize: 11, color: C.sub },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusOk: { backgroundColor: "#e8fff4", borderColor: "#a7f3d0" },
  statusWarn: { backgroundColor: "#fff7ed", borderColor: "#fed7aa" },
  statusPending: { backgroundColor: "#f0f0ff", borderColor: "#c7d2fe" },
  statusTxt: { fontSize: 11, fontWeight: "700" },
  statusOkTxt: { color: "#10b981" },
  statusWarnTxt: { color: "#ea580c" },
  statusPendingTxt: { color: "#6366f1" },
});
