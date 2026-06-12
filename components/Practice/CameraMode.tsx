// components/Practice/CameraMode.tsx
// ── 📷 카메라 모드 — WebView + MediaPipe (웹과 동일한 기능) ──
//
// 웹의 GestureCheck.jsx + SignAnimator.jsx 전체 로직을
// React Native WebView 안에 인라인 HTML로 실행합니다.
// MediaPipe는 CDN에서 로드되므로 실제 기기/에뮬레이터에서만
// 카메라가 동작합니다 (Expo Go 지원 필요: expo-webview).
//
// 의존성 추가 필요:
//   npx expo install react-native-webview
// ──────────────────────────────────────────────────────────────
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { C } from "./PracticeUtils";

// ── 웹뷰에 주입할 전체 HTML ──────────────────────────────────
// GestureCheck.jsx의 핵심 로직을 바닐라 JS + MediaPipe CDN으로 변환
const GESTURE_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
<title>수어 제스처 인식</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,sans-serif}
  body{background:#0f0f1a;color:#fff;min-height:100vh;overflow-x:hidden}
  .wrap{display:flex;flex-direction:column;gap:10px;padding:10px}

  /* 수어 선택 */
  .sign-selector{display:flex;flex-wrap:wrap;gap:6px;padding:8px 0}
  .sign-pill{padding:5px 10px;border-radius:20px;border:1.5px solid #333;
    background:#1a1a2e;color:#ccc;font-size:12px;cursor:pointer;transition:.2s}
  .sign-pill.active{background:#7c6fff;border-color:#7c6fff;color:#fff}
  .sign-pill .diff{font-size:10px;margin-left:4px}

  /* 필터 */
  .filters{display:flex;gap:6px;padding:4px 0}
  .filter-btn{padding:4px 12px;border-radius:12px;border:1px solid #333;
    background:#1a1a2e;color:#888;font-size:11px;cursor:pointer}
  .filter-btn.active{background:#7c6fff;border-color:#7c6fff;color:#fff}

  /* 카메라 */
  .cam-wrap{position:relative;width:100%;aspect-ratio:4/3;background:#000;
    border-radius:12px;overflow:hidden;border:2px solid #1e1e3a}
  video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
  canvas{position:absolute;top:0;left:0;width:100%;height:100%;transform:scaleX(-1)}
  .cam-overlay{position:absolute;inset:0;display:flex;flex-direction:column;
    align-items:center;justify-content:center;gap:12px;background:rgba(0,0,0,.7)}
  .cam-overlay h2{font-size:22px;font-weight:900;color:#fff}
  .cam-overlay p{font-size:13px;color:#aaa;text-align:center;padding:0 16px}
  .success-overlay{position:absolute;inset:0;background:rgba(16,185,129,.5);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
  .success-check{font-size:64px}
  .live-badge{position:absolute;top:8px;right:8px;background:rgba(16,185,129,.9);
    border-radius:20px;padding:4px 10px;font-size:11px;font-weight:700;
    display:flex;align-items:center;gap:5px}
  .live-dot{width:7px;height:7px;border-radius:50%;background:#fff;
    animation:pulse 1s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

  /* hold ring */
  .hold-wrap{position:absolute;bottom:10px;right:10px}
  .hold-ring{width:52px;height:52px}
  .hold-pct{position:absolute;inset:0;display:flex;align-items:center;
    justify-content:center;font-size:11px;font-weight:700;color:#10b981}

  /* 동작 단계 */
  .phase-box{background:#1a1a2e;border-radius:10px;padding:10px;margin-top:8px}
  .phase-title{font-size:11px;color:#7c6fff;font-weight:700;margin-bottom:6px}
  .phase-step{display:flex;align-items:center;gap:8px;padding:5px 0;
    border-bottom:1px solid #252540;font-size:12px}
  .phase-step:last-child{border-bottom:none}
  .step-num{width:22px;height:22px;border-radius:50%;background:#333;
    color:#888;display:flex;align-items:center;justify-content:center;
    font-size:10px;font-weight:700;flex-shrink:0}
  .step-num.done{background:#10b981;color:#fff}
  .step-num.active-pass{background:#7c6fff;color:#fff}
  .step-num.active-wait{background:#f59e0b;color:#fff}
  .step-text{color:#ccc}
  .step-text.done{color:#10b981}
  .step-text.active-pass{color:#a78bfa}

  /* 파라미터 체크 */
  .param-box{background:#1a1a2e;border-radius:10px;padding:10px;margin-top:8px}
  .param-title{font-size:11px;color:#888;font-weight:700;margin-bottom:6px}
  .param-row{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px}
  .param-row .icon{width:18px;text-align:center}
  .param-row.pass .icon::before{content:"✓";color:#10b981}
  .param-row.fail .icon::before{content:"✗";color:#ef4444}
  .param-row.wait .icon::before{content:"·";color:#888}

  /* 버튼 */
  .btn{padding:10px 20px;border-radius:10px;border:none;font-size:14px;
    font-weight:700;cursor:pointer;transition:.2s;width:100%}
  .btn-start{background:#7c6fff;color:#fff}
  .btn-stop{background:#ef4444;color:#fff}
  .btn-next{background:#1e293b;color:#a78bfa;border:1.5px solid #7c6fff}

  /* 수어 정보 */
  .sign-info{background:#1a1a2e;border-radius:10px;padding:12px}
  .sign-info h3{font-size:16px;font-weight:900;color:#fff}
  .sign-info .en{font-size:12px;color:#888;margin-bottom:6px}
  .sign-info .inst{font-size:13px;color:#ccc;line-height:1.6}
  .hand-shape{font-size:32px;margin:4px 0}

  /* AI 피드백 */
  .ai-box{background:#1a1a2e;border:1px solid #7c6fff44;border-radius:10px;padding:12px;margin-top:8px}
  .ai-header{display:flex;align-items:center;gap:6px;font-size:12px;
    color:#7c6fff;font-weight:700;margin-bottom:6px}
  .ai-text{font-size:13px;color:#ccc;line-height:1.7}
  .skel{height:9px;border-radius:4px;background:#252540;margin-bottom:5px;
    animation:shimmer 1.2s infinite}
  .skel.short{width:60%}
  @keyframes shimmer{0%,100%{opacity:.5}50%{opacity:1}}

  /* 히스토리 */
  .history{background:#1a1a2e;border-radius:10px;padding:10px;margin-top:8px}
  .hist-title{font-size:11px;color:#888;margin-bottom:6px;font-weight:700}
  .hist-row{display:flex;align-items:center;gap:8px;padding:4px 0;
    border-bottom:1px solid #252540;font-size:12px}
  .hist-row:last-child{border-bottom:none}
  .hist-label{flex:1;color:#ccc}
  .hist-pass{color:#10b981;font-weight:700}
  .hist-time{color:#555;font-size:10px}

  /* 연속 */
  .streak-badge{display:inline-flex;align-items:center;gap:4px;
    background:#1a1a2e;border-radius:20px;padding:4px 10px;font-size:13px;margin-top:4px}

  /* 로딩 */
  .loading{text-align:center;padding:40px;color:#888}
  .spinner{width:32px;height:32px;border:3px solid #333;border-top-color:#7c6fff;
    border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px}
  @keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="wrap">
  <div id="header">
    <div class="filters" id="filterBtns"></div>
    <div class="sign-selector" id="signSelector"></div>
  </div>

  <div class="sign-info" id="signInfo"></div>

  <div class="cam-wrap">
    <video id="video" playsinline muted></video>
    <canvas id="canvas"></canvas>
    <div class="cam-overlay" id="overlay">
      <h2 id="overlayLabel">📷</h2>
      <p id="overlayDesc">수어를 선택하고 카메라를 시작하세요</p>
      <button class="btn btn-start" id="startBtn" onclick="startCamera()" style="width:auto;padding:10px 24px">
        📷 카메라 시작
      </button>
    </div>
  </div>

  <div id="camControls"></div>
  <div id="phaseBox"></div>
  <div id="paramBox"></div>
  <div id="aiFbBox"></div>
  <div id="historyBox"></div>
</div>

<script>
// ── 수어 데이터 ─────────────────────────────────────────────
const GESTURE_SIGNS = [
  {id:'g01',cat:'greet',label:'안녕하세요',english:'Hello',color:'#7c6fff',difficulty:'easy',
   instruction:'오른손을 편 채 관자놀이에서 쓸어내린 후, 양손 주먹을 가슴 앞으로 내리세요.',
   checker:'hello',emoji:'👋',
   checkParams:{수형:'B형(편손)→S형(주먹)',수위:'관자놀이→가슴',수동:'쓸어내리기+멈춤'}},
  {id:'g02',cat:'greet',label:'감사합니다',english:'Thank you',color:'#7c6fff',difficulty:'easy',
   instruction:'왼손을 펴서 가슴 앞에 눕히고, 오른손도 펴서 왼손 위에 올린 뒤 오른손 날로 왼손 등을 두 번 두드립니다.',
   checker:'thankyou',emoji:'🙏',
   checkParams:{수형:'편손(양손)',수위:'가슴 앞',수동:'오른손 날로 두드리기 2회'}},
  {id:'e01',cat:'emergency',label:'도움',english:'Help',color:'#ef4444',difficulty:'medium',
   instruction:'왼손 엄지만 펴서 오른손 손바닥에 가볍게 두 번 두드립니다.',
   checker:'help',emoji:'🆘',
   checkParams:{수형:'왼엄지+오른편손',수위:'가슴 앞',수동:'엄지로 두드리기 ×2'}},
  {id:'e03',cat:'emergency',label:'위험',english:'Danger',color:'#ef4444',difficulty:'medium',
   instruction:'오른손을 C형으로 구부려 가슴을 가볍게 두 번 두드립니다.',
   checker:'danger',emoji:'⚠️',
   checkParams:{수형:'C형(구형)',수위:'가슴',수동:'가슴 두드리기 2회'}},
  {id:'f23',cat:'feeling',label:'좋다',english:'Good',color:'#ec4899',difficulty:'easy',
   instruction:'한 손으로 엄지손가락만 위로 세웁니다 👍',
   checker:'good',emoji:'👍',
   checkParams:{수형:'엄지 위로',수위:'가슴 앞',수동:'유지'}},
  {id:'f24',cat:'feeling',label:'싫다',english:'Dislike',color:'#ec4899',difficulty:'easy',
   instruction:'한 손으로 엄지손가락을 아래로 향하게 합니다 👎',
   checker:'dislike',emoji:'👎',
   checkParams:{수형:'엄지 아래로',수위:'가슴 앞',수동:'유지'}},
  {id:'q15',cat:'question',label:'뭐',english:'What',color:'#8b5cf6',difficulty:'easy',
   instruction:'손바닥이 밖을 향하게 검지를 좌우로 흔듭니다.',
   checker:'what',emoji:'❓',
   checkParams:{수형:'1형(검지)',수위:'몸 앞',수동:'좌우 흔들기'}},
  {id:'a19',cat:'answer',label:'네',english:'Yes',color:'#10b981',difficulty:'easy',
   instruction:'고개를 위아래로 한 번 끄덕입니다.',
   checker:'yes',emoji:'✅',
   checkParams:{수형:'고개 끄덕임',수위:'머리',수동:'위아래 끄덕이기'}},
  {id:'a26',cat:'answer',label:'아니다',english:'No',color:'#10b981',difficulty:'easy',
   instruction:'손바닥이 밖을 보게 하여 좌우로 흔듭니다.',
   checker:'no',emoji:'❌',
   checkParams:{수형:'편손',수위:'몸 앞',수동:'좌우 흔들기'}},
  {id:'n27',cat:'number',label:'1',english:'One',color:'#6366f1',difficulty:'easy',
   instruction:'검지만 세우고 나머지는 주먹.',
   checker:'one',emoji:'1️⃣',
   checkParams:{수형:'검지만',수동:'정지'}},
  {id:'n28',cat:'number',label:'2',english:'Two',color:'#6366f1',difficulty:'easy',
   instruction:'검지와 중지를 세웁니다.',
   checker:'two',emoji:'2️⃣',
   checkParams:{수형:'검지+중지',수동:'정지'}},
  {id:'n31',cat:'number',label:'5',english:'Five',color:'#6366f1',difficulty:'easy',
   instruction:'엄지만 위로 세웁니다.',
   checker:'five',emoji:'5️⃣',
   checkParams:{수형:'엄지만',수동:'정지'}},
];

const STATIC_CHECKERS = new Set(['one','two','three','four','five','six','seven','eight','nine','good','dislike','what','no','yes']);

// ── 랜드마크 인덱스 ────────────────────────────────────────
const LM={WRIST:0,THUMB_CMC:1,THUMB_MCP:2,THUMB_IP:3,THUMB_TIP:4,
  INDEX_MCP:5,INDEX_PIP:6,INDEX_DIP:7,INDEX_TIP:8,
  MIDDLE_MCP:9,MIDDLE_PIP:10,MIDDLE_DIP:11,MIDDLE_TIP:12,
  RING_MCP:13,RING_PIP:14,RING_DIP:15,RING_TIP:16,
  PINKY_MCP:17,PINKY_PIP:18,PINKY_DIP:19,PINKY_TIP:20};

const dist=(a,b)=>Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);
function isExtended(lm,tip,mcp){return dist(lm[tip],lm[LM.WRIST])>dist(lm[mcp],lm[LM.WRIST])*0.85}
const indexUp=lm=>isExtended(lm,LM.INDEX_TIP,LM.INDEX_MCP);
const middleUp=lm=>isExtended(lm,LM.MIDDLE_TIP,LM.MIDDLE_MCP);
const ringUp=lm=>isExtended(lm,LM.RING_TIP,LM.RING_MCP);
const pinkyUp=lm=>isExtended(lm,LM.PINKY_TIP,LM.PINKY_MCP);
const thumbUp=lm=>lm[LM.THUMB_TIP].y<lm[LM.THUMB_MCP].y-0.04;
const thumbDown=lm=>lm[LM.THUMB_TIP].y>lm[LM.THUMB_MCP].y+0.04;
const thumbExtended=lm=>dist(lm[LM.THUMB_TIP],lm[LM.WRIST])>dist(lm[LM.THUMB_MCP],lm[LM.WRIST])*0.9;
const fourFingersUp=lm=>indexUp(lm)&&middleUp(lm)&&ringUp(lm)&&pinkyUp(lm);
const isFist=lm=>!indexUp(lm)&&!middleUp(lm)&&!ringUp(lm)&&!pinkyUp(lm);
const isCHand=lm=>{
  const p=k=>dist(lm[k],lm[LM.WRIST])>dist(lm[k-3],lm[LM.WRIST])*0.7;
  return !isFist(lm)&&!fourFingersUp(lm)&&(p(LM.INDEX_TIP)||p(LM.MIDDLE_TIP));
};
function wristZone(lm){const y=lm[LM.WRIST].y;if(y<0.45)return'head';if(y<0.62)return'face';if(y<0.78)return'chest';return'low';}
function tipZone(lm,t){const y=lm[t].y;if(y<0.45)return'head';if(y<0.62)return'face';if(y<0.78)return'chest';return'low';}
function isStill(h){if(h.length<6)return false;const r=h.slice(-6);const dx=Math.max(...r.map(p=>p.x))-Math.min(...r.map(p=>p.x));const dy=Math.max(...r.map(p=>p.y))-Math.min(...r.map(p=>p.y));return dx<0.04&&dy<0.04;}
const detectDownwardSwipe=h=>h.length>=8&&(h.slice(-8).at(-1).y-h.slice(-8)[0].y)>0.06;
const detectNodding=h=>{if(h.length<10)return false;const r=h.slice(-10);return(Math.max(...r.map(p=>p.y))-Math.min(...r.map(p=>p.y)))>0.04;};
const detectLateralShake=h=>{if(h.length<10)return false;return(Math.max(...h.slice(-10).map(p=>p.x))-Math.min(...h.slice(-10).map(p=>p.x)))>0.06;};
function detectDoubleKnock(h){if(h.length<10)return false;const r=h.slice(-24);let k=0,inK=false;for(let i=1;i<r.length;i++){const dy=r[i].y-r[i-1].y;if(dy>0.012){if(!inK){k++;inK=true;}}else if(dy<-0.008)inK=false;}const l4=r.slice(-4);const s=(Math.max(...l4.map(p=>p.y))-Math.min(...l4.map(p=>p.y)))<0.01;return k>=2&&s;}

// 정적 체커
function checkStatic(checker,lm,h,lm2=null){
  if(!lm||lm.length<21)return null;
  const s=isStill(h);
  switch(checker){
    case'one':return{수형:indexUp(lm)&&!middleUp(lm)&&!ringUp(lm)&&!pinkyUp(lm),수동:s};
    case'two':return{수형:indexUp(lm)&&middleUp(lm)&&!ringUp(lm)&&!pinkyUp(lm),수동:s};
    case'five':return{수형:thumbExtended(lm)&&!indexUp(lm)&&!middleUp(lm)&&!ringUp(lm)&&!pinkyUp(lm),수동:s};
    case'good':return{수형:thumbUp(lm)&&!indexUp(lm)&&!middleUp(lm)&&!ringUp(lm)&&!pinkyUp(lm),수동:s};
    case'dislike':return{수형:thumbDown(lm)&&!indexUp(lm)&&!middleUp(lm)&&!ringUp(lm)&&!pinkyUp(lm),수동:s};
    case'what':return{수형:indexUp(lm)&&!middleUp(lm)&&!ringUp(lm)&&!pinkyUp(lm),수위:wristZone(lm)==='chest',수동:detectLateralShake(h)};
    case'yes':return{수형:isFist(lm)&&wristZone(lm)==='chest',수동:detectNodding(h)};
    case'no':return{수형:fourFingersUp(lm)&&wristZone(lm)==='chest',수동:detectLateralShake(h)};
    default:return null;
  }
}

// 페이즈 정의
const PHASE_DEFS={
  hello:[
    {label:'① B형 관자놀이 대기',check:(lm)=>fourFingersUp(lm)&&!thumbUp(lm)&&(wristZone(lm)==='head'||wristZone(lm)==='face')},
    {label:'② 아래로 쓸어내리기',check:(lm,h)=>detectDownwardSwipe(h)},
    {label:'③ 양손 주먹 가슴 멈춤',check:(lm,h)=>isFist(lm)&&wristZone(lm)==='chest'&&isStill(h)},
  ],
  thankyou:[
    {label:'① 왼손 편손 가슴 앞',check:(lm,h,lm2)=>lm2!=null&&fourFingersUp(lm2)&&wristZone(lm2)==='chest'},
    {label:'② 오른손 편손 위에',check:(lm,h,lm2)=>fourFingersUp(lm)&&wristZone(lm)==='chest'},
    {label:'③ 오른손 날로 두드리기',check:(lm,h)=>fourFingersUp(lm)&&wristZone(lm)==='chest'&&detectDoubleKnock(h)},
  ],
  help:[
    {label:'① 왼손 엄지만 세우기',check:(lm,h,lm2)=>lm2!=null&&thumbUp(lm2)&&!indexUp(lm2)&&!middleUp(lm2)&&!ringUp(lm2)&&!pinkyUp(lm2)},
    {label:'② 오른 손바닥 가슴 앞',check:(lm)=>fourFingersUp(lm)&&wristZone(lm)==='chest'},
    {label:'③ 손바닥에 엄지로 톡톡',check:(lm,h)=>detectNodding(h)},
  ],
  danger:[
    {label:'① C형 손 가슴 앞',check:(lm)=>isCHand(lm)&&wristZone(lm)==='chest'},
    {label:'② 가슴 두드리기 2회',check:(lm,h)=>detectNodding(h)&&wristZone(lm)==='chest'},
  ],
};

// ── 상태 ────────────────────────────────────────────────────
let signIdx=0, filter='all', camOn=false, submitted=false;
let handsInstance=null, cameraInstance=null;
let motionHistory=[], phaseRef={}, holdRAF=null, holdStart=null;
let history=[], streak=0, activeGate=false;
let HAND_CONNECTIONS_REF=null;

// ── UI 렌더 ─────────────────────────────────────────────────
const DIFF_COLORS={easy:'#10b981',medium:'#f59e0b',hard:'#ef4444'};
const DIFF_LABELS={easy:'쉬움',medium:'보통',hard:'어려움'};
const CATS=[['all','전체'],['greet','인사'],['emergency','긴급'],['feeling','감정'],['question','질문'],['answer','대답'],['number','숫자']];

function renderFilters(){
  const el=document.getElementById('filterBtns');
  el.innerHTML=CATS.map(([v,l])=>
    \`<button class="filter-btn \${filter===v?'active':''}" onclick="setFilter('\${v}')">\${l}</button>\`
  ).join('');
}

function renderSelector(){
  const pool=filter==='all'?GESTURE_SIGNS:GESTURE_SIGNS.filter(s=>s.cat===filter);
  const el=document.getElementById('signSelector');
  el.innerHTML=pool.map(s=>
    \`<button class="sign-pill \${GESTURE_SIGNS[signIdx].id===s.id?'active':''}"
      style="\${GESTURE_SIGNS[signIdx].id===s.id?'border-color:'+s.color:''}"
      onclick="selectSign('\${s.id}')">
      \${s.emoji} \${s.label}
      <span class="diff" style="color:\${DIFF_COLORS[s.difficulty]}">\${DIFF_LABELS[s.difficulty]}</span>
    </button>\`
  ).join('');
}

function renderSignInfo(){
  const s=GESTURE_SIGNS[signIdx];
  document.getElementById('signInfo').innerHTML=\`
    <h3>\${s.emoji} \${s.label} <span style="font-size:13px;color:#888;font-weight:400">(\${s.english})</span></h3>
    <p class="inst" style="margin-top:6px">\${s.instruction}</p>
    <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
      \${Object.entries(s.checkParams).map(([k,v])=>
        \`<span style="background:#252540;border-radius:6px;padding:3px 8px;font-size:11px;color:#a78bfa">
          <b>\${k}</b>: \${v}
        </span>\`
      ).join('')}
    </div>
  \`;
}

function renderOverlay(){
  const s=GESTURE_SIGNS[signIdx];
  const ov=document.getElementById('overlay');
  if(camOn&&!submitted){ov.style.display='none';return;}
  ov.style.display='flex';
  if(submitted){
    ov.className='cam-overlay success-overlay';
    ov.innerHTML=\`<div class="success-check">✓</div><div style="font-size:22px;font-weight:900">완료!</div>\`;
  } else {
    ov.className='cam-overlay';
    ov.innerHTML=\`
      <div style="font-size:36px">\${s.emoji}</div>
      <h2>\${s.label}</h2>
      <p>\${s.instruction}</p>
      <button class="btn btn-start" onclick="startCamera()" style="width:auto;padding:10px 24px">📷 카메라 시작</button>
    \`;
  }
}

function renderControls(){
  const el=document.getElementById('camControls');
  if(camOn&&!submitted){
    el.innerHTML=\`<button class="btn btn-stop" onclick="stopCamera()" style="margin-top:6px">⏹ 중지</button>\`;
  } else if(submitted||!camOn){
    el.innerHTML=\`<button class="btn btn-next" onclick="nextSign()" style="margin-top:6px">
      \${submitted?'✓ 다음 수어 →':'⏭ 다른 수어'}
    </button>\`;
    if(streak>0){
      el.innerHTML+=\`<div class="streak-badge">🔥 <b>\${streak}</b> 연속 정답</div>\`;
    }
  } else {
    el.innerHTML='';
  }
}

function renderPhaseBox(phaseState){
  const el=document.getElementById('phaseBox');
  if(!phaseState||submitted){el.innerHTML='';return;}
  const {phaseLabels,phase,scores}=phaseState;
  el.innerHTML=\`<div class="phase-box">
    <div class="phase-title">동작 단계</div>
    \${phaseLabels.map((label,i)=>{
      const isDone=i<phase;
      const isActive=i===phase;
      const score=scores[label];
      let cls='';
      if(isDone)cls='done';
      else if(isActive)cls=score?'active-pass':'active-wait';
      return \`<div class="phase-step">
        <div class="step-num \${cls}">\${isDone?'✓':i+1}</div>
        <div class="step-text \${cls}">\${label}</div>
      </div>\`;
    }).join('')}
  </div>\`;
}

function renderParamBox(scores,isStatic){
  const el=document.getElementById('paramBox');
  if(!scores){el.innerHTML='';return;}
  const s=GESTURE_SIGNS[signIdx];
  el.innerHTML=\`<div class="param-box">
    <div class="param-title">실시간 감지</div>
    \${Object.entries(s.checkParams).map(([k,v])=>{
      const val=submitted?true:(isStatic?scores[k]:Object.values(scores)[0]);
      const cls=val===true?'pass':val===false?'fail':'wait';
      return \`<div class="param-row \${cls}">
        <span class="icon"></span>
        <span>\${k}: \${v}</span>
      </div>\`;
    }).join('')}
  </div>\`;
}

function renderHistory(){
  const el=document.getElementById('historyBox');
  if(!history.length){el.innerHTML='';return;}
  el.innerHTML=\`<div class="history">
    <div class="hist-title">🕐 최근 완료</div>
    \${history.map(h=>\`
      <div class="hist-row">
        <span class="hist-label">\${h.emoji} \${h.label}</span>
        <span class="hist-pass">✓</span>
        <span class="hist-time">\${h.ts}</span>
      </div>
    \`).join('')}
  </div>\`;
}

function renderAll(phaseState=null,scores=null,isStatic=false){
  renderFilters();
  renderSelector();
  renderSignInfo();
  renderOverlay();
  renderControls();
  renderPhaseBox(phaseState);
  renderParamBox(scores,isStatic);
  renderHistory();
}

// ── MediaPipe 로드 ───────────────────────────────────────────
let mpLoaded=false;

async function loadMediaPipe(){
  if(mpLoaded)return true;
  return new Promise(resolve=>{
    const s1=document.createElement('script');
    s1.src='https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
    s1.onload=async()=>{
      const s2=document.createElement('script');
      s2.src='https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      s2.onload=()=>{mpLoaded=true;resolve(true);};
      s2.onerror=()=>resolve(false);
      document.head.appendChild(s2);
    };
    s1.onerror=()=>resolve(false);
    document.head.appendChild(s1);
  });
}

// ── 카메라 시작/중지 ─────────────────────────────────────────
async function startCamera(){
  const ok=await loadMediaPipe();
  if(!ok){alert('MediaPipe를 로드할 수 없습니다. 인터넷 연결을 확인하세요.');return;}
  if(cameraInstance)return;

  const video=document.getElementById('video');
  const canvas=document.getElementById('canvas');

  handsInstance=new Hands({locateFile:f=>\`https://cdn.jsdelivr.net/npm/@mediapipe/hands/\${f}\`});
  handsInstance.setOptions({maxNumHands:2,modelComplexity:1,minDetectionConfidence:0.5,minTrackingConfidence:0.5});
  handsInstance.onResults(r=>onResults(r));
  HAND_CONNECTIONS_REF=window.HAND_CONNECTIONS||null;

  try{
    cameraInstance=new Camera(video,{
      onFrame:async()=>{if(handsInstance&&video&&activeGate)await handsInstance.send({image:video});},
      width:640,height:480,
    });
    await cameraInstance.start();
    activeGate=true;
    camOn=true;
    canvas.width=video.videoWidth||640;
    canvas.height=video.videoHeight||480;
    document.getElementById('overlay').style.display='none';
    document.getElementById('camControls').innerHTML=
      '<button class="btn btn-stop" onclick="stopCamera()" style="margin-top:6px">⏹ 중지</button>';
    // live badge
    const lbOld=document.getElementById('liveBadge');
    if(lbOld)lbOld.remove();
    const lb=document.createElement('div');
    lb.id='liveBadge';lb.className='live-badge';
    lb.innerHTML='<span class="live-dot"></span>감지 중';
    document.querySelector('.cam-wrap').appendChild(lb);
  }catch(e){
    alert('카메라 접근 권한이 필요합니다. 설정에서 카메라 권한을 허용해주세요.');
  }
}

function stopCamera(){
  activeGate=false;
  if(cameraInstance){cameraInstance.stop();cameraInstance=null;}
  if(handsInstance){handsInstance.close();handsInstance=null;}
  camOn=false;
  const lb=document.getElementById('liveBadge');if(lb)lb.remove();
  const hw=document.getElementById('holdWrap');if(hw)hw.remove();
  if(holdRAF){cancelAnimationFrame(holdRAF);holdRAF=null;}
  motionHistory=[];
  renderAll();
}

// ── onResults ────────────────────────────────────────────────
function onResults(results){
  const canvas=document.getElementById('canvas');
  const ctx=canvas.getContext('2d');
  ctx.save();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(results.image,0,0,canvas.width,canvas.height);

  if(!results.multiHandLandmarks?.length){
    ctx.restore();return;
  }

  const lm=results.multiHandLandmarks[0];
  const lm2=results.multiHandLandmarks[1]||null;

  // 랜드마크 그리기
  drawHand(ctx,lm,canvas.width,canvas.height);
  if(lm2)drawHand(ctx,lm2,canvas.width,canvas.height);

  const wrist=lm[LM.WRIST];
  motionHistory=[...motionHistory.slice(-29),{x:wrist.x,y:wrist.y,z:wrist.z||0}];

  const sign=GESTURE_SIGNS[signIdx];
  if(!sign||submitted){ctx.restore();return;}

  const checker=sign.checker;
  const isStatic=STATIC_CHECKERS.has(checker);
  let allPass=false, scores=null, phaseState=null;

  if(isStatic){
    scores=checkStatic(checker,lm,motionHistory,lm2);
    if(scores){
      allPass=Object.values(scores).every(v=>v===true);
      renderParamBox(scores,true);
    }
  } else {
    const phaseDefs=PHASE_DEFS[checker];
    if(phaseDefs){
      if(phaseRef[checker]===undefined)phaseRef[checker]=0;
      const curPhase=phaseRef[checker];
      const pd=phaseDefs[curPhase];
      const passed=pd&&pd.check(lm,motionHistory,lm2);
      if(passed&&curPhase<phaseDefs.length-1)phaseRef[checker]=curPhase+1;
      const np=phaseRef[checker];
      const sc={};
      phaseDefs.forEach((p,i)=>{
        if(i<np)sc[p.label]=true;
        else if(i===np)sc[p.label]=passed;
        else sc[p.label]=false;
      });
      phaseState={phase:np,totalPhases:phaseDefs.length,phaseLabels:phaseDefs.map(p=>p.label),scores:sc};
      allPass=np===phaseDefs.length-1&&passed;
      renderPhaseBox(phaseState);
      renderParamBox(sc,false);
    }
  }

  if(allPass){
    if(!holdRAF){
      holdStart=Date.now();
      const dur=isStatic?1500:800;
      const tick=()=>{
        const pct=Math.min(100,((Date.now()-holdStart)/dur)*100);
        updateHoldRing(pct);
        if(pct<100){holdRAF=requestAnimationFrame(tick);}
        else{holdRAF=null;autoSubmit(sign);}
      };
      holdRAF=requestAnimationFrame(tick);
    }
  } else {
    if(holdRAF){cancelAnimationFrame(holdRAF);holdRAF=null;updateHoldRing(0);}
  }
  ctx.restore();
}

function drawHand(ctx,lm,w,h){
  // 연결선
  const conns=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
  ctx.strokeStyle='rgba(124,111,255,0.6)';ctx.lineWidth=2;
  for(const[a,b]of conns){
    ctx.beginPath();ctx.moveTo(lm[a].x*w,lm[a].y*h);ctx.lineTo(lm[b].x*w,lm[b].y*h);ctx.stroke();
  }
  // 점
  for(let i=0;i<lm.length;i++){
    const tip=[4,8,12,16,20].includes(i);
    ctx.beginPath();ctx.arc(lm[i].x*w,lm[i].y*h,tip?6:4,0,Math.PI*2);
    ctx.fillStyle=tip?'#7c6fff':'#fff';ctx.strokeStyle='#7c6fff';ctx.lineWidth=2;
    ctx.fill();ctx.stroke();
  }
}

function updateHoldRing(pct){
  let wrap=document.getElementById('holdWrap');
  if(pct<=0){if(wrap)wrap.remove();return;}
  if(!wrap){
    wrap=document.createElement('div');wrap.id='holdWrap';
    wrap.className='hold-wrap';
    const r=2*Math.PI*20;
    wrap.innerHTML=\`
      <svg class="hold-ring" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="4"/>
        <circle id="holdArc" cx="24" cy="24" r="20" fill="none" stroke="#10b981" stroke-width="4"
          stroke-dasharray="\${r}" stroke-dashoffset="\${r}"
          transform="rotate(-90 24 24)" stroke-linecap="round"/>
      </svg>
      <div class="hold-pct" id="holdPctTxt">0%</div>
    \`;
    document.querySelector('.cam-wrap').appendChild(wrap);
  }
  const r=2*Math.PI*20;
  const arc=document.getElementById('holdArc');
  if(arc)arc.style.strokeDashoffset=\`\${r*(1-pct/100)}\`;
  const txt=document.getElementById('holdPctTxt');
  if(txt)txt.textContent=Math.round(pct)+'%';
}

// ── 자동 제출 ────────────────────────────────────────────────
async function autoSubmit(sign){
  submitted=true;
  updateHoldRing(100);
  stopCamera();
  streak++;
  const ts=new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
  history=[{emoji:sign.emoji,label:sign.label,ts},...history.slice(0,7)];
  renderAll();
  // AI 피드백
  const aiFbEl=document.getElementById('aiFbBox');
  aiFbEl.innerHTML=\`<div class="ai-box">
    <div class="ai-header">🤖 AI 피드백</div>
    <div class="skel"></div><div class="skel short"></div>
  </div>\`;
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',max_tokens:1000,
        system:'한국수어 전문 강사. 간결하고 친근하게.',
        messages:[{role:'user',content:\`학습자가 한국수어 "\${sign.label}" (\${sign.english}) 수어를 성공적으로 수행했습니다. 3가지를 알려주세요: 1) 짧은 격려 메시지 2) 이 수어를 사용하는 실생활 문장 예시 한 개 3) 다음에 배우면 좋을 관련 수어 한 개 추천. 총 3-4문장, 한국어로.\`}],
      }),
    });
    const data=await res.json();
    const fb=data.content?.map(b=>b.text||'').join('').trim()||'피드백 없음';
    aiFbEl.innerHTML=\`<div class="ai-box"><div class="ai-header">🤖 AI 피드백</div><p class="ai-text">\${fb}</p></div>\`;
  }catch(e){
    aiFbEl.innerHTML=\`<div class="ai-box"><div class="ai-header">🤖 AI 피드백</div><p class="ai-text">피드백을 불러올 수 없습니다.</p></div>\`;
  }
}

// ── 컨트롤 함수 ──────────────────────────────────────────────
function setFilter(f){filter=f;renderAll();}
function selectSign(id){
  if(camOn)stopCamera();
  const idx=GESTURE_SIGNS.findIndex(s=>s.id===id);
  if(idx>=0){
    signIdx=idx;
    submitted=false;
    phaseRef[GESTURE_SIGNS[idx].checker]=0;
    motionHistory=[];
    document.getElementById('aiFbBox').innerHTML='';
    renderAll();
  }
}
function nextSign(){
  if(camOn)stopCamera();
  const pool=filter==='all'?GESTURE_SIGNS:GESTURE_SIGNS.filter(s=>s.cat===filter);
  const next=pool[Math.floor(Math.random()*pool.length)];
  selectSign(next.id);
}

// ── 초기 렌더 ────────────────────────────────────────────────
renderAll();
</script>
</body>
</html>`;

// ── React Native 컴포넌트 ────────────────────────────────────
export default function CameraMode() {
  const webViewRef = useRef(null);
  const [webViewReady, setWebViewReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // react-native-webview 가 설치 안 됐을 때를 대비한 fallback
  let WebViewComponent: any = null;
  try {
    WebViewComponent = require("react-native-webview").WebView;
  } catch {
    WebViewComponent = null;
  }

  if (!WebViewComponent) {
    return (
      <View style={s.fallback}>
        <Text style={s.fallbackEmoji}>📷</Text>
        <Text style={s.fallbackTitle}>카메라 모드 설치 필요</Text>
        <Text style={s.fallbackDesc}>
          실제 카메라 제스처 인식을 사용하려면{"\n"}
          아래 명령어로 패키지를 설치하세요:
        </Text>
        <View style={s.codeBox}>
          <Text style={s.code}>npx expo install react-native-webview</Text>
        </View>
        <TouchableOpacity
          style={s.dictBtn}
          onPress={() =>
            Linking.openURL(
              "https://docs.expo.dev/versions/latest/sdk/webview/",
            )
          }
        >
          <Text style={s.dictBtnTxt}>📖 설치 가이드 보기</Text>
        </TouchableOpacity>
        <View style={s.infoBox}>
          <Text style={s.infoTitle}>📌 카메라 모드 기능</Text>
          {[
            "MediaPipe 기반 실시간 손 랜드마크 감지",
            "40개+ 수어 제스처 단계별 인식",
            "수형·수위·수동·수향 실시간 체크",
            "성공 시 AI 격려 메시지 + 다음 수어 추천",
          ].map((t, i) => (
            <View key={i} style={s.infoRow}>
              <Text style={s.infoNum}>{i + 1}</Text>
              <Text style={s.infoTxt}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {!webViewReady && !loadError && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={s.loadingTxt}>카메라 모드 로딩 중...</Text>
        </View>
      )}
      {loadError && (
        <View style={s.errorBox}>
          <Text style={s.errorTxt}>⚠️ 카메라 모드를 불러올 수 없습니다.</Text>
          <TouchableOpacity
            onPress={() => {
              setLoadError(false);
            }}
          >
            <Text style={s.retryTxt}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}
      <WebViewComponent
        ref={webViewRef}
        style={[s.webview, !webViewReady && { height: 0 }]}
        originWhitelist={["*"]}
        source={{ html: GESTURE_HTML }}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        // iOS: 카메라 권한
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        onLoadEnd={() => setWebViewReady(true)}
        onError={() => setLoadError(true)}
        // Android 카메라 권한
        {...(Platform.OS === "android"
          ? {
              androidLayerType: "hardware",
            }
          : {})}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, minHeight: 600 },
  webview: { flex: 1, backgroundColor: "#0f0f1a" },

  loadingOverlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f0f1a",
    zIndex: 10,
    gap: 12,
  },
  loadingTxt: { color: "#888", fontSize: 14 },

  errorBox: { padding: 24, alignItems: "center", gap: 12 },
  errorTxt: { color: "#ef4444", fontSize: 14, textAlign: "center" },
  retryTxt: { color: C.accent, fontSize: 14, fontWeight: "700" },

  // fallback (webview 미설치 시)
  fallback: { padding: 20, gap: 14 },
  fallbackEmoji: { fontSize: 48, textAlign: "center" },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: C.text,
    textAlign: "center",
  },
  fallbackDesc: {
    fontSize: 13,
    color: C.sub,
    textAlign: "center",
    lineHeight: 20,
  },
  codeBox: {
    backgroundColor: "#1e1e3a",
    borderRadius: 10,
    padding: 14,
    width: "100%",
  },
  code: {
    fontSize: 13,
    color: "#a78bfa",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  dictBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: C.accent,
  },
  dictBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  infoBox: {
    backgroundColor: "#f9f9fc",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    width: "100%",
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    marginBottom: 4,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.accent,
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 20,
    flexShrink: 0,
  },
  infoTxt: { fontSize: 13, color: C.sub, flex: 1, lineHeight: 20 },
});
