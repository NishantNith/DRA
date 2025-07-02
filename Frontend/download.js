document.addEventListener("DOMContentLoaded", async () => {
  const select = document.getElementById("locationSelect");
  const downloadBtn = document.getElementById("downloadBtn");

  const res = await fetch("http://localhost:3000/leh-data");
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

    const locationsToExport = selected === "all"
      ? [...new Set(filtered.map(d => d.location))]
      : [selected];

    const headers = [
      "Description", "Permission Type", "Agency", "Applicable",
      "Registered", "License", "Validity", "Remarks", "Quantity"
    ];

    let maxRows = 0;
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
          item.license || "N/A",
          item.validity ? new Date(item.validity) : "N/A",
          item.remarks || "N/A",
          item.quantity || "N/A"
        ]);
      }

      // Add 2 empty rows before summary
      rows.push(new Array(headers.length).fill(""));
      rows.push(new Array(headers.length).fill(""));

      const percentage = applicable === 0 ? "0%" : ((registered / applicable) * 100).toFixed(1) + "%";
      rows.push([
        "Total Applicable", applicable,
        "Total Registered", registered,
        "% Registered", percentage,
        "", "", ""
      ]);

      maxRows = Math.max(maxRows, rows.length);
      blocks.push({ title: location, rows });
    }

    // Build finalSheet with 2-column gap between blocks
    const finalSheet = [];
    for (let r = 0; r < maxRows + 1; r++) {
      const row = [];
      blocks.forEach((block, idx) => {
        if (r === 0) {
          row.push(block.title);
          for (let i = 0; i < headers.length - 1; i++) row.push("");
        } else {
          const record = block.rows[r - 1];
          if (record) row.push(...record);
          else row.push(...new Array(headers.length).fill(""));
        }

        // Leave 2 blank columns between blocks
        if (idx !== blocks.length - 1) {
          row.push("", "");
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

        // Add border
        cell.s.border = {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        };

        // Header styling
        if (R === 0) {
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

    // Set column widths
    ws["!cols"] = new Array(finalSheet[0].length).fill({ wch: 18 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Work Details");
    XLSX.writeFile(wb, selected === "all" ? "Final_Styled_Export.xlsx" : `${selected}_Export.xlsx`);
  });
});
