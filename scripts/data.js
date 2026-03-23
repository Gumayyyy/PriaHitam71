// Build weekly input table for 7 days.
const hari = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const tableBody = document.getElementById("tableBody");
hari.forEach((h) => {
  tableBody.innerHTML += `
    <tr>
      <td>${h}</td>
      <td><input type="text" inputmode="decimal" placeholder="Study" class="belajar jam-input"></td>
    <td><input type="text" inputmode="decimal" placeholder="Sleep" class="tidur jam-input"></td>
    <td><input type="text" inputmode="decimal" placeholder="Phone" class="hp jam-input"></td>
    <td><input type="text" inputmode="decimal" placeholder="Mood" class="mood jam-input"></td>
    </tr>
`;
});

// Initialize form, load saved data, and wire all input validators.
document.addEventListener("DOMContentLoaded", async function () {
  await loadData();

  const inputs = document.querySelectorAll(".jam-input");

  inputs.forEach((input) => {
    // Event listener untuk real-time filtering input
    input.addEventListener("input", () => {
      let value = input.value;

      // Hapus selain angka & titik
      value = value.replace(/[^0-9.]/g, "");

      // Maksimal satu titik (desimal)
      const parts = value.split(".");
      if (parts.length > 2) {
        value = parts[0] + "." + parts[1];
      }

      input.value = value;
    });

    // Event listener untuk validasi saat blur (user meninggalkan input)
    input.addEventListener("blur", () => {
      if (input.value === "" || input.value === ".") {
        input.value = "";
        return;
      }

      let num = parseFloat(input.value);

      if (isNaN(num)) {
        input.value = "";
        return;
      }

      if (input.classList.contains("mood")) {
        // Validasi Mood: min 1, max 10
        if (num < 1) num = 1;
        if (num > 10) num = 10;

        num = Math.round(num * 2) / 2;

        input.value = num;
        return;
      }

      // Validasi Jam (Tidur, Belajar, HP): min 0, max 24
      if (num < 0) num = 0;
      if (num > 24) num = 24;

      // Bulatkan ke 0.5
      num = Math.round(num * 2) / 2;

      input.value = num;
    });
  });
});

function saveData() {
  // Persist table content into Firestore in day-order.
  const data = [];

  const rows = document.querySelectorAll("tr");

  rows.forEach((row, index) => {
    if (index === 0) return; // skip header

    const belajar = row.querySelector(".belajar")?.value || "";
    const tidur = row.querySelector(".tidur")?.value || "";
    const hp = row.querySelector(".hp")?.value || "";
    const mood = row.querySelector(".mood")?.value || "";

    data.push({ belajar, tidur, hp, mood });
  });

  // Save to localStorage for immediate UI update
  localStorage.setItem("trackerData", JSON.stringify(data));

  // Save to Firestore if user is logged in
  if (window.auth && window.db) {
    window.auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
          await setDoc(doc(window.db, "userData", user.uid), {
            trackerData: data,
            lastUpdated: new Date()
          });
        } catch (error) {
          console.error("Error saving to Firestore:", error);
        }
      }
    });
  }

  hitungData(); // Update chart setelah save
}

async function loadData() {
  // Try to load from Firestore first, fallback to localStorage
  if (window.auth && window.db) {
    try {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const user = window.auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(window.db, "userData", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const data = userData.trackerData || [];
          populateTable(data);
          // Also save to localStorage for consistency
          localStorage.setItem("trackerData", JSON.stringify(data));
          // Display chart if there's data
          if (data.some(item => item.belajar || item.tidur || item.hp || item.mood)) {
            loadAndDisplayChart(data);
          }
          return;
        }
      }
    } catch (error) {
      console.error("Error loading from Firestore:", error);
    }
  }

  // Fallback to localStorage
  const saved = localStorage.getItem("trackerData");
  if (!saved) return;

  const data = JSON.parse(saved);
  populateTable(data);
  // Display chart if there's data
  if (data.some(item => item.belajar || item.tidur || item.hp || item.mood)) {
    loadAndDisplayChart(data);
  }
}

function populateTable(data) {
  const rows = document.querySelectorAll("tr");

  data.forEach((item, index) => {
    const row = rows[index + 1];
    if (!row) return;

    row.querySelector(".belajar").value = item.belajar;
    row.querySelector(".tidur").value = item.tidur;
    row.querySelector(".hp").value = item.hp;
    row.querySelector(".mood").value = item.mood;
  });
}

function loadAndDisplayChart(data) {
  // Display the chart with the provided data without saving
  const palette = getInputChartPalette();
  let isEmpty = !hasAnyFilledInput(data);
  let dataBelajar = [],
    dataTidur = [],
    dataHP = [],
    dataMood = [];

  data.forEach((item) => {
    dataBelajar.push(Number(item.belajar || 0));
    dataTidur.push(Number(item.tidur || 0));
    dataHP.push(Number(item.hp || 0));
    dataMood.push(Number(item.mood || 0));
  });

  setChartEmptyState(isEmpty);

  const ctx = document.getElementById("weeklyChart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: hari,
      datasets: [
        {
          label: "Study Hours",
          data: dataBelajar,
          backgroundColor: palette.fills[0],
          borderColor: palette.borders[0],
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: "Sleep Hours",
          data: dataTidur,
          backgroundColor: palette.fills[1],
          borderColor: palette.borders[1],
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: "Phone Usage",
          data: dataHP,
          backgroundColor: palette.fills[2],
          borderColor: palette.borders[2],
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: "Mood",
          data: dataMood,
          backgroundColor: palette.fills[3],
          borderColor: palette.borders[3],
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: palette.legend,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: palette.ticks },
          grid: { color: palette.grid },
        },
        y: {
          beginAtZero: true,
          ticks: { color: palette.ticks },
          grid: { color: palette.grid },
        },
      },
    },
  });
}

let chart;

function hasAnyFilledInput(data) {
  if (!Array.isArray(data) || data.length === 0) return false;

  return data.some((item) => {
    if (!item || typeof item !== "object") return false;

    return [item.belajar, item.tidur, item.hp, item.mood].some((value) => {
      if (value === null || value === undefined) return false;
      return String(value).trim() !== "";
    });
  });
}

function setChartEmptyState(isEmpty) {
  const chartPanel = document.getElementById("inputDataChartPanel");
  if (!chartPanel) return;

  chartPanel.classList.toggle("no-data-preview", isEmpty);
}

function getCssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function getInputChartPalette() {
  return {
    fills: [
      getCssVar("--in-chart-sleep"),
      getCssVar("--in-chart-study"),
      getCssVar("--in-chart-phone"),
      getCssVar("--in-chart-mood"),
    ],
    borders: [
      getCssVar("--in-chart-sleep-border"),
      getCssVar("--in-chart-study-border"),
      getCssVar("--in-chart-phone-border"),
      getCssVar("--in-chart-mood-border"),
    ],
    ticks: getCssVar("--in-chart-text"),
    grid: getCssVar("--in-chart-grid"),
    legend: getCssVar("--in-chart-legend"),
  };
}

function hitungData() {
  // Collect current form data and save it
  const data = [];

  const rows = document.querySelectorAll("tr");

  rows.forEach((row, index) => {
    if (index === 0) return; // skip header

    const belajar = row.querySelector(".belajar")?.value || "";
    const tidur = row.querySelector(".tidur")?.value || "";
    const hp = row.querySelector(".hp")?.value || "";
    const mood = row.querySelector(".mood")?.value || "";

    data.push({ belajar, tidur, hp, mood });
  });

  // Save to localStorage and Firestore
  localStorage.setItem("trackerData", JSON.stringify(data));

  // Save to Firestore if user is logged in
  if (window.auth && window.db) {
    window.auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
          await setDoc(doc(window.db, "userData", user.uid), {
            trackerData: data,
            lastUpdated: new Date()
          });
        } catch (error) {
          console.error("Error saving to Firestore:", error);
        }
      }
    });
  }

  // Display the chart
  loadAndDisplayChart(data);
}

const themeToggle = document.getElementById("toggleMode");
if (themeToggle) {
  themeToggle.addEventListener("change", () => {
    requestAnimationFrame(() => {
      // Re-render chart with current data without saving
      const saved = localStorage.getItem("trackerData");
      if (saved) {
        const data = JSON.parse(saved);
        loadAndDisplayChart(data);
      }
    });
  });
}

// Sync chart ketika tab lain mengubah data di localStorage
window.addEventListener("storage", (e) => {
  if (e.key === "trackerData") {
    const saved = localStorage.getItem("trackerData");
    if (saved) {
      const data = JSON.parse(saved);
      loadAndDisplayChart(data);
    }
  }
});
