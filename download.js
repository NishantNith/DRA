document.addEventListener("DOMContentLoaded", async () => {
  const select = document.getElementById("locationSelect");
  const downloadBtn = document.getElementById("downloadBtn");

  // Add loading spinner element
  let loadingSpinner = document.createElement("div");
  loadingSpinner.id = "loadingSpinner";
  loadingSpinner.style.display = "none";
  loadingSpinner.style.position = "fixed";
  loadingSpinner.style.top = "0";
  loadingSpinner.style.left = "0";
  loadingSpinner.style.width = "100vw";
  loadingSpinner.style.height = "100vh";
  loadingSpinner.style.background = "rgba(255,255,255,0.7)";
  loadingSpinner.style.zIndex = "9999";
  loadingSpinner.style.justifyContent = "center";
  loadingSpinner.style.alignItems = "center";
  loadingSpinner.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div class="spinner" style="border: 8px solid #f3f3f3; border-top: 8px solid #4297a0; border-radius: 50%; width: 60px; height: 60px; animation: spin 1s linear infinite;"></div>
      <div style="margin-top:16px;font-weight:bold;color:#4297a0;">Downloading...</div>
    </div>
    <style>
      @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
    </style>
  `;
  document.body.appendChild(loadingSpinner);

  function showLoading(show) {
    loadingSpinner.style.display = show ? "flex" : "none";
  }

  const API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://dra-backend.onrender.com";

  let data = [];
  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/leh-data`);
    data = await res.json();
    showLoading(false);
  } catch (err) {
    showLoading(false);
    alert("Failed to load data from server.");
    return;
  }

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

  select.innerHTML = `<option value="all">All Locations</option>`;
  uniqueLocations.forEach(loc => {
    const opt = document.createElement("option");
    opt.value = loc;
    opt.textContent = loc;
    select.appendChild(opt);
  });

  downloadBtn.addEventListener("click", () => {
    showLoading(true);
    setTimeout(() => {
      try {
        const selected = select.value;
        const filtered = selected === "all"
          ? filteredData
          : filteredData.filter(item => item.location === selected);

        if (filtered.length === 0) {
          showLoading(false);
          alert("No data found for selected location.");
          return;
        }

        const locationsToExport = selected === "all"
          ? [...new Set(filtered.map(d => d.location))]
          : [selected];

        const headers = [
          "Description", "Permission Type", "Agency", "Applicable",
          "Registered", "License", "Validity", "Remarks", "Quantity"
        ];

        const blocks = [];

        for (const location of locationsToExport) {
          const records = filtered.filter(item => item.location === location);
          const rows = [headers];
          let applicable = 0, registered = 0;

          for (const item of records) {
            const app = (item.applicable || "No").toLowerCase() === "yes";
            const reg = (item.registered || "No").toLowerCase() === "yes";
            if (app) applicable++;
            if (reg) registered++;

            rows.push([
              item.description || "N/A",
              item.permission_type || "N/A",
              item.agency || "N/A",
              item.applicable || "No",
              item.registered || "No",
              item.license || item.registration_number || "N/A",
              item.validity ? new Date(item.validity) : "N/A",
              item.remarks || "N/A",
              item.quantity || "N/A"
            ]);
          }

          const percentage = applicable === 0 ? "0%" : ((registered / applicable) * 100).toFixed(1) + "%";
          rows.push([
            "Total Applicable", applicable,
            "Total Registered", registered,
            "% Registered", percentage,
            "", "", "", ""
          ]);

          blocks.push({ title: location, rows });
        }

        const finalSheet = [];

        // Build blocks one after another without spacing
        blocks.forEach((block) => {
          finalSheet.push([block.title, ...new Array(headers.length - 1).fill("")]);
          block.rows.forEach(row => finalSheet.push(row));
        });

        const ws = XLSX.utils.aoa_to_sheet(finalSheet);
        const range = XLSX.utils.decode_range(ws['!ref']);

        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            const cell = ws[cell_ref];
            if (!cell) continue;
            if (!cell.s) cell.s = {};

            // Add border
            cell.s.border = {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            };

            // Header styling
            if (R === 0 || (finalSheet[R - 1] && finalSheet[R - 1][0] === "Description")) {
              cell.s.fill = { fgColor: { rgb: "4472C4" } };
              cell.s.font = { bold: true, color: { rgb: "FFFFFF" } };
              cell.s.alignment = { horizontal: "center" };
            }

            // Summary row styling
            if (typeof cell.v === "string" && cell.v.includes("% Registered")) {
              cell.s.fill = { fgColor: { rgb: "D9D9D9" } };
              cell.s.font = { bold: true };
            }

            // Alternate row background
            else if (R % 2 === 0 && R !== 0) {
              cell.s.fill = { fgColor: { rgb: "F2F2F2" } };
            }

            // Format date
            if (cell.v instanceof Date) {
              cell.t = "d";
              cell.z = XLSX.SSF._table[14]; // 'm/d/yy'
            }
          }
        }

        ws["!cols"] = new Array(finalSheet[0].length).fill({ wch: 18 });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Work Details");
        XLSX.writeFile(wb, selected === "all" ? "Final_Styled_Export.xlsx" : `${selected}_Export.xlsx`);
        showLoading(false);
      } catch (err) {
        showLoading(false);
        alert("Error generating Excel file.");
      }
    }, 500); // 0.5s delay for UX
  });
});
