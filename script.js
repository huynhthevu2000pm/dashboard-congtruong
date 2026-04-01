let rawData = [];
let chartInstances = {};

const valueLabelPlugin = {
  id: "valueLabelPlugin",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      if (dataset.type !== "line" || !dataset.showValueLabels) return;

      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta || meta.hidden) return;

      ctx.save();
      ctx.font = "bold 11px Arial";
      ctx.fillStyle = dataset.labelColor || dataset.borderColor || "#111827";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";

      meta.data.forEach((point, index) => {
        const value = dataset.data[index];
        if (value === null || value === undefined || value === "") return;

        const x = point.x;
        const y = point.y - 8;
        ctx.fillText(value, x, y);
      });

      ctx.restore();
    });
  }
};

Chart.register(valueLabelPlugin);

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
  if (value === null || value === undefined || value === "") return 0;
  return Number(String(value).replace("%", "").trim()) || 0;
}

function formatDateRange(data) {
  if (!data || data.length === 0) return "Từ -- đến --";
  const first = data[0]?.date ?? "--";
  const last = data[data.length - 1]?.date ?? "--";
  return `Từ ${first} đến ${last}`;
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

function buildCommonOptions(maxY = undefined) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 8,
        left: 4,
        right: 8,
        bottom: 0
      }
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          boxWidth: 22,
          boxHeight: 8,
          padding: 10,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        enabled: true
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          font: {
            size: 10
          }
        },
        grid: {
          color: "#e5e7eb"
        }
      },
      y: {
        beginAtZero: true,
        suggestedMax: maxY,
        ticks: {
          font: {
            size: 10
          },
          padding: 4
        },
        title: {
          display: true,
          text: "Số lượng",
          font: {
            size: 11,
            weight: "bold"
          }
        },
        grid: {
          color: "#e5e7eb"
        }
      }
    }
  };
}

function getNiceMax(values) {
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  const max = Math.max(...validValues, 0);

  if (max <= 50) return 60;
  if (max <= 80) return 100;
  if (max <= 120) return 140;
  if (max <= 200) return 220;
  if (max <= 300) return 320;
  if (max <= 400) return 420;

  return Math.ceil(max * 1.15);
}

function createComboChart(canvasId, labels, rebarData, dayworkerData, totalData, planData, titleText) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  const maxY = getNiceMax([...rebarData, ...dayworkerData, ...totalData, ...planData]);

  return new Chart(ctx, {
    data: {
      labels: labels,
      datasets: [
        {
          type: "bar",
          label: "Rebar",
          data: rebarData,
          backgroundColor: "#f97316",
          borderRadius: 2,
          categoryPercentage: 0.72,
          barPercentage: 0.78
        },
        {
          type: "bar",
          label: "Dayworker",
          data: dayworkerData,
          backgroundColor: "#3b82f6",
          borderRadius: 2,
          categoryPercentage: 0.72,
          barPercentage: 0.78
        },
        {
          type: "line",
          label: "Tổng thực tế",
          data: totalData,
          borderColor: "#ef4444",
          backgroundColor: "#ef4444",
          pointBackgroundColor: "#ef4444",
          pointBorderColor: "#ef4444",
          pointRadius: 2.5,
          pointHoverRadius: 3.5,
          borderWidth: 2,
          tension: 0.25,
          fill: false,
          showValueLabels: true,
          labelColor: "#ef4444"
        },
        {
          type: "line",
          label: "Tổng kế hoạch",
          data: planData,
          borderColor: "#22c55e",
          backgroundColor: "#22c55e",
          pointBackgroundColor: "#22c55e",
          pointBorderColor: "#22c55e",
          pointRadius: 2.5,
          pointHoverRadius: 3.5,
          borderWidth: 2,
          tension: 0.25,
          fill: false,
          showValueLabels: true,
          labelColor: "#22c55e"
        }
      ]
    },
    options: {
      ...buildCommonOptions(maxY),
      plugins: {
        ...buildCommonOptions(maxY).plugins,
        title: {
          display: false,
          text: titleText
        }
      }
    }
  });
}

function createTotalChart(canvasId, labels, totalData, planData) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  const maxY = getNiceMax([...totalData, ...planData]);

  return new Chart(ctx, {
    data: {
      labels: labels,
      datasets: [
        {
          type: "bar",
          label: "Tổng thực tế",
          data: totalData,
          backgroundColor: "#3b82f6",
          borderRadius: 2,
          categoryPercentage: 0.7,
          barPercentage: 0.72
        },
        {
          type: "line",
          label: "Tổng kế hoạch",
          data: planData,
          borderColor: "#ef4444",
          backgroundColor: "#ef4444",
          pointBackgroundColor: "#ef4444",
          pointBorderColor: "#ef4444",
          pointRadius: 2.5,
          pointHoverRadius: 3.5,
          borderWidth: 2,
          tension: 0.25,
          fill: false,
          showValueLabels: true,
          labelColor: "#ef4444"
        }
      ]
    },
    options: buildCommonOptions(maxY)
  });
}

function renderLaborCharts(data) {
  destroyCharts();

  const labels = data.map(item => item.date);
  const last = data[data.length - 1];

  document.getElementById("dateRangeText").textContent = formatDateRange(data);

  chartInstances.vqc = createComboChart(
    "chartVQC",
    labels,
    data.map(item => item.manpower_Rebar_VQC ?? 0),
    data.map(item => item.manpower_Dayworker_VQC ?? 0),
    data.map(item => item.manpower_Total_VQC ?? 0),
    data.map(item => item.plan_manpower_VQC ?? 0),
    "Biểu đồ nhân lực VQC"
  );

  chartInstances.clc = createComboChart(
    "chartCLC",
    labels,
    data.map(item => item.manpower_Rebar_CLC ?? 0),
    data.map(item => item.manpower_Dayworker_CLC ?? 0),
    data.map(item => item.manpower_Total_CLC ?? 0),
    data.map(item => item.plan_manpower_CLC ?? 0),
    "Biểu đồ nhân lực CLC"
  );

  chartInstances.cc14 = createComboChart(
    "chartCC14",
    labels,
    data.map(item => item.manpower_Rebar_CC14 ?? 0),
    data.map(item => item.manpower_Dayworker_CC14 ?? 0),
    data.map(item => item.manpower_Total_CC14 ?? 0),
    data.map(item => item.plan_manpower_CC14 ?? 0),
    "Biểu đồ nhân lực CC14"
  );

  chartInstances.at = createComboChart(
    "chartAT",
    labels,
    data.map(item => item.manpower_Rebar_AT ?? 0),
    data.map(item => item.manpower_Dayworker_AT ?? 0),
    data.map(item => item.manpower_Total_AT ?? 0),
    data.map(item => item.plan_manpower_AT ?? 0),
    "Biểu đồ nhân lực AT"
  );

  chartInstances.cc1 = createTotalChart(
    "chartCC1",
    labels,
    data.map(item => item.Total_manpower_CC1 ?? 0),
    data.map(item => item.TotalPlan_manpower_CC1 ?? 0)
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