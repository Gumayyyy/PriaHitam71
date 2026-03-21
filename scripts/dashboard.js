function getCssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

const EMPTY_MESSAGE =
  "⚠ Belum ada data untuk ditampilkan";

const CHART_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PREVIEW_SERIES = Array(CHART_LABELS.length).fill(null);

let productivityChart = null;
let burnoutChart = null;

function parseTrackerData() {
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

function average(values) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function setMetricValue(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) element.innerText = Number(value || 0).toFixed(1);
}

function setProgressWidth(elementId, percentage) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const safeValue = Math.max(0, Math.min(100, percentage));
  element.style.width = `${safeValue}%`;
}

function resetSummaryCards() {
  setMetricValue("avgBelajar", 0);
  setMetricValue("avgTidur", 0);
  setMetricValue("avgHP", 0);
  setMetricValue("avgMood", 0);

  setProgressWidth("progBelajar", 0);
  setProgressWidth("progTidur", 0);
  setProgressWidth("progHP", 0);
  setProgressWidth("progMood", 0);
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

function destroyCharts() {
  if (productivityChart) {
    productivityChart.destroy();
    productivityChart = null;
  }

  if (burnoutChart) {
    burnoutChart.destroy();
    burnoutChart = null;
  }
}

function setDashboardEmptyState(isEmpty) {
  const productivityCard = document.getElementById("dashboardProductivityCard");
  if (productivityCard) productivityCard.classList.toggle("is-empty", isEmpty);

  const burnoutCard = document.getElementById("dashboardBurnoutCard");
  if (burnoutCard) burnoutCard.classList.toggle("is-empty", isEmpty);

  const productivityEmptyText = document.getElementById(
    "dashboardProductivityEmptyText",
  );
  if (productivityEmptyText) productivityEmptyText.textContent = EMPTY_MESSAGE;

  const burnoutEmptyText = document.getElementById("dashboardBurnoutEmptyText");
  if (burnoutEmptyText) burnoutEmptyText.textContent = EMPTY_MESSAGE;

  const productivityChartPanel = document.getElementById(
    "dashboardProductivityChartPanel",
  );
  if (productivityChartPanel) {
    productivityChartPanel.classList.toggle("no-data-preview", isEmpty);
  }

  const burnoutChartPanel = document.getElementById(
    "dashboardBurnoutChartPanel",
  );
  if (burnoutChartPanel) {
    burnoutChartPanel.classList.toggle("no-data-preview", isEmpty);
  }
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

function renderProductivityChart(belajar, tidur, hp, isPreview = false) {
  const canvas = document.getElementById("productivityChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const studyColor = getCssVar("--db-study");
  const sleepColor = getCssVar("--db-sleep");
  const phoneColor = getCssVar("--db-phone");

  if (productivityChart) productivityChart.destroy();

  productivityChart = new Chart(ctx, {
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

function renderBurnoutChart(mood, tidur, isPreview = false) {
  const canvas = document.getElementById("burnoutChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const moodColor = getCssVar("--db-mood");
  const sleepColor = getCssVar("--db-sleep");

  if (burnoutChart) burnoutChart.destroy();

  burnoutChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: CHART_LABELS,
      datasets: [
        {
          label: "Mood",
          data: mood,
          borderColor: moodColor,
          backgroundColor: buildAreaGradient(ctx, moodColor),
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
      ],
    },
    options: chartOptions(),
  });
}

function renderOverallCircle(score) {
  const circleElement = document.querySelector(".circular-chart .circle");
  const percentageElement = document.querySelector(
    ".circular-chart .percentage",
  );

  if (!circleElement || !percentageElement) return;

  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));

  circleElement.setAttribute("stroke-dasharray", `${safeScore}, 100`);
  percentageElement.textContent = `${safeScore}%`;
}

function renderOverallScore(avgBelajar, avgTidur, avgHP, avgMood) {
  const belajarScore = Math.min((avgBelajar / 8) * 100, 100);
  const tidurScore = Math.min((avgTidur / 8) * 100, 100);
  const hpScore = Math.max(0, Math.min(((6 - avgHP) / 8) * 100, 100));
  const moodScore = Math.min((avgMood / 10) * 100, 100);

  const overallBurnout = Math.round((tidurScore + moodScore) / 2);
  const overallProductivity = Math.round((belajarScore + hpScore) / 2);
  const overall = Math.round((overallBurnout + overallProductivity) / 2);

  renderOverallCircle(overall);
}

function renderEmptyState() {
  resetSummaryCards();
  setDashboardEmptyState(true);

  const analysisBoxes = document.getElementById("analysisBoxes");
  if (analysisBoxes) analysisBoxes.innerHTML = "";

  const rekomendasiList = document.getElementById("rekomendasiList");
  if (rekomendasiList) rekomendasiList.innerHTML = "";

  const burnoutAnalysis = document.getElementById("burnoutAnalysis");
  if (burnoutAnalysis) burnoutAnalysis.innerHTML = "";

  renderProductivityChart(PREVIEW_SERIES, PREVIEW_SERIES, PREVIEW_SERIES, true);
  renderBurnoutChart(PREVIEW_SERIES, PREVIEW_SERIES, true);
  renderOverallCircle(0);
}

function renderProductivityInsights(
  belajar,
  tidur,
  hp,
  avgBelajar,
  avgTidur,
  avgHP,
) {
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
        text: "Kondisi produktivitas relatif stabil",
        cls: "stable",
      });

    boxes.forEach((boxData) => {
      const div = document.createElement("div");
      div.className = `box ${boxData.cls}`;
      div.textContent = boxData.text;
      analysisBoxes.appendChild(div);
    });
  }

  const rekomendasiList = document.getElementById("rekomendasiList");
  if (rekomendasiList) {
    rekomendasiList.innerHTML = "";

    const recommendations = [];

    if (avgTidur < 6) {
      recommendations.push(
        "Coba atur waktu tidur lebih teratur. Tidur yang cukup bisa bantu tubuh dan pikiran lebih fresh buat aktivitas besok.",
      );
    }

    if (avgHP > avgBelajar) {
      recommendations.push(
        "Sepertinya waktu main HP masih lebih banyak dari waktu belajar. Mungkin bisa coba dikurangi sedikit supaya fokus belajarnya makin maksimal.",
      );
    }

    if (avgBelajar < 4) {
      recommendations.push(
        "Waktu belajar bisa ditambah sedikit lagi. Tidak perlu langsung banyak, yang penting pelan-pelan tapi konsisten setiap hari.",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Keren! Pola aktivitasmu sudah cukup seimbang. Pertahankan kebiasaan baik ini ya supaya produktivitas tetap stabil.",
      );
    }

    recommendations.forEach((rec) => {
      const li = document.createElement("li");
      li.textContent = rec;
      rekomendasiList.appendChild(li);
    });
  }
}

function renderBurnoutInsight(avgTidur, avgMood) {
  let skorTidur = 0;
  if (avgTidur >= 7 && avgTidur <= 9) skorTidur = 0;
  else if (avgTidur >= 6) skorTidur = 15;
  else if (avgTidur >= 5) skorTidur = 30;
  else skorTidur = 40;

  let skorMood = 0;
  if (avgMood >= 8) skorMood = 0;
  else if (avgMood >= 6) skorMood = 15;
  else if (avgMood >= 4) skorMood = 30;
  else skorMood = 40;

  let skor = skorTidur + skorMood;
  if (skor > 100) skor = 100;

  let status = "Rendah";
  if (skor > 70) status = "Tinggi";
  else if (skor > 40) status = "Sedang";

  const insight = document.getElementById("burnoutAnalysis");
  if (!insight) return;

  if (status === "Tinggi") {
    insight.innerHTML = `
      <div class="insight-heading"><i class="fa-solid fa-circle" style="color: #e35b66;"></i> Kondisi Kamu Lagi Kehabisan Energi.</div>
      <div class="insight-text">
      <br>
        Average Sleep Hours: ${avgTidur.toFixed(1)} hrs<br>
        Average Mood: ${avgMood.toFixed(1)} / 10<br><br>
          Energi kamu terlihat cukup terkuras. Coba beri waktu lebih untuk istirahat dan kurangi aktivitas yang terlalu berat agar tubuh dan pikiran bisa kembali pulih.
      </div>
    `;
  } else if (status === "Sedang") {
    insight.innerHTML = `
      <div class="insight-heading"><i class="fa-solid fa-circle" style="color: #f2c66d;"></i> Kondisi Kamu Mulai Drop.</div>
      <div class="insight-text">
      <br>
        Average Sleep Hours: ${avgTidur.toFixed(1)} hrs<br>
        Average Mood: ${avgMood.toFixed(1)} / 10<br><br>
          Kamu masih bisa beraktivitas dengan baik, tetapi tanda-tanda lelah mulai terasa. Coba atur kembali waktu istirahat agar energi tetap terjaga.
      </div>
    `;
  } else {
    insight.innerHTML = `
      <div class="insight-heading"><i class="fa-solid fa-circle" style="color: #4cc38e;"></i> Kondisi Kamu Stabil.</div>
      <div class="insight-text">
      <br>
        Average Sleep Hours: ${avgTidur.toFixed(1)} hrs<br>
        Average Mood: ${avgMood.toFixed(1)} / 10<br><br>
          Kondisi kamu cukup stabil. Pertahankan keseimbangan antara aktivitas, istirahat, dan mood agar tetap terjaga.
      </div>
    `;
  }
}

function renderDashboard() {
  const data = parseTrackerData();

  if (!hasValidData(data, ["belajar", "tidur", "hp", "mood"])) {
    renderEmptyState();
    return;
  }

  const belajar = data.map((item) => Number(item.belajar || 0));
  const tidur = data.map((item) => Number(item.tidur || 0));
  const hp = data.map((item) => Number(item.hp || 0));
  const mood = data.map((item) => Number(item.mood || 0));

  const avgBelajar = average(belajar);
  const avgTidur = average(tidur);
  const avgHP = average(hp);
  const avgMood = average(mood);

  setDashboardEmptyState(false);

  setMetricValue("avgBelajar", avgBelajar);
  setMetricValue("avgTidur", avgTidur);
  setMetricValue("avgHP", avgHP);
  setMetricValue("avgMood", avgMood);

  setProgressWidth("progBelajar", avgBelajar * 10);
  setProgressWidth("progTidur", avgTidur * 10);
  setProgressWidth("progHP", avgHP * 10);
  setProgressWidth("progMood", avgMood * 10);

  renderProductivityChart(belajar, tidur, hp, false);
  renderBurnoutChart(mood, tidur, false);
  renderOverallScore(avgBelajar, avgTidur, avgHP, avgMood);

  renderProductivityInsights(belajar, tidur, hp, avgBelajar, avgTidur, avgHP);
  renderBurnoutInsight(avgTidur, avgMood);
}

window.addEventListener("load", function () {
  renderDashboard();

  const themeToggle = document.getElementById("toggleMode");
  if (themeToggle) {
    themeToggle.addEventListener("change", () => {
      requestAnimationFrame(() => {
        renderDashboard();
      });
    });
  }
});

window.addEventListener("storage", (e) => {
  if (e.key === "trackerData") {
    renderDashboard();
  }
});
