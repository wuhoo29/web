// 1. 縮圖相簿切換器
function switchImage(selectedThumb, newSrc, newCaption) {
  const mainImg = document.getElementById('mainImage');
  const caption = document.getElementById('imageCaption');

  if (!mainImg) return;

  // 淡出大圖
  mainImg.style.opacity = '0.3';

  setTimeout(() => {
    // 替換大圖與說明文字
    mainImg.src = newSrc;
    if (newCaption && caption) {
      caption.innerText = newCaption;
    }
    // 淡入大圖
    mainImg.style.opacity = '1';
  }, 150);

  // 更新縮圖的 active 高亮狀態
  document.querySelectorAll('.thumb-img').forEach(img => {
    img.classList.remove('active');
  });
  selectedThumb.classList.add('active');
}

// 2. 心情筆記 & 情緒花園系統
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

  // 回到頂端按鈕事件
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  if (!moodForm) return;

  // 預設日期為今天
const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 2. 計算本週一的日期 (以週一為一週起始)
  // getDay() 回傳 0(週日), 1(週一), ..., 6(週六)
  const currentDay = now.getDay();
  const diffToMonday = currentDay === 0 ? 6 : currentDay - 1; // 若為週日則往回推6天，其餘往回推 (day - 1) 天
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  const mondayStr = monday.toISOString().split('T')[0];

  // 3. 設定 input 的範圍：最小為本週一，最大為今天
  moodDateInput.value = todayStr; // 預設選取今天
  moodDateInput.min = mondayStr;  // 👈 只能選本週一之後
  moodDateInput.max = todayStr;   // 👈 不能超過今天

  // 成長階段設定 (0~7 滴水)
  const treeStages = [
    { min: 0, max: 0, icon: '🌱', title: '沉睡的種子', msg: '「記錄今天的心情，給種子第一滴養分吧！」' },
    { min: 1, max: 2, icon: '🌿', title: '破土的小萌芽', msg: '「好棒！你開始覺察自己的感受，小芽冒出來了！」' },
    { min: 3, max: 4, icon: '🪴', title: '茁壯的小樹苗', msg: '「持續的覺察讓心靈更有力量，小樹正穩穩成長！」' },
    { min: 5, max: 6, icon: '🌸', title: '含苞待放的情緒樹', msg: '「誠實面對情緒是種超能力，花朵即將綻放！」' },
    { min: 7, max: 999, icon: '🌳✨', title: '盛開的彩虹之樹', msg: '「太厲害了！完成本週全勤記錄，你的心靈花園一片燦爛！」' }
  ];

  // 取得 7 天內的紀錄
  function getCleanedMoodLogs() {
    let logs = JSON.parse(localStorage.getItem('sel_mood_logs')) || [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    logs = logs.filter(log => new Date(log.date) >= oneWeekAgo);
    localStorage.setItem('sel_mood_logs', JSON.stringify(logs));
    return logs;
  }

  // 更新花園視覺狀態
  function updateGardenView(logsCount) {
    const points = Math.min(logsCount, 7);
    if (waterCountEl) waterCountEl.textContent = points;
    
    // 更新進度條
    const percent = Math.round((points / 7) * 100);
    if (treeProgressEl) treeProgressEl.style.width = percent + '%';

    // 匹配對應階段
    const stage = treeStages.find(s => points >= s.min && points <= s.max) || treeStages[0];
    if (treeVisualEl) treeVisualEl.textContent = stage.icon;
    if (treeStageTitleEl) treeStageTitleEl.textContent = stage.title;
    if (treeMessageEl) treeMessageEl.textContent = stage.msg;
  }

  // 渲染心情卡片列表
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

    // 刪除按鈕事件
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idToDelete = this.getAttribute('data-id');
        deleteLog(idToDelete);
      });
    });
  }

  // 觸發澆水動畫效果
  function triggerWaterEffect() {
    if (!treeVisualEl) return;
    treeVisualEl.classList.remove('watering-animate');
    void treeVisualEl.offsetWidth; // 強制重繪
    treeVisualEl.classList.add('watering-animate');
  }

  // 送出表單
  moodForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const selectedMoodRadio = document.querySelector('input[name="mood"]:checked');
    const newLog = {
      id: Date.now().toString(),
      date: moodDateInput.value,
      mood: selectedMoodRadio ? selectedMoodRadio.value : '開心',
      emoji: selectedMoodRadio ? selectedMoodRadio.getAttribute('data-emoji') : '😄',
      note: moodNoteInput.value.trim()
    };

    const logs = getCleanedMoodLogs();
    logs.push(newLog);
    localStorage.setItem('sel_mood_logs', JSON.stringify(logs));

    moodNoteInput.value = '';
    renderMoodLogs();
    triggerWaterEffect();
  });

  // 點擊澆水按鈕互動
  if (waterTreeBtn) {
    waterTreeBtn.addEventListener('click', function() {
      triggerWaterEffect();
    });
  }

  // 刪除紀錄
  function deleteLog(id) {
    let logs = getCleanedMoodLogs();
    logs = logs.filter(log => log.id !== id);
    localStorage.setItem('sel_mood_logs', JSON.stringify(logs));
    renderMoodLogs();
  }

  // 清空所有紀錄
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', function() {
      if (confirm('確定要清空近一週的心情紀錄與重置小樹嗎？')) {
        localStorage.removeItem('sel_mood_logs');
        renderMoodLogs();
      }
    });
  }

  // 初始載入
  renderMoodLogs();
});