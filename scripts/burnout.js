const hari = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PREVIEW_SERIES = Array(hari.length).fill(null);
let sleepChart = null;

const EMPTY_MESSAGE =
  "⚠ Belum ada data untuk ditampilkan";

function getCssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function hexToRgba(hex, alpha) {
  const value = (hex || "").replace("#", "").trim();
  if (value.length !== 6) return `rgba(44, 83, 100, ${alpha})`;

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildAreaGradient(ctx, colorHex) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 360);
  gradient.addColorStop(0, hexToRgba(colorHex, 0.34));
  gradient.addColorStop(1, hexToRgba(colorHex, 0));
  return gradient;
}

function chartOptions() {
  const chartText = getCssVar("--db-chart-text");
  const chartGrid = getCssVar("--db-chart-grid");
  const tooltipBg = getCssVar("--db-tooltip-bg");

  return {
    responsive: true,
    animation: false,
    plugins: {
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: "#fff",
        bodyColor: "#fff",
      },
      legend: { labels: { color: chartText } },
    },
    scales: {
      x: {
        ticks: { color: chartText },
        grid: { color: chartGrid },
      },
      y: {
        beginAtZero: true,
        ticks: { color: chartText },
        grid: { color: chartGrid },
      },
    },
  };
}

async function parseTrackerData() {
  // Try to load from Firestore first
  if (window.auth && window.db) {
    try {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const user = window.auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(window.db, "userData", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const data = userData.trackerData || [];
          return Array.isArray(data) ? data : [];
        }
      }
    } catch (error) {
      console.error("Error loading from Firestore:", error);
    }
  }

  // Fallback to localStorage
  const saved = localStorage.getItem("trackerData");
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isMeaningfulValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return false;

    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber)) return asNumber > 0;

    return false;
  }

  return false;
}

function hasValidData(data, metricKeys) {
  if (!Array.isArray(data) || data.length === 0) return false;

  return data.some(
    (item) =>
      item &&
      typeof item === "object" &&
      metricKeys.some((key) => isMeaningfulValue(item[key])),
  );
}

function hitungSkorBurnout(rataTidur, rataMood) {
  let skorTidur = 0;
  if (rataTidur >= 7 && rataTidur <= 9) skorTidur = 0;
  else if (rataTidur >= 6) skorTidur = 15;
  else if (rataTidur >= 5) skorTidur = 30;
  else skorTidur = 40;

  let skorMood = 0;
  if (rataMood >= 8) skorMood = 0;
  else if (rataMood >= 6) skorMood = 15;
  else if (rataMood >= 4) skorMood = 30;
  else skorMood = 40;

  return Math.min(skorTidur + skorMood, 100);
}

function renderCircle(skor) {
  const scoreTextEl = document.querySelector(".circular-chart .percentage");
  const circlePath = document.querySelector(".circular-chart .circle-path");

  if (scoreTextEl) scoreTextEl.textContent = `${skor}%`;
  if (circlePath) circlePath.setAttribute("stroke-dasharray", `${skor}, 100`);
}

function destroySleepChart() {
  if (sleepChart) {
    sleepChart.destroy();
    sleepChart = null;
  }
}

function showEmptyState() {
  renderCircle(0);

  const statusText = document.getElementById("statusText");
  if (statusText) statusText.innerText = "Category: -";

  const insight = document.getElementById("insightBox");
  if (insight) {
    insight.classList.add("is-empty");
    insight.textContent = EMPTY_MESSAGE;
  }

  const tips = document.getElementById("tipsBox");
  if (tips) {
    tips.classList.add("is-empty");
    tips.textContent = EMPTY_MESSAGE;
  }

  const chartPanel = document.getElementById("burnoutChartPanel");
  if (chartPanel) chartPanel.classList.add("no-data-preview");

  renderSleepChart(PREVIEW_SERIES, PREVIEW_SERIES, true);
}

function renderStatusAndNotes(status, rataTidur, rataMood) {
  const statusText = document.getElementById("statusText");
  const insight = document.getElementById("insightBox");
  const tips = document.getElementById("tipsBox");
  const chartPanel = document.getElementById("burnoutChartPanel");

  if (statusText) statusText.innerText = `Category: ${status}`;
  if (chartPanel) chartPanel.classList.remove("no-data-preview");

  if (insight) {
    insight.classList.remove("is-empty");

    if (status === "High") {
      insight.innerHTML = `
        <div class="insight-heading"><i class="fa-solid fa-circle" style="color: #e35b66;"></i> Burnout Level: High</div>
        <div class="insight-text">
          Average Sleep Hours: ${rataTidur.toFixed(1)} hrs<br>
          Average Mood: ${rataMood.toFixed(1)} / 10<br><br>
          Disarankan memperbaiki pola tidur dan mengurangi tekanan aktivitas.
        </div>
      `;
    } else if (status === "Moderate") {
      insight.innerHTML = `
        <div class="insight-heading"><i class="fa-solid fa-circle" style="color: #f2c66d;"></i> Burnout Level: Moderate</div>
        <div class="insight-text">
          Average Sleep Hours: ${rataTidur.toFixed(1)} hrs<br>
          Average Mood: ${rataMood.toFixed(1)} / 10<br><br>
          Perlu manajemen waktu dan istirahat yang lebih konsisten.
        </div>
      `;
    } else {
      insight.innerHTML = `
        <div class="insight-heading"><i class="fa-solid fa-circle" style="color: #4cc38e;"></i> Burnout Level: Low</div>
        <div class="insight-text">
          Average Sleep Hours: ${rataTidur.toFixed(1)} hrs<br>
          Average Mood: ${rataMood.toFixed(1)} / 10<br><br>
          Kondisi mental relatif stabil.
        </div>
      `;
    }
  }

  if (tips) {
    tips.classList.remove("is-empty");

    if (status === "High") {
      tips.innerHTML = `
        <div class="tips-heading"><i class="fa-solid fa-circle" style="color: #e35b66;"></i> Kondisi Kamu Lagi Kehabisan Energi</div>
        <div class="tips-text">
          Kondisi kamu sedang cukup berat dan memang butuh perhatian lebih. Saat beban terasa menumpuk, wajar kalau energi ikut turun dan semuanya terasa melelahkan. Di fase ini, penting untuk tidak terus memaksakan diri agar tetap produktif. Coba pelan-pelan atur ulang ritme harian, perbaiki pola tidur, dan kurangi tekanan yang tidak terlalu mendesak. Istirahat bukan berarti menyerah, tetapi cara agar kamu bisa kembali stabil.
        </div>
      `;
    } else if (status === "Moderate") {
      tips.innerHTML = `
        <div class="tips-heading"><i class="fa-solid fa-circle" style="color: #f2c66d;"></i> Kondisi Kamu Mulai Drop</div>
        <div class="tips-text">
          Kamu masih bisa mengontrol keadaan, tetapi tanda-tanda lelah mulai terasa. Ini menjadi pengingat untuk lebih sadar dalam mengatur waktu dan energi. Jangan menunggu sampai benar-benar kehabisan tenaga baru berhenti. Sisihkan waktu untuk istirahat dan lakukan hal-hal sederhana yang bisa membantu memulihkan semangat.
        </div>
      `;
    } else {
      tips.innerHTML = `
        <div class="tips-heading"><i class="fa-solid fa-circle" style="color: #4cc38e;"></i> Kondisi Kamu Stabil</div>
        <div class="tips-text">
          Kondisi kamu relatif stabil dan cukup terjaga. Pertahankan pola tidur yang konsisten dan manajemen aktivitas yang sehat agar burnout tetap rendah.
        </div>
      `;
    }
  }
}

function renderSleepChart(sleepData, moodData, isPreview = false) {
  const canvas = document.getElementById("sleepChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const sleepColor = getCssVar("--db-sleep");
  const moodColor = getCssVar("--db-mood");

  destroySleepChart();

  sleepChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: hari,
      datasets: [
        {
          label: "Mood",
          data: moodData,
          borderColor: moodColor,
          backgroundColor: buildAreaGradient(ctx, moodColor),
          tension: 0.35,
          fill: false,
          borderWidth: isPreview ? 1.6 : 2,
          pointRadius: isPreview ? 0 : 3,
          spanGaps: false,
        },
        {
          label: "Sleep Hours",
          data: sleepData,
          borderColor: sleepColor,
          backgroundColor: buildAreaGradient(ctx, sleepColor),
          tension: 0.35,
          fill: false,
          borderWidth: isPreview ? 1.6 : 2,
          pointRadius: isPreview ? 0 : 3,
          spanGaps: false,
        },
      ],
    },
    options: chartOptions(),
  });
}

async function hitungBurnout() {
  const data = await parseTrackerData();

  if (!hasValidData(data, ["tidur", "mood"])) {
    showEmptyState();
    return;
  }

  const sleepData = data.map((item) => Number(item.tidur || 0));
  const moodData = data.map((item) => Number(item.mood || 0));

  const avgSleepData = sleepData.filter((value) => Number.isFinite(value));
  const avgMoodData = moodData.filter((value) => Number.isFinite(value));

  const rataTidur = avgSleepData.length
    ? avgSleepData.reduce((a, b) => a + b, 0) / avgSleepData.length
    : 0;
  const rataMood = avgMoodData.length
    ? avgMoodData.reduce((a, b) => a + b, 0) / avgMoodData.length
    : 0;

  const chartSleepData = sleepData.slice(0, 7);
  const chartMoodData = moodData.slice(0, 7);

  while (chartSleepData.length < 7) chartSleepData.push(0);
  while (chartMoodData.length < 7) chartMoodData.push(0);

  const skor = hitungSkorBurnout(rataTidur, rataMood);
  let status = "Low";
  if (skor > 70) status = "High";
  else if (skor > 40) status = "Moderate";

  renderCircle(skor);
  renderStatusAndNotes(status, rataTidur, rataMood);
  renderSleepChart(chartSleepData, chartMoodData, false);
}

document.addEventListener("DOMContentLoaded", async () => {
  await hitungBurnout();

  const themeToggle = document.getElementById("toggleMode");
  if (themeToggle) {
    themeToggle.addEventListener("change", async () => {
      requestAnimationFrame(async () => {
        await hitungBurnout();
      });
    });
  }
});

// Recalculate automatically when trackerData changes in another tab.
window.addEventListener("storage", (e) => {
  if (e.key === "trackerData") {
    hitungBurnout();
  }
});
