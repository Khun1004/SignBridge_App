// ══════════════════════════════════════════════════════════════
//  components/Translate/AvatarView.tsx
//  웹의 Person3D + AIPanel을 React Native에서 구현
//  WebView 안에 Three.js + FBX 아바타를 임베드해 렌더링
//
//  필요 패키지:
//    expo install react-native-webview
// ══════════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

// ─── 색상 토큰 ────────────────────────────────────────────────
const C = {
  accent: "#5b5ef4",
  sub: "#64748b",
  border: "#e4e8f2",
  card: "#ffffff",
  bg: "#f0f2fa",
};

// ─── 포즈 목록 (웹 Person3D와 동일) ──────────────────────────
export type PoseName =
  | "idle"
  | "hello"
  | "point"
  | "thanks"
  | "thumbUp"
  | "fist"
  | "love";

interface AvatarViewProps {
  pose?: PoseName;
  playing?: boolean;
  onPoseEnd?: () => void;
}

// ─── Three.js + FBX 아바타를 WebView에 임베드하는 HTML ────────
// public/animations/ 폴더의 FBX 파일은 앱 assets에 번들되거나
// 원격 URL로 제공되어야 합니다.
// FBX_BASE_URL을 실제 서버 URL 또는 로컬 파일 경로로 변경하세요.
const FBX_BASE_URL = "https://your-server.com/animations/"; // ← 실제 URL로 교체

function buildAvatarHTML(pose: PoseName, playing: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: transparent; overflow: hidden; }
  canvas { display: block; width: 100% !important; height: 100% !important; }
  #status {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    color: #94a3b8; font-size: 13px; font-family: sans-serif; text-align: center;
    pointer-events: none;
  }
</style>
</head>
<body>
<div id="status">🤟 아바타 로딩 중...</div>
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
  }
}
</script>
<script type="module">
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const POSE_TO_FBX = {
  idle:    'Idle.fbx',
  hello:   'Hello.fbx',
  point:   'Point.fbx',
  thanks:  'Thanks.fbx',
  thumbUp: 'ThumbUp.fbx',
  fist:    'Sorry.fbx',
  love:    'Love.fbx',
};
const FBX_BASE = '${FBX_BASE_URL}';

let scene, camera, renderer, mixer, clock, currentAction;
const animCache = {};
let currentPose = '${pose}';
let isPlaying   = ${playing};

function init() {
  scene = new THREE.Scene();
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  // 조명
  scene.add(new THREE.AmbientLight(0xffffff, 2.2));
  const kl = new THREE.DirectionalLight(0xffffff, 1.8);
  kl.position.set(2, 5, 5); scene.add(kl);
  const fl = new THREE.DirectionalLight(0xffffff, 1.0);
  fl.position.set(-3, 3, 4); scene.add(fl);

  // Idle.fbx 로드 (캐릭터 메시)
  new FBXLoader().load(FBX_BASE + 'Idle.fbx', (fbx) => {
    // 모델 정규화
    const box  = new THREE.Box3().setFromObject(fbx);
    const size = box.getSize(new THREE.Vector3());
    fbx.scale.setScalar(2.7 / Math.max(size.y, 0.001));
    const box2   = new THREE.Box3().setFromObject(fbx);
    const center = box2.getCenter(new THREE.Vector3());
    fbx.position.set(-center.x, -box2.min.y, -center.z);
    scene.add(fbx);

    // 카메라 맞추기
    const box3 = new THREE.Box3().setFromObject(fbx);
    const sz   = box3.getSize(new THREE.Vector3());
    const ctr  = box3.getCenter(new THREE.Vector3());
    const dist = ((sz.y / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) * 1.5;
    camera.position.set(ctr.x, ctr.y + sz.y * 0.1, ctr.z + dist);
    camera.lookAt(ctr.x, ctr.y, ctr.z);

    mixer = new THREE.AnimationMixer(fbx);
    if (fbx.animations?.length) {
      animCache['Idle.fbx'] = fbx.animations[0];
    }

    document.getElementById('status').style.display = 'none';
    playPose(currentPose);
  }, undefined, (e) => {
    document.getElementById('status').textContent = '⚠️ 아바타 로드 실패';
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (mixer) mixer.update(clock.getDelta());
  renderer.render(scene, camera);
}

function crossFadeTo(clip) {
  if (!mixer || !clip) return;
  const next = mixer.clipAction(clip);
  next.loop = THREE.LoopRepeat;
  next.clampWhenFinished = false;
  if (currentAction && currentAction !== next) {
    next.reset().play();
    currentAction.crossFadeTo(next, 0.35, true);
  } else if (!currentAction) {
    next.reset().play();
  }
  currentAction = next;
  currentAction.paused = !isPlaying;
}

function playPose(poseName) {
  if (!mixer) return;
  const fbxFile = POSE_TO_FBX[poseName] || POSE_TO_FBX.idle;
  if (animCache[fbxFile]) { crossFadeTo(animCache[fbxFile]); return; }
  new FBXLoader().load(FBX_BASE + fbxFile, (fbx) => {
    if (!fbx.animations?.length) return;
    const clip = fbx.animations[0];
    animCache[fbxFile] = clip;
    if ((POSE_TO_FBX[currentPose] || POSE_TO_FBX.idle) === fbxFile) crossFadeTo(clip);
  });
}

// React Native → WebView 메시지 수신
window.addEventListener('message', (e) => {
  try {
    const msg = JSON.parse(e.data);
    if (msg.type === 'setPose') {
      currentPose = msg.pose;
      playPose(msg.pose);
    } else if (msg.type === 'setPlaying') {
      isPlaying = msg.playing;
      if (currentAction) currentAction.paused = !isPlaying;
    }
  } catch {}
});

init();
</script>
</body>
</html>`;
}

// ══════════════════════════════════════════════════════════════
//  AvatarView 컴포넌트
// ══════════════════════════════════════════════════════════════
export default function AvatarView({
  pose = "idle",
  playing = true,
  onPoseEnd,
}: AvatarViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [loaded, setLoaded] = useState(false);

  // pose 또는 playing이 바뀌면 WebView에 메시지 전송
  useEffect(() => {
    if (!loaded) return;
    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({ type: 'setPose', pose: '${pose}' })
      })); true;
    `);
  }, [pose, loaded]);

  useEffect(() => {
    if (!loaded) return;
    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({ type: 'setPlaying', playing: ${playing} })
      })); true;
    `);
  }, [playing, loaded]);

  const html = buildAvatarHTML(pose, playing);

  return (
    <View style={st.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html }}
        style={[st.webview, { backgroundColor: "transparent" }]} // ← style 안으로 이동
        onLoad={() => setLoaded(true)}
        scrollEnabled={false}
        bounces={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
      />
      {!loaded && (
        <View style={st.loadingOverlay}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={st.loadingTxt}>아바타 로딩 중...</Text>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    width: "100%",
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f8f9ff",
    borderWidth: 1,
    borderColor: C.border,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#f8f9ff",
  },
  loadingTxt: {
    fontSize: 13,
    color: C.sub,
  },
});
