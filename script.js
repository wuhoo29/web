// ==========================================
// 1. 初始化 Firebase (已帶入你的專屬金鑰)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDg4LO0264TVpvzucbRB99ZpApC2oQapAo",
  authDomain: "sel-tree-garden.firebaseapp.com",
  projectId: "sel-tree-garden",
  storageBucket: "sel-tree-garden.firebasestorage.app",
  messagingSenderId: "480387713507",
  appId: "1:480387713507:web:c335f78f397b5c4611b8d6",
  measurementId: "G-D1737W99PH"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 植物成長階段定義
const STAGES = [
  { drops: 0, icon: '🌱', title: '沉睡的種子' },
  { drops: 1, icon: '🌿', title: '破土的小萌芽' },
  { drops: 3, icon: '🪴', title: '茁壯的小樹苗' },
  { drops: 5, icon: '🌸', title: '含苞待放的情緒樹' },
  { drops: 7, icon: '🌳✨', title: '盛開的彩虹之樹' }
];

function getPlantInfo(drops) {
  let res = STAGES[0];
  for (let s of STAGES) {
    if (drops >= s.drops) res = s;
  }
  return res;
}

// ==========================================
// 2. 幫朋友的小樹澆水 (+1 水滴，雲端即時同步)
// ==========================================
window.waterFriendTree = function(docId, friendName) {
  const docRef = db.collection("gardens").doc(docId);
  
  docRef.update({
    waterDrops: firebase.firestore.FieldValue.increment(1)
  }).then(() => {
    alert(`💧 成功為 ${friendName} 的小樹澆了 1 滴水！`);
  }).catch((err) => {
    console.error("澆水失敗：", err);
    alert("澆水失敗，請稍後再試！");
  });
};

// ==========================================
// 3. 即時監聽所有人的花園 (onSnapshot)
// ==========================================
db.collection("gardens").onSnapshot((snapshot) => {
  const container = document.getElementById("friendsGardenList");
  if (!container) return;

  console.log("從雲端抓取到的文件數量：", snapshot.size);

  if (snapshot.empty) {
    container.innerHTML = '<div class="col-12 text-center text-muted py-3">目前還沒有人建立小樹，快來記錄心情成為第一個吧！🌿</div>';
    return;
  }

  let html = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log("取得小樹資料：", doc.id, data);

    const currentDrops = Number(data.waterDrops) || 0;
    const plant = getPlantInfo(currentDrops);
    
    // 兼容後台的 username 與程式上傳的 userName
    const friendName = data.username || data.userName || data.name || doc.id;

    html += `
      <div class="col-md-4 col-sm-6 mb-3">
        <div class="card h-100 p-3 text-center border-0 shadow-sm rounded-lg bg-light">
          <div style="font-size: 2.8rem; line-height: 1.2;" class="mb-2">${plant.icon}</div>
          <h5 class="font-weight-bold mb-1 text-dark">${friendName} 的樹</h5>
          <div><span class="badge badge-pill badge-info mb-2">${plant.title}</span></div>
          <p class="small text-muted mb-2">已累積 <strong>${currentDrops}</strong> 滴水滴</p>
          <div class="mt-auto">
            <button class="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-sm font-weight-bold" onclick="waterFriendTree('${doc.id}', '${friendName}')">
              💧 幫他澆水
            </button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}, (error) => {
  console.error("讀取小樹花園失敗：", error);
  const container = document.getElementById("friendsGardenList");
  if (container) {
    container.innerHTML = `<div class="col-12 text-center text-danger py-3">連線失敗：${error.message}</div>`;
  }
});
// ==========================================
// 4. 縮圖相簿切換器
// ==========================================
function switchImage(selectedThumb, newSrc, newCaption) {
  const mainImg = document.getElementById('mainImage');
  const caption = document.getElementById('imageCaption');

  if (!mainImg) return;

  mainImg.style.opacity = '0.3';
  setTimeout(() => {
    mainImg.src = newSrc;
    if (newCaption && caption) {
      caption.innerText = newCaption;
    }
    mainImg.style.opacity = '1';
  }, 150);

  document.querySelectorAll('.thumb-img').forEach(img => {
    img.classList.remove('active');
  });
  selectedThumb.classList.add('active');
}

// ==========================================
// 5. 心情筆記 & 情緒花園系統主邏輯
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  const moodForm = document.getElementById('moodForm');
  const moodDateInput = document.getElementById('moodDate');
  const moodNoteInput = document.getElementById('moodNote');
  const moodList = document.getElementById('moodList');
  const clearAllBtn = document.getElementById('clearAllBtn');
  
  // 花園元素
  const waterCountEl = document.getElementById('waterCount');
  const treeProgressEl = document.getElementById('treeProgress');
  const treeVisualEl = document.getElementById('treeVisual');
  const treeStageTitleEl = document.getElementById('treeStageTitle');
  const treeMessageEl = document.getElementById('treeMessage');
  const waterTreeBtn = document.getElementById('waterTreeBtn');
  const backToTopBtn = document.getElementById('backToTopBtn');

  // 回到頂端按鈕
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (!moodForm) return;

  // 設定日期：最小本週一，最大今天
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentDay = now.getDay();
  const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  const mondayStr = monday.toISOString().split('T')[0];

  moodDateInput.value = todayStr;
  moodDateInput.min = mondayStr;
  moodDateInput.max = todayStr;

  const treeStages = [
    { min: 0, max: 0, icon: '🌱', title: '沉睡的種子', msg: '「記錄今天的心情，給種子第一滴養分吧！」' },
    { min: 1, max: 2, icon: '🌿', title: '破土的小萌芽', msg: '「好棒！你開始覺察自己的感受，小芽冒出來了！」' },
    { min: 3, max: 4, icon: '🪴', title: '茁壯的小樹苗', msg: '「持續的覺察讓心靈更有力量，小樹正穩穩成長！」' },
    { min: 5, max: 6, icon: '🌸', title: '含苞待放的情緒樹', msg: '「誠實面對情緒是種超能力，花朵即將綻放！」' },
    { min: 7, max: 999, icon: '🌳✨', title: '盛開的彩虹之樹', msg: '「太厲害了！完成本週全勤記錄，你的心靈花園一片燦爛！」' }
  ];

  function getCleanedMoodLogs() {
    let logs = JSON.parse(localStorage.getItem('sel_mood_logs')) || [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    logs = logs.filter(log => new Date(log.date) >= oneWeekAgo);
    localStorage.setItem('sel_mood_logs', JSON.stringify(logs));
    return logs;
  }

  function updateGardenView(logsCount) {
    const points = Math.min(logsCount, 7);
    if (waterCountEl) waterCountEl.textContent = points;
    
    const percent = Math.round((points / 7) * 100);
    if (treeProgressEl) treeProgressEl.style.width = percent + '%';

    const stage = treeStages.find(s => points >= s.min && points <= s.max) || treeStages[0];
    if (treeVisualEl) treeVisualEl.textContent = stage.icon;
    if (treeStageTitleEl) treeStageTitleEl.textContent = stage.title;
    if (treeMessageEl) treeMessageEl.textContent = stage.msg;
  }

  function renderMoodLogs() {
    const logs = getCleanedMoodLogs();
    if (!moodList) return;
    moodList.innerHTML = '';

    updateGardenView(logs.length);

    if (logs.length === 0) {
      moodList.innerHTML = `
        <div class="col-12 text-center text-muted py-4">
          <p class="mb-0">目前還沒有近 7 天的心情筆記，快記錄下今天的心情為小樹澆水吧！🌿</p>
        </div>
      `;
      return;
    }

    logs.sort((a, b) => new Date(b.date) - new Date(a.date));

    logs.forEach(log => {
      const col = document.createElement('div');
      col.className = 'col-md-6 mb-3';
      col.innerHTML = `
        <div class="card h-100 shadow-sm border-0 rounded-lg p-3 bg-white mood-history-card">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge badge-light px-2 py-1 text-muted border">${log.date}</span>
            <button class="btn btn-sm btn-link text-danger p-0 delete-btn" data-id="${log.id}" title="刪除">&times;</button>
          </div>
          <div class="d-flex align-items-center mb-2">
            <span style="font-size: 2rem;" class="mr-2">${log.emoji}</span>
            <h5 class="mb-0 font-weight-bold">${log.mood}</h5>
          </div>
          <p class="text-muted mb-0 small" style="white-space: pre-wrap;">${log.note ? log.note : '<span class="text-black-50">（無額外備註）</span>'}</p>
        </div>
      `;
      moodList.appendChild(col);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idToDelete = this.getAttribute('data-id');
        deleteLog(idToDelete);
      });
    });
  }

  function triggerWaterEffect() {
    if (!treeVisualEl) return;
    treeVisualEl.classList.remove('watering-animate');
    void treeVisualEl.offsetWidth;
    treeVisualEl.classList.add('watering-animate');
  }

  // 6. 送出心情表單（本地紀錄 + 同步至 Firebase 雲端）
  moodForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const selectedMoodRadio = document.querySelector('input[name="mood"]:checked');
    const moodVal = selectedMoodRadio ? selectedMoodRadio.value : '開心';
    const emojiVal = selectedMoodRadio ? selectedMoodRadio.getAttribute('data-emoji') : '😄';
    const noteVal = moodNoteInput.value.trim();

    const newLog = {
      id: Date.now().toString(),
      date: moodDateInput.value,
      mood: moodVal,
      emoji: emojiVal,
      note: noteVal
    };

    const logs = getCleanedMoodLogs();
    logs.push(newLog);
    localStorage.setItem('sel_mood_logs', JSON.stringify(logs));

    // 取得或設定使用者名稱
    let myName = localStorage.getItem('myGardenName');
    if (!myName) {
      myName = prompt("🌸 歡迎加入情緒花園！請輸入你的名字或暱稱（讓夥伴們看見你的小樹）：", "探險家");
      if (!myName || myName.trim() === '') myName = "小夥伴";
      localStorage.setItem('myGardenName', myName.trim());
    }

    // 儲存至 Firebase 雲端花園 (以名字為 doc ID)
    db.collection("gardens").doc(myName).set({
      userName: myName,
      waterDrops: Math.min(logs.length, 7),
      lastMood: moodVal,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(err => {
      console.error("同步到雲端花園失敗：", err);
    });

    moodNoteInput.value = '';
    renderMoodLogs();
    triggerWaterEffect();
    alert('🎉 心情已記錄！你的小樹已獲得養分並同步到夥伴花園中囉！');
  });

  if (waterTreeBtn) {
    waterTreeBtn.addEventListener('click', function() {
      triggerWaterEffect();
    });
  }

  function deleteLog(id) {
    let logs = getCleanedMoodLogs();
    logs = logs.filter(log => log.id !== id);
    localStorage.setItem('sel_mood_logs', JSON.stringify(logs));
    renderMoodLogs();
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', function() {
      if (confirm('確定要清空近一週的心情紀錄與重置小樹嗎？')) {
        localStorage.removeItem('sel_mood_logs');
        renderMoodLogs();
      }
    });
  }

  // 初始載入本地紀錄
  renderMoodLogs();
});
