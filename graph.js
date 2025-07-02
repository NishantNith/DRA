document.addEventListener("DOMContentLoaded", async () => {
  const baseLocations = [
    "LEH-Airport", "DND - PKG 1", "DND - PKG 2", "BMC", "ASSAM ROAD PROJECT",
    "AGARTALA ROAD PROJECT", "GUJARAT BULLET TRAIN", "RLDA-AHMD",
    "GLOBAL CITY", "CMRL-CHENNAI", "KHAMMAM ROAD PROJECT", "MP JAL NIGAM",
    "THANE DEPOT MUMBAI", "PRAYAGRAJ RLY STN", "PANIPAT TOLL PROJECT-HR",
    "PATHANGI TOLL PROJECT-TG", "NATHAVASLA TOLL PROJECT-AP", "NTPC PROJECT",
    "NHPC PROJECT", "OFC-H PROJECT", "MERTA-DRPL", "MAURITIUS NSLD"
  ];

  const dynamicLocations = JSON.parse(localStorage.getItem("dynamicLocations") || "[]");

  const validLocations = [...baseLocations];
  dynamicLocations.forEach(loc => {
    if (!validLocations.includes(loc)) validLocations.push(loc);
  });

  try {
    const res = await fetch("http://localhost:3000/leh-data");
    const lehData = await res.json();

    // ✅ Filter lehData to only valid locations
    const filteredData = lehData.filter(item =>
      item.location && validLocations.includes(item.location)
    );

    // ✅ Count entries per valid location
    const locationCounts = {};
    filteredData.forEach(item => {
      const loc = item.location;
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    const labels = Object.keys(locationCounts);
    const dataValues = Object.values(locationCounts);

    // 📊 Build chart
    const ctx = document.getElementById("locationChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Total Entries",
          data: dataValues,
          backgroundColor: "#4297a0",
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: context => ` ${context.parsed.y} entries`
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: "Work Location" },
            ticks: { autoSkip: false, maxRotation: 90, minRotation: 45 }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: "No. of  Projects" }
          }
        }
      }
    });

  } catch (err) {
    console.error("Error loading data:", err);
    alert("Failed to load graph data.");
  }
});
