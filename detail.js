const pageTitle = document.getElementById("pageTitle");
const locationDetails = document.getElementById("locationDetails");

let barChart, percentagePieChart;

document.addEventListener('DOMContentLoaded', () => {
  loadData();
});

// Escape function to safely render HTML content
const escapeHtml = str => (str || '').toString().replace(/[&<>"']/g, tag => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[tag]));

async function loadData() {
  const params = new URLSearchParams(window.location.search);
  const location = params.get("location");

  if (!location) {
    pageTitle.textContent = "Invalid Location";
    locationDetails.innerHTML = "<p>No location specified in URL.</p>";
    return;
  }

  try {
    const res = await fetch(`https://dra-backend.vercel.app/leh-data/location/${encodeURIComponent(location)}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      pageTitle.textContent = location;
      locationDetails.innerHTML = `<p>No data found for ${escapeHtml(location)}</p>`;
      return;
    }

    pageTitle.textContent = `Details for ${escapeHtml(location)}`;
    locationDetails.innerHTML = data.map(entry => `
      <div class="entry">
        <p><strong>User ID:</strong> ${escapeHtml(entry.user_id)}</p>
        <p><strong>Location:</strong> ${escapeHtml(entry.location)}</p>
        <p><strong>Description:</strong> ${escapeHtml(entry.description)}</p>
        <p><strong>Permission Type:</strong> ${escapeHtml(entry.permission_type)}</p>
        <p><strong>Agency:</strong> ${escapeHtml(entry.agency)}</p>
        <p><strong>Applicable:</strong> ${escapeHtml(entry.applicable)}</p>
        <p><strong>Registered:</strong> ${escapeHtml(entry.registered)}</p>
        <p><strong>License:</strong> ${escapeHtml(entry.registration_number)}</p>
        <p><strong>Validity:</strong> ${escapeHtml(entry.validity || "N/A")}</p>
        <p><strong>Remarks:</strong> ${escapeHtml(entry.remarks || "N/A")}</p>
        <p><strong>Quantity:</strong> ${escapeHtml(entry.quantity?.toString() || "N/A")}</p>

        <div class="entry-actions">
          <button onclick="editEntry(${entry.id}, '${escapeHtml(entry.location)}')">✏️ Edit</button>
          <button onclick="deleteEntry(${entry.id})">🗑️ Delete</button>
        </div>
      </div>
    `).join('');

    renderSummaryAndChart(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    locationDetails.innerHTML = `<p>Error fetching data for this location.</p>`;
  }
}

function renderSummaryAndChart(data) {
  const applicableYes = data.filter(d => d.applicable === "Yes").length;
  const applicableNo = data.filter(d => d.applicable === "No").length;
  const registeredYes = data.filter(d => d.registered === "Yes").length;
  const registeredNo = data.filter(d => d.registered === "No").length;
  const totalQuantity = data.reduce((sum, d) => sum + (parseInt(d.quantity) || 0), 0);

  document.getElementById("appYesCount").textContent = applicableYes;
  document.getElementById("regYesCount").textContent = registeredYes;

  const quantitySpan = document.getElementById("totalQuantityCount");
  if (quantitySpan) {
    quantitySpan.textContent = totalQuantity;
  }

  const percentage = applicableYes > 0 ? Math.round((registeredYes / applicableYes) * 100) : 0;

  if (barChart) barChart.destroy();
  if (percentagePieChart) percentagePieChart.destroy();

  percentagePieChart = new Chart(document.getElementById("percentagePieChart"), {
    type: "pie",
    data: {
      labels: [`Registered (${percentage}%)`, `Not Registered`],
      datasets: [{
        data: [registeredYes, applicableYes - registeredYes],
        backgroundColor: ["#118ab2", "#ff6b6b"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: ["Applicable - Yes", "Applicable - No", "Registered - Yes", "Registered - No"],
      datasets: [{
        label: "Count",
        data: [applicableYes, applicableNo, registeredYes, registeredNo],
        backgroundColor: ["#06d6a0", "#ff6b6b", "#118ab2", "#ffd166"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          precision: 0
        }
      }
    }
  });
}

function editEntry(id, location) {
  const encodedLocation = encodeURIComponent(location);
  window.location.href = `leh.html?mode=edit&id=${id}&location=${encodedLocation}`;
}

async function deleteEntry(id) {
  if (!confirm("Are you sure you want to delete this entry?")) return;

  try {
    const res = await fetch(`https://dra-backend.vercel.app/leh-data/id/${id}`, {
      method: "DELETE"
    });

    const result = await res.json();

    if (result.success) {
      alert("✅ Deleted successfully");
      loadData();
    } else {
      alert("❌ Delete failed: " + (result.message || "Unknown error"));
    }
  } catch (error) {
    console.error("❌ Delete error:", error);
    alert("Error deleting data. Check console.");
  }
}
