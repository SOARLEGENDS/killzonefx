

const sessions = [
  { name: "Sydney", open: 20, close: 5 },
  { name: "Tokyo", open: 0, close: 9 },
  { name: "London", open: 8, close: 17 },
  { name: "New York", open: 13, close: 22 }
];

let showLocal = false;
const wrap = document.getElementById("sessions");
const timeline = document.getElementById("timeline");

document.getElementById("toggleTime").onclick = () => {
  showLocal = !showLocal;
  document.getElementById("toggleTime").textContent =
    showLocal ? "Show UTC Time" : "Show Local Time";
  render();
};

function nowMin() {
  const d = new Date();
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function state(open, close, now) {
  const o = open * 60;
  const c = close * 60;
  let openNow, left, total;

  if (o < c) {
    openNow = now >= o && now < c;
    total = c - o;
    left = openNow ? c - now : o - now;
  } else {
    openNow = now >= o || now < c;
    total = 1440 - o + c;
    left = openNow
      ? (now >= o ? 1440 - now + c : c - now)
      : o - now;
  }

  return {
    openNow,
    left,
    progress: openNow ? ((total - left) / total) * 100 : 0
  };
}

// ===== RED LINE CREATION =====
let nowLine = document.querySelector(".now-line");
if (!nowLine) {
  nowLine = document.createElement("div");
  nowLine.className = "now-line";
  timeline.appendChild(nowLine);
}

let nowLabel = document.getElementById("now-label");
if (!nowLabel) {
  nowLabel = document.createElement("div");
  nowLabel.id = "now-label";
  nowLabel.style.position = "absolute";
  nowLabel.style.top = "-20px";
  nowLabel.style.color = "#f85149";
  nowLabel.style.fontSize = "12px";
  timeline.appendChild(nowLabel);
}

let dragging = false;
let selectedMin = null;

let isSnappingBack = false;

let pointerActive = false;


// ===== DRAG EVENTS =====
nowLine.addEventListener("pointerdown", e => {
  pointerActive = true;
  dragging = true;
  nowLine.setPointerCapture(e.pointerId);
  e.preventDefault();
});

timeline.addEventListener("pointermove", e => {
  if (!dragging || isSnappingBack) return;

  const rect = timeline.getBoundingClientRect();
  selectedMin = ((e.clientX - rect.left) / rect.width) * 1440;
  renderTimeline();
});

document.addEventListener("pointerup", () => {
  if (!dragging) return;

  dragging = false;
  isSnappingBack = true;

  // snap back immediately
  selectedMin = null;
  renderTimeline();

  setTimeout(() => {
    isSnappingBack = false;
  }, 50);
});

// ===== MOST ACTIVE SESSION =====
function updateMostActiveSession() {
  const nowHour = new Date().getUTCHours();
  let activeSession = "Sydney"; // default
  
  // Simple logic based on typical trading volume patterns
  if (nowHour >= 0 && nowHour < 9) {
    activeSession = "Tokyo";
  } else if (nowHour >= 8 && nowHour < 17) {
    activeSession = "London";
  } else if (nowHour >= 13 && nowHour < 22) {
    activeSession = "New York";
  } else if ((nowHour >= 22 && nowHour < 24) || (nowHour >= 0 && nowHour < 5)) {
    activeSession = "Sydney";
  }
  
  // Update the badge
  document.getElementById("active-session-name").textContent = activeSession;
}

// ===== MAIN RENDER =====
function render() {
  wrap.innerHTML = "";
  timeline.innerHTML = "";

  const now = new Date();

  const states = sessions.map(s => ({
    ...s,
    key: s.name.toLowerCase().replace(" ", ""),
    st: state(s.open, s.close, nowMin())
  }));

  const openCount = states.filter(s => s.st.openNow).length;

  states.forEach(s => {
    // Session boxes
    const div = document.createElement("div");
    div.className = `session ${s.key}`;
    if (s.st.openNow && openCount >= 2) div.classList.add("overlap");

    div.innerHTML = `
      <div>
        <strong>${s.name}</strong>
        ${s.st.openNow && openCount >= 2
          ? '<span class="overlap-label">Overlap – High Liquidity</span>'
          : ''}
        <br>
        <small>
          ${s.st.openNow ? "Closes" : "Opens"} in
          ${Math.floor(s.st.left / 60)}h ${s.st.left % 60}m
        </small>
        <div class="bar">
          <div class="fill" style="width:${s.st.progress}%"></div>
        </div>
      </div>
      <div class="${s.st.openNow ? "open" : "closed"}">
        ${s.st.openNow ? "OPEN" : "CLOSED"}
      </div>
    `;

    wrap.appendChild(div);

    // Timeline bars
    const label = document.createElement("div");
    label.textContent = s.name;
    label.style.fontSize = "12px";
    label.style.marginBottom = "4px";

    const row = document.createElement("div");
    row.className = `time-row ${s.key}`;

    const start = (s.open * 60) / 1440 * 100;
    const end = (s.close * 60) / 1440 * 100;

    // Session DOES NOT cross midnight
    if (s.open < s.close) {
      const fill = document.createElement("div");
      fill.className = "time-fill";
      fill.style.left = start + "%";
      fill.style.width = (end - start) + "%";
      row.appendChild(fill);
    }
    // Session CROSSES midnight → split
    else {
      const fill1 = document.createElement("div");
      fill1.className = "time-fill split-left";
      fill1.style.left = start + "%";
      fill1.style.width = (100 - start) + "%";
      row.appendChild(fill1);

      const fill2 = document.createElement("div");
      fill2.className = "time-fill split-right";
      fill2.style.left = "0%";
      fill2.style.width = end + "%";
      row.appendChild(fill2);
    }

    timeline.appendChild(label);
    timeline.appendChild(row);
  });

  // Hour markers
  for (let h = 0; h <= 24; h += 3) {
    const pos = (h / 24) * 100;

    const line = document.createElement("div");
    line.className = "hour";
    line.style.left = pos + "%";

    const label = document.createElement("div");
    label.className = "hour-label";
    label.style.left = pos + "%";

    const base = new Date();
    base.setUTCHours(h, 0, 0, 0);

    label.textContent = showLocal
      ? base.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : String(h).padStart(2, "0") + ":00";

    timeline.appendChild(line);
    timeline.appendChild(label);
  }

  // Append red line and label
  timeline.appendChild(nowLine);
  timeline.appendChild(nowLabel);

  renderTimeline();
}

// ===== RED LINE / NOW-LABEL =====
function renderTimeline() {
  const now = new Date();
  const currentMin = selectedMin !== null ? selectedMin : now.getUTCHours() * 60 + now.getUTCMinutes();

  nowLine.style.left = (currentMin / 1440 * 100) + "%";
  nowLabel.style.left = (currentMin / 1440 * 100) + "%";

  const hours = Math.floor(currentMin / 60) % 24;
  const minutes = Math.floor(currentMin % 60);

  const base = new Date();
  base.setUTCHours(0, currentMin, 0, 0);

  nowLabel.textContent = showLocal
    ? base.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  document.getElementById("utc").textContent = showLocal
    ? `Local Time: ${now.toLocaleTimeString()}`
    : `UTC Time: ${now.toUTCString().slice(17, 25)}`;
}



function updateClock() {
  const now = new Date();
  document.getElementById("utc").textContent = showLocal
    ? "Local Time: " + now.toLocaleTimeString()
    : "UTC Time: " + now.toUTCString().slice(17, 25);
}
setInterval(updateClock, 1000);


// ===== FAQ TOGGLE =====


document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.parentElement.classList.toggle('active');
  });
});

// ===== UPDATE MOST ACTIVE SESSION =====
function updateMostActiveSession() {
  const nowHour = new Date().getUTCHours();
  let activeSession = "Sydney"; // default
  
  // Tokyo most active: 00:00-09:00 UTC
  if (nowHour >= 0 && nowHour < 9) {
    activeSession = "Tokyo";
  } 
  // London most active: 08:00-17:00 UTC
  else if (nowHour >= 8 && nowHour < 17) {
    activeSession = "London";
  } 
  // New York most active: 13:00-22:00 UTC
  else if (nowHour >= 13 && nowHour < 22) {
    activeSession = "New York";
  } 
  // Sydney most active: 20:00-05:00 UTC
  else if ((nowHour >= 20 && nowHour < 24) || (nowHour >= 0 && nowHour < 5)) {
    activeSession = "Sydney";
  }
  
  // Update the badge on the page
  document.getElementById("active-session-name").textContent = activeSession;
}

// ===== SHARE BUTTON =====
document.getElementById('shareBtn').addEventListener('click', function() {
  const shareData = {
    title: 'KillZone Forex Market Hours',
    text: 'Track live Forex market hours, trading sessions, and liquidity overlaps.',
    url: window.location.href
  };
  
  if (navigator.share) {
    // Mobile devices with Web Share API
    navigator.share(shareData)
      .then(() => console.log('Shared successfully'))
      .catch(err => console.log('Error sharing:', err));
  } else {
    // Desktop fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        alert('Link copied to clipboard! Share it with other traders.');
      })
      .catch(err => {
        prompt('Copy this link to share:', window.location.href);
      });
  }
});


// ===== WEEKEND/HOLIDAY CHECK =====
function checkWeekend() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getUTCHours();
  
  const notice = document.getElementById('weekend-notice');
  
  // Show notice on weekends (except Sunday evening when markets open)
  if ((day === 0 && hour < 22) || day === 6) {
    notice.style.display = 'block';
  } else {
    notice.style.display = 'none';
  }
}


// ===== DARK/LIGHT MODE TOGGLE =====
document.getElementById('themeToggle').addEventListener('click', function() {
  const body = document.body;
  const isDark = body.classList.contains('light-mode');
  
  if (isDark) {
    body.classList.remove('light-mode');
    this.textContent = '🌙 Dark Mode';
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.add('light-mode');
    this.textContent = '☀️ Light Mode';
    localStorage.setItem('theme', 'light');
  }
});

// Load saved theme
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light-mode');
  document.getElementById('themeToggle').textContent = '☀️ Light Mode';
}

nowLine.addEventListener("pointerdown", e => {
  nowLine.classList.add("dragging");
  // ... existing code
});

document.addEventListener("pointerup", () => {
  nowLine.classList.remove("dragging");
  // ... existing code
});

// ===== ECONOMIC CALENDAR =====
 


// ===== AUTO-START EVERYTHING =====
console.log("⏳ Starting KillZone Forex Tool...");

// Wait for page to be ready
if (document.readyState === 'loading') {
    // Page is still loading, wait for it
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    // Page is already loaded, start immediately
    startApp();
}

function startApp() {
    console.log("🚀 Starting all features...");
    
    // Start all your functions
    render();
    updateMostActiveSession();
    checkWeekend();
 
    
    
    // Set up auto-refresh every minute
    setInterval(() => {

// Add refreshing animation to calendar
    const calendar = document.getElementById('economic-calendar');
    if (calendar) calendar.classList.add('refreshing');
        render();
        renderTimeline();
        updateMostActiveSession();
        checkWeekend();
       
    }, 60000);
    
    console.log("✅ All features started successfully!");
}
