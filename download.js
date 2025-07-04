document.addEventListener("DOMContentLoaded", async () => {
  const select = document.getElementById("locationSelect");
  const downloadBtn = document.getElementById("downloadBtn");

  const res = await fetch("https://dra-backend.onrender.com/leh-data");
  const data = await res.json();

  const baseLocations = [
    "LEH-Airport", "DND - PKG 1", "DND - PKG 2", "BMC", "ASSAM ROAD PROJECT",
    "AGARTALA ROAD PROJECT", "GUJARAT BULLET TRAIN", "RLDA-AHMD", "GLOBAL CITY",
    "CMRL-CHENNAI", "KHAMMAM ROAD PROJECT", "MP JAL NIGAM", "THANE DEPOT MUMBAI",
    "PRAYAGRAJ RLY STN", "PANIPAT TOLL PROJECT-HR", "PATHANGI TOLL PROJECT-TG",
    "NATHAVASLA TOLL PROJECT-AP", "NTPC PROJECT", "NHPC PROJECT",
    "OFC-H PROJECT", "MERTA-DRPL", "MAURITIUS NSLD"
  ];
  const dynamicLocations = JSON.parse(localStorage.getItem("workLocations") || "[]");
  const activeLocations = [...baseLocations, ...dynamicLocations];

  const filteredData = data.filter(entry => activeLocations.includes(entry.location));
  const uniqueLocations = [...new Set(filteredData.map(d => d.location))];

  uniqueLocations.forEach(loc => {
    const opt = document.createElement("option");
    opt.value = loc;
    opt.textContent = loc;
    select.appendChild(opt);
  });

  downloadBtn.addEventListener("click", () => {
    const selected = select.value;
    const filtered = selected === "all"
      ? filteredData
      : filteredData.filter(item => item.location === selected);

    if (filtered.length === 0) {
      alert("No data found for selected location.");
      return;
    }

    const headers = [
      "Description", "Permission Type", "Agency", "Applicable",
      "Registered", "License", "Validity", "Remarks", "Quantity"
    ];

    const sheetData = [headers];

    filtered.forEach(item => {
      sheetData.push([
        item.description || "N/A",
        item.permission_type || "N/A",
        item.agency || "N/A",
        item.applicable || "No",
        item.registered || "No",
        item.license || "N/A",
        item.validity ? new Date(item.validity).toLocaleDateString() : "N/A",
        item.remarks || "N/A",
        item.quantity || "N/A"
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Work Details");

    const filename = selected === "all"
      ? "All_Work_Locations.xlsx"
      : `${selected.replace(/\s+/g, "_")}_Details.xlsx`;

    XLSX.writeFile(wb, filename);
  });
});
