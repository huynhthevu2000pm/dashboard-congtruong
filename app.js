let rawData = [];
let chartInstances = {};

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById(pageId).classList.add("active");

  if (pageId === "laborPage") {
    setupLaborPage();
  }
}

async function loadData() {
  try {
    const response = await fetch("data.json");
    rawData = await response.json();
    console.log("Data loaded:", rawData);
  } catch (error) {
    console.error("Lỗi load data.json:", error);
  }
}

function destroyCharts() {
  Object.values(chartInstances).forEach(chart => {
    if (chart) chart.destroy();
  });
  chartInstances = {};
}

function parsePercent(value) {
  if (value === null || value === undefined) return 0;
  return String(value).replace("%", "");
}

function setupLaborPage() {
  if (!rawData || rawData.length === 0) return;

  const slider = document.getElementById("timeRange");
  slider.max = rawData.length;
  slider.value = rawData.length;

  renderLaborCharts(rawData);

  slider.oninput = function () {
    const count = Number(this.value);
    const filteredData = rawData.slice(-count);
    renderLaborCharts(filteredData);
  };
}

function createComboChart(canvasId, labels, rebarData, dayworkerData, totalData, planData, titleText) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  return new Chart(ctx, {
    data: {
      labels: labels,
      datasets: [
        {
          type: "bar",
          label: "Rebar",
          data: rebarData,
          backgroundColor: "#f97316"
        },
        {
          type: "bar",
          label: "Dayworker",
          data: dayworkerData,
          backgroundColor: "#3b82f6"
        },
        {
          type: "line",
          label: "Tổng thực tế",
          data: totalData,
          borderColor: "#ef4444",
          backgroundColor: "#ef4444",
          tension: 0.25,
          fill: false
        },
        {
          type: "line",
          label: "Tổng kế hoạch",
          data: planData,
          borderColor: "#22c55e",
          backgroundColor: "#22c55e",
          tension: 0.25,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false,
          text: titleText
        },
        legend: {
          position: "top"
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Số lượng"
          }
        }
      }
    }
  });
}

function createTotalChart(canvasId, labels, totalData, planData) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  return new Chart(ctx, {
    data: {
      labels: labels,
      datasets: [
        {
          type: "bar",
          label: "Tổng thực tế",
          data: totalData,
          backgroundColor: "#3b82f6"
        },
        {
          type: "line",
          label: "Tổng kế hoạch",
          data: planData,
          borderColor: "#ef4444",
          backgroundColor: "#ef4444",
          tension: 0.25,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top"
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Số lượng"
          }
        }
      }
    }
  });
}

function renderLaborCharts(data) {
  destroyCharts();

  const labels = data.map(item => item.date);
  const last = data[data.length - 1];

  chartInstances.vqc = createComboChart(
    "chartVQC",
    labels,
    data.map(item => item.manpower_Rebar_VQC),
    data.map(item => item.manpower_Dayworker_VQC),
    data.map(item => item.manpower_Total_VQC),
    data.map(item => item.plan_manpower_VQC),
    "Biểu đồ nhân lực VQC"
  );

  chartInstances.clc = createComboChart(
    "chartCLC",
    labels,
    data.map(item => item.manpower_Rebar_CLC),
    data.map(item => item.manpower_Dayworker_CLC),
    data.map(item => item.manpower_Total_CLC),
    data.map(item => item.plan_manpower_CLC),
    "Biểu đồ nhân lực CLC"
  );

  chartInstances.cc14 = createComboChart(
    "chartCC14",
    labels,
    data.map(item => item.manpower_Rebar_CC14),
    data.map(item => item.manpower_Dayworker_CC14),
    data.map(item => item.manpower_Total_CC14),
    data.map(item => item.plan_manpower_CC14),
    "Biểu đồ nhân lực CC14"
  );

  chartInstances.at = createComboChart(
    "chartAT",
    labels,
    data.map(item => item.manpower_Rebar_AT),
    data.map(item => item.manpower_Dayworker_AT),
    data.map(item => item.manpower_Total_AT),
    data.map(item => item.plan_manpower_AT),
    "Biểu đồ nhân lực AT"
  );

  chartInstances.cc1 = createTotalChart(
    "chartCC1",
    labels,
    data.map(item => item.Total_manpower_CC1),
    data.map(item => item.TotalPlan_manpower_CC1)
  );

  document.getElementById("totalLabor").textContent = last.Total_manpower_CC1 ?? 0;
  document.getElementById("progressCC1Top").textContent = last.progress_CC1 ?? "0%";

  document.getElementById("percentVQC").textContent = last.progress_VQC ?? "0%";
  document.getElementById("percentCLC").textContent = last.progress_CLC ?? "0%";
  document.getElementById("percentCC14").textContent = last.progress_CC14 ?? "0%";
  document.getElementById("percentAT").textContent = last.progress_AT ?? "0%";
  document.getElementById("percentCC1").textContent = last.progress_CC1 ?? "0%";
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadData();
});