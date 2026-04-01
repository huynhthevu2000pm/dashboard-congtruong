let chart;

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    window.fullData = data;
    render(data);
  });

function filterData(type) {
    if (type === "ALL") {
        render(fullData);
    } else {
        let filtered = fullData.filter(d => d.contractor === type);
        render(filtered);
    }
}

function render(data) {

    let total = data.reduce((sum, d) => sum + d.manpower, 0);
    document.getElementById("manpower").innerText = total;

    let avg = (data.reduce((sum, d) => sum + d.progress, 0) / data.length).toFixed(1);
    document.getElementById("progress").innerText = avg + "%";

    let labels = data.map(d => d.date);
    let values = data.map(d => d.manpower);

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("chart"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Nhân lực",
                data: values
            }]
        }
    });
}