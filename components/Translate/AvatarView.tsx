// ══════════════════════════════════════════════════════════════
//  components/Translate/AvatarView.tsx
//  - FBX URL을 api.ts의 SERVER_IP에서 가져옴
//  - pose/playing 변경 시 WebView 메시지로 즉시 동기화
// ══════════════════════════════════════════════════════════════
import { SERVER_IP } from "@/components/api/api";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const C = {
  accent: "#5b5ef4",
  sub: "#64748b",
  border: "#e4e8f2",
};

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

// api.ts의 SERVER_IP를 사용 — IP 한 곳에서만 관리
const FBX_BASE_URL = `http://${SERVER_IP}:8000/animations/`;

const POSE_TO_FBX: Record<PoseName, string> = {
  idle: "Idle.fbx",
  hello: "Hello.fbx",
  point: "Point.fbx",
  thanks: "Thankful.fbx",
  thumbUp: "ThumbUp.fbx",
  fist: "Praying.fbx",
  love: "Love.fbx",
};

function buildAvatarHTML(
  initialPose: PoseName,
  initialPlaying: boolean,
): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:transparent; overflow:hidden; }
  canvas { display:block; width:100% !important; height:100% !important; }
  #status {
    position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
    color:#94a3b8; font-size:13px; font-family:sans-serif; text-align:center;
    pointer-events:none; padding:16px; line-height:1.6;
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

const FBX_BASE    = '${FBX_BASE_URL}';
const POSE_TO_FBX = ${JSON.stringify(POSE_TO_FBX)};

let scene, camera, renderer, mixer, clock, currentAction;
const animCache  = {};
const loadingSet = new Set();
let currentPose  = '${initialPose}';
let isPlaying    = ${initialPlaying};

function init() {
  scene  = new THREE.Scene();
  clock  = new THREE.Clock();
  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 2.2));
  const kl = new THREE.DirectionalLight(0xffffff, 1.8);
  kl.position.set(2, 5, 5); scene.add(kl);
  const fl = new THREE.DirectionalLight(0xffffff, 1.0);
  fl.position.set(-3, 3, 4); scene.add(fl);
  const rl = new THREE.DirectionalLight(0xffffff, 0.8);
  rl.position.set(0, 5, -5); scene.add(rl);

  new FBXLoader().load(
    FBX_BASE + 'Idle.fbx',
    (fbx) => {
      const box  = new THREE.Box3().setFromObject(fbx);
      const size = box.getSize(new THREE.Vector3());
      fbx.scale.setScalar(2.7 / Math.max(size.y, 0.001));
      const box2   = new THREE.Box3().setFromObject(fbx);
      const center = box2.getCenter(new THREE.Vector3());
      fbx.position.set(-center.x, -box2.min.y, -center.z);
      scene.add(fbx);

      const box3 = new THREE.Box3().setFromObject(fbx);
      const sz   = box3.getSize(new THREE.Vector3());
      const ctr  = box3.getCenter(new THREE.Vector3());
      const dist = ((sz.y / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) * 1.5;
      camera.position.set(ctr.x, ctr.y + sz.y * 0.1, ctr.z + dist);
      camera.lookAt(ctr.x, ctr.y, ctr.z);

      mixer = new THREE.AnimationMixer(fbx);
      if (fbx.animations?.length) animCache['Idle.fbx'] = fbx.animations[0];

      document.getElementById('status').style.display = 'none';
      playPose(currentPose);
    },
    undefined,
    () => {
      document.getElementById('status').textContent =
        '⚠️ 아바타 로드 실패\\nserver.py 실행 확인:\\n' + FBX_BASE;
    }
  );

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
  if (loadingSet.has(fbxFile)) return;
  loadingSet.add(fbxFile);
  new FBXLoader().load(
    FBX_BASE + fbxFile,
    (fbx) => {
      loadingSet.delete(fbxFile);
      if (!fbx.animations?.length) return;
      animCache[fbxFile] = fbx.animations[0];
      if ((POSE_TO_FBX[currentPose] || POSE_TO_FBX.idle) === fbxFile)
        crossFadeTo(fbx.animations[0]);
    },
    undefined,
    () => {
      loadingSet.delete(fbxFile);
      const idle = animCache['Idle.fbx'];
      if (idle) crossFadeTo(idle);
    }
  );
}

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

export default function AvatarView({
  pose = "idle",
  playing = true,
  onPoseEnd,
}: AvatarViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [loaded, setLoaded] = useState(false);

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
    const playingVal = playing ? "true" : "false";
    webViewRef.current?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({ type: 'setPlaying', playing: ${playingVal} })
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
        style={st.webview}
        onLoad={() => setLoaded(true)}
        scrollEnabled={false}
        bounces={false}
        allowsInlineMediaPlayback={true}
        javaScriptEnabled={true}
        mixedContentMode="always"
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
  webview: { flex: 1, backgroundColor: "transparent" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#f8f9ff",
  },
  loadingTxt: { fontSize: 13, color: C.sub },
});
