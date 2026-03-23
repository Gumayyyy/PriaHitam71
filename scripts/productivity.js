function getCssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

const EMPTY_MESSAGE =
  "⚠ Belum ada data untuk ditampilkan";

const CHART_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PREVIEW_SERIES = Array(CHART_LABELS.length).fill(null);

let myChart = null;

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
  const raw = localStorage.getItem("trackerData");
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
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

function destroyChart() {
  if (myChart) {
    myChart.destroy();
    myChart = null;
  }
}

function setMetricValue(elementId, value) {
  const el = document.getElementById(elementId);
  if (el) el.innerText = Number(value || 0).toFixed(1);
}

function setProgressWidth(elementId, percentage) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const safeValue = Math.max(0, Math.min(100, percentage));
  el.style.width = `${safeValue}%`;
}

function showEmptyState() {
  setMetricValue("avgBelajar", 0);
  setMetricValue("avgTidur", 0);
  setMetricValue("avgHP", 0);

  setProgressWidth("progBelajar", 0);
  setProgressWidth("progTidur", 0);
  setProgressWidth("progHP", 0);

  setProductivityEmptyState(true);

  const analysisBoxes = document.getElementById("analysisBoxes");
  if (analysisBoxes) analysisBoxes.innerHTML = "";

  const rekomendasiList = document.getElementById("rekomendasiList");
  if (rekomendasiList) rekomendasiList.innerHTML = "";

  renderChart(PREVIEW_SERIES, PREVIEW_SERIES, PREVIEW_SERIES, true);
}

function setProductivityEmptyState(isEmpty) {
  const analysisCard = document.getElementById("productivityAnalysisCard");
  if (analysisCard) analysisCard.classList.toggle("is-empty", isEmpty);

  const emptyText = document.getElementById("productivityEmptyText");
  if (emptyText) emptyText.textContent = EMPTY_MESSAGE;

  const chartPanel = document.getElementById("productivityChartPanel");
  if (chartPanel) chartPanel.classList.toggle("no-data-preview", isEmpty);
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

function renderChart(belajar, tidur, hp, isPreview = false) {
  const canvas = document.getElementById("myChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const studyColor = getCssVar("--db-study");
  const sleepColor = getCssVar("--db-sleep");
  const phoneColor = getCssVar("--db-phone");

  destroyChart();

  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: CHART_LABELS,
      datasets: [
        {
          label: "Study Hours",
          data: belajar,
          borderColor: studyColor,
          backgroundColor: buildAreaGradient(ctx, studyColor),
          fill: false,
          tension: 0.35,
          borderWidth: isPreview ? 1.6 : 2,
          pointRadius: isPreview ? 0 : 3,
          spanGaps: false,
        },
        {
          label: "Sleep Hours",
          data: tidur,
          borderColor: sleepColor,
          backgroundColor: buildAreaGradient(ctx, sleepColor),
          fill: false,
          tension: 0.35,
          borderWidth: isPreview ? 1.6 : 2,
          pointRadius: isPreview ? 0 : 3,
          spanGaps: false,
        },
        {
          label: "Phone Usage",
          data: hp,
          borderColor: phoneColor,
          backgroundColor: buildAreaGradient(ctx, phoneColor),
          fill: false,
          tension: 0.35,
          borderWidth: isPreview ? 1.6 : 2,
          pointRadius: isPreview ? 0 : 3,
          spanGaps: false,
        },
      ],
    },
    options: chartOptions(),
  });
}

function renderAnalysis(belajar, tidur, hp, avgBelajar, avgTidur, avgHP) {
  const analysisBoxes = document.getElementById("analysisBoxes");
  if (analysisBoxes) {
    analysisBoxes.innerHTML = "";

    const boxes = [];
    const kurangTidur = tidur.filter((t) => t < 6).length;
    const hpDominan = hp.filter((h, i) => h > (belajar[i] || 0)).length;

    if (kurangTidur >= 3)
      boxes.push({ text: "⚠ Risiko kurang tidur!", cls: "risk" });
    if (hpDominan >= 5)
      boxes.push({
        text: "⚠ Penggunaan HP berlebih!",
        cls: "risk",
      });
    if (kurangTidur < 3 && hpDominan < 5)
      boxes.push({
        text: "🟢 Kondisi produktivitas relatif stabil",
        cls: "stable",
      });

    boxes.forEach((b) => {
      const div = document.createElement("div");
      div.className = `box ${b.cls}`;
      div.textContent = b.text;
      analysisBoxes.appendChild(div);
    });
  }

  const rekomendasiList = document.getElementById("rekomendasiList");
  if (rekomendasiList) {
    rekomendasiList.innerHTML = "";

    const recommendations = [];

    if (avgTidur < 6) {
      recommendations.push(
        "Jam tidur kamu kurang. Usahakan tidur 6-8 jam untuk kesehatan diri kamu",
      );
    }

    if (avgHP > avgBelajar) {
      recommendations.push(
        "Penggunaan HP lebih dominan dari belajar. Coba atur waktu penggunaan HP agar tidak mengganggu aktivitas belajar",
      );
    }

    if (avgBelajar < 4) {
      recommendations.push(
        "Waktu belajar kamu kurang. Usahakan belajar minimal 4 jam per hari agar akademik kamu tetap terjaga",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Aktivitas kamu cukup seimbang. Pertahankan pola ini untuk menjaga produktivitas dan kesehatan kamu!",
      );
    }

    recommendations.forEach((rec) => {
      const li = document.createElement("li");
      li.textContent = rec;
      rekomendasiList.appendChild(li);
    });
  }
}

async function renderProductivityPage() {
  const data = await parseTrackerData();

  if (!hasValidData(data, ["belajar", "tidur", "hp"])) {
    showEmptyState();
    return;
  }

  const belajar = data.map((item) => Number(item.belajar || 0));
  const tidur = data.map((item) => Number(item.tidur || 0));
  const hp = data.map((item) => Number(item.hp || 0));

  const avg = (arr) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const avgBelajar = avg(belajar);
  const avgTidur = avg(tidur);
  const avgHP = avg(hp);

  setProductivityEmptyState(false);

  setMetricValue("avgBelajar", avgBelajar);
  setMetricValue("avgTidur", avgTidur);
  setMetricValue("avgHP", avgHP);

  setProgressWidth("progBelajar", avgBelajar * 10);
  setProgressWidth("progTidur", avgTidur * 10);
  setProgressWidth("progHP", avgHP * 10);

  renderChart(belajar, tidur, hp, false);
  renderAnalysis(belajar, tidur, hp, avgBelajar, avgTidur, avgHP);
}

window.addEventListener("load", async function () {
  await renderProductivityPage();

  const themeToggle = document.getElementById("toggleMode");
  if (themeToggle) {
    themeToggle.addEventListener("change", async () => {
      requestAnimationFrame(async () => {
        await renderProductivityPage();
      });
    });
  }
});

// Refresh when data changes from another browser tab.
window.addEventListener("storage", (e) => {
  if (e.key === "trackerData") {
    renderProductivityPage();
  }
});
