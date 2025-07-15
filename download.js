document.addEventListener("DOMContentLoaded", async () => {
  const select = document.getElementById("locationSelect");
  const downloadBtn = document.getElementById("downloadBtn");

  const loadingSpinner = document.createElement("div");
  loadingSpinner.id = "loadingSpinner";
  loadingSpinner.style = `
    display: none;
    position: fixed;
    top: 0; left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(255,255,255,0.7);
    z-index: 9999;
    justify-content: center;
    align-items: center;
  `;
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
  const showLoading = show => loadingSpinner.style.display = show ? "flex" : "none";

  const API_BASE = window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://dra-backend.onrender.com";

  let data = [];
  try {
    showLoading(true);
    const res = await fetch(`${API_BASE}/leh-data`);
    data = await res.json();
    showLoading(false);
  } catch {
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
          alert("No data found.");
          return;
        }

        const locationsToExport = selected === "all"
          ? [...new Set(filtered.map(d => d.location))]
          : [selected];

       const headers = [
  "Sl No.",
  "Description",
  "Type of Permission",
  "Agency",
  "Applicable (Yes/No)",
  "Registered (Yes/No)",
  "License/Registration/Documents nos.",
  "Valid upto",
  "Manpower Nos./ Quantity",
  "Remarks"
];

        let maxRows = 0;
        const blocks = [];

        for (const location of locationsToExport) {
          const records = filtered.filter(item => item.location === location);
          const rows = [headers];
          let applicable = 0, registered = 0;

          for (const item of records) {
            const app = (item.applicable || "").toLowerCase() === "yes";
            const reg = (item.registered || "").toLowerCase() === "yes";
            if (app) applicable++;
            if (reg) registered++;

            rows.push([
  rows.length,  // Sl No.
  item.description || "N/A",
  item.permission_type || "N/A",
  item.agency || "N/A",
  item.applicable || "No",
  item.registered || "No",
  item.license || item.registration_number || "N/A",
  item.validity ? new Date(item.validity) : "N/A",
  item.quantity || "N/A",
  item.remarks || "N/A"
]);

          }

          const percentage = applicable === 0 ? "0%" : ((registered / applicable) * 100).toFixed(1) + "%";

         rows.push([
  "", "", "", "",
  "Total Applicable", applicable,
  "Total Registered", registered,
  "% Registered", percentage,
  ""
]);

          maxRows = Math.max(maxRows, rows.length);
          blocks.push({ title: location, rows });
        }

        const finalSheet = [];
        for (let r = 0; r < maxRows + 1; r++) {
          const row = [];
          blocks.forEach((block, idx) => {
            if (r === 0) {
              row.push(block.title, ...new Array(headers.length - 1).fill(""));
            } else {
              const record = block.rows[r - 1];
              row.push(...(record || new Array(headers.length).fill("")));
            }
            if (idx !== blocks.length - 1) {
              // no empty column between blocks
            }
          });
          finalSheet.push(row);
        }

        const ws = XLSX.utils.aoa_to_sheet(finalSheet);
        const range = XLSX.utils.decode_range(ws['!ref']);

        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            const cell = ws[cell_ref];
            if (!cell) continue;
            if (!cell.s) cell.s = {};

            cell.s.border = {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            };

            if (R === 0) {
              cell.s.fill = { fgColor: { rgb: "4472C4" } };
              cell.s.font = { bold: true, color: { rgb: "FFFFFF" } };
              cell.s.alignment = { horizontal: "center" };
            }

            if (typeof cell.v === "string" && cell.v.includes("% Registered")) {
              cell.s.fill = { fgColor: { rgb: "D9D9D9" } };
              cell.s.font = { bold: true };
            } else if (R % 2 === 0 && R !== 0) {
              cell.s.fill = { fgColor: { rgb: "F2F2F2" } };
            }

            if (cell.v instanceof Date) {
              cell.t = "d";
              cell.z = XLSX.SSF._table[14];
            }
          }
        }

        ws["!cols"] = new Array(finalSheet[0].length).fill({ wch: 18 });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Work Details");
        XLSX.writeFile(wb, selected === "all" ? "Final_Horizontal_Export.xlsx" : `${selected}_Export.xlsx`);
        showLoading(false);
      } catch (err) {
        showLoading(false);
        alert("Error generating Excel file.");
      }
    }, 500);
  });
});
