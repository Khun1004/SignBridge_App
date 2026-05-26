// ══════════════════════════════════════════════════════════════
//  AddressSearchModal.tsx
//  - 열리자마자 바로 주소 검색 시작 (우편번호 검색 버튼 없음)
// ══════════════════════════════════════════════════════════════
import React, { useRef } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewMessageEvent } from "react-native-webview";

export interface AddressData {
  zonecode: string;
  address: string;
  jibunAddress: string;
  buildingName: string;
  apartment: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (data: AddressData, detail: string) => void;
}

const HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body {
      width:100%; height:100%;
      background:#fff;
      font-family:-apple-system,'Malgun Gothic',sans-serif;
      overflow:hidden;
    }

    /* 로딩 */
    #init-screen {
      display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      height:100vh; gap:14px;
      color:#999; font-size:13px;
    }
    .spinner {
      width:32px; height:32px;
      border:3px solid #e8e8f0;
      border-top-color:#7c6fff;
      border-radius:50%;
      animation:spin .8s linear infinite;
    }
    @keyframes spin { to { transform:rotate(360deg) } }

    /* 메인 UI */
    #main-ui { display:none; height:100vh; flex-direction:column; }
    #main-ui.show { display:flex; }

    /* 상단 입력 영역 — 주소 선택 후에만 표시 */
    .top {
      padding:10px 14px 8px;
      border-bottom:1px solid #e8e8f0;
      background:#fff;
      flex-shrink:0;
      display:none;  /* 처음엔 숨김 */
    }
    .top.show { display:block; }

    .addr-row { display:flex; gap:6px; margin-bottom:6px; }
    .detail-row { display:flex; gap:6px; }

    input {
      height:36px; border:1.5px solid #e0e0f0;
      border-radius:8px; padding:0 10px;
      font-size:13px; color:#1a1a2e;
      background:#fafafe; outline:none;
      font-family:inherit;
    }
    input:focus { border-color:#7c6fff; }
    input[readonly] { background:#f3f3f8; color:#555; }
    input::placeholder { color:#c0c0d0; }

    #inp-address  { flex:1.4; min-width:0; }
    #inp-jibun    { flex:1;   min-width:0; }
    #inp-detail   { flex:1.2; min-width:0; }
    #inp-ref      { flex:0.7; min-width:0; }

    /* 카카오 embed 레이어 */
    #postcode-layer {
      flex:1; overflow:hidden;
      display:block;
    }

    /* 완료 배너 */
    #done-banner {
      display:none; padding:10px 14px;
      background:rgba(124,111,255,.07);
      border-bottom:1px solid rgba(124,111,255,.15);
      font-size:13px; color:#7c6fff; font-weight:600;
      flex-shrink:0;
    }
    #done-banner.show { display:block; }

    /* 확인 버튼 */
    #btn-confirm {
      display:none; margin:10px 14px;
      height:44px; background:#7c6fff; color:#fff;
      border:none; border-radius:10px;
      font-size:15px; font-weight:700;
      cursor:pointer; font-family:inherit;
      flex-shrink:0;
      -webkit-tap-highlight-color:rgba(0,0,0,0);
    }
    #btn-confirm.show { display:block; }

    /* 에러 */
    #error-screen {
      display:none; flex-direction:column;
      align-items:center; justify-content:center;
      height:100vh; gap:12px; padding:20px;
      text-align:center; color:#ef4444; font-size:13px;
    }
    #error-screen.show { display:flex; }

    .btn-retry {
      height:36px; padding:0 14px;
      background:#7c6fff; color:#fff;
      border:none; border-radius:8px;
      font-size:13px; font-weight:700;
      cursor:pointer; font-family:inherit;
      margin-top:8px;
    }
  </style>
</head>
<body>

  <!-- 로딩 -->
  <div id="init-screen">
    <div class="spinner"></div>
    <span>주소 검색 서비스 불러오는 중…</span>
  </div>

  <!-- 에러 -->
  <div id="error-screen">
    <span style="font-size:36px">❌</span>
    <span>네트워크 오류가 발생했습니다.<br/>인터넷 연결을 확인해주세요.</span>
    <button class="btn-retry" onclick="loadKakao()">다시 시도</button>
  </div>

  <!-- 메인 UI -->
  <div id="main-ui">
    <!-- 주소 선택 후 표시되는 상단 영역 -->
    <div class="top" id="addr-top">
      <div class="addr-row">
        <input id="inp-address" placeholder="도로명주소" readonly/>
        <input id="inp-jibun"   placeholder="지번주소"   readonly/>
      </div>
      <div class="detail-row">
        <input id="inp-detail" placeholder="상세주소 입력" oninput="syncDetail(this.value)"/>
        <input id="inp-ref"    placeholder="참고항목"      readonly/>
      </div>
    </div>

    <div id="done-banner">✅ 주소 선택 완료. 상세주소 입력 후 확인을 눌러주세요.</div>
    <button id="btn-confirm" onclick="confirmAddress()">이 주소로 설정 →</button>
    <div id="postcode-layer"></div>
  </div>

  <script>
    var _result = null

    function sendToRN(obj) {
      var msg = JSON.stringify(obj)
      try {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(msg); return
        }
      } catch(e) {}
      window.postMessage(msg, '*')
    }

    function syncDetail(v) {
      if (_result) _result.addressDetail = v
    }

    function showMain() {
      document.getElementById('init-screen').style.display = 'none'
      document.getElementById('main-ui').className = 'show'
      // 열리자마자 바로 주소 검색 시작
      openPostcode()
    }

    function showError() {
      document.getElementById('init-screen').style.display = 'none'
      document.getElementById('error-screen').className = 'show'
    }

    function loadKakao() {
      document.getElementById('error-screen').className = ''
      document.getElementById('init-screen').style.display = 'flex'

      var s = document.createElement('script')
      s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
      s.onload  = function() { showMain() }
      s.onerror = function() { showError() }
      document.head.appendChild(s)
    }

    function openPostcode() {
      var layer = document.getElementById('postcode-layer')
      if (window._embedded) return
      window._embedded = true

      var topH = document.querySelector('.top')?.offsetHeight || 0
      var bannerH = document.getElementById('done-banner')?.offsetHeight || 0
      var confirmH = document.getElementById('btn-confirm')?.offsetHeight || 0
      var h = window.innerHeight - topH - bannerH - confirmH - 20

      new daum.Postcode({
        oncomplete: function(data) {
          // 상단 입력 영역 표시
          document.getElementById('addr-top').className = 'top show'
          document.getElementById('inp-address').value = data.roadAddress  || ''
          document.getElementById('inp-jibun').value   = data.jibunAddress || ''
          document.getElementById('inp-ref').value     = data.buildingName || ''
          document.getElementById('inp-detail').value  = ''
          document.getElementById('inp-detail').focus()

          _result = {
            zonecode:      data.zonecode,
            address:       data.roadAddress  || data.jibunAddress || '',
            jibunAddress:  data.jibunAddress || '',
            buildingName:  data.buildingName || '',
            apartment:     data.apartment    || 'N',
            addressDetail: '',
          }

          layer.style.display = 'none'
          document.getElementById('done-banner').className = 'show'
          document.getElementById('btn-confirm').className = 'show'
        },
        width:     '100%',
        height:    h,
        animation: true,
        autoClose: false,
      }).embed(layer)
    }

    function confirmAddress() {
      if (!_result) return
      _result.addressDetail = document.getElementById('inp-detail').value
      sendToRN(_result)
    }

    // 자동 시작
    loadKakao()
  </script>
</body>
</html>`;

export default function AddressSearchModal({
  visible,
  onClose,
  onSelect,
}: Props) {
  const webViewRef = useRef<WebView>(null);

  const handleClose = () => {
    webViewRef.current?.reload();
    onClose();
  };

  const handleMessage = (e: WebViewMessageEvent) => {
    try {
      const raw = e.nativeEvent.data;
      if (!raw || !raw.startsWith("{")) return;
      const data = JSON.parse(raw);
      if (!data.zonecode) return;
      onSelect(
        {
          zonecode: data.zonecode,
          address: data.address,
          jibunAddress: data.jibunAddress,
          buildingName: data.buildingName,
          apartment: data.apartment,
        },
        data.addressDetail || "",
      );
      handleClose();
    } catch {
      /* ignore */
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
      statusBarTranslucent={false}
    >
      <SafeAreaView style={s.safe} edges={["top"]}>
        {/* 헤더 */}
        <View style={s.header}>
          <View style={{ width: 36 }} />
          <Text style={s.title}>주소 검색</Text>
          <TouchableOpacity
            style={s.closeBtn}
            onPress={handleClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        <WebView
          ref={webViewRef}
          source={{ html: HTML, baseUrl: "https://t1.daumcdn.net" }}
          onMessage={handleMessage}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          allowsInlineMediaPlayback
          keyboardDisplayRequiresUserAction={false}
          style={s.webview}
        />
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8f0",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a2e",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: "#f3f3f8",
    alignItems: "center",
    justifyContent: "center",
  },
  closeTxt: { fontSize: 14, color: "#888", fontWeight: "700" },
  webview: { flex: 1 },
});
