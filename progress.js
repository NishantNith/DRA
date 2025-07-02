// ✅ Get base locations (hardcoded)
const baseLocations = [
  "LEH-Airport", "DND - PKG 1", "DND - PKG 2", "BMC", "ASSAM ROAD PROJECT",
  "AGARTALA ROAD PROJECT", "GUJARAT BULLET TRAIN", "RLDA-AHMD",
  "GLOBAL CITY", "CMRL-CHENNAI", "KHAMMAM ROAD PROJECT", "MP JAL NIGAM",
  "THANE DEPOT MUMBAI", "PRAYAGRAJ RLY STN", "PANIPAT TOLL PROJECT-HR",
  "PATHANGI TOLL PROJECT-TG", "NATHAVASLA TOLL PROJECT-AP", "NTPC PROJECT",
  "NHPC PROJECT", "OFC-H PROJECT", "MERTA-DRPL", "MAURITIUS NSLD"
];

// ✅ Load dynamic locations added from work page
const dynamicLocations = JSON.parse(localStorage.getItem("dynamicLocations") || "[]");


// ✅ Combine all
const allLocations = [...baseLocations];

// Avoid duplicate entries
dynamicLocations.forEach(loc => {
  if (!allLocations.includes(loc)) {
    allLocations.push(loc);
  }
});

const cardsContainer = document.getElementById("locationCards");
const searchBar = document.getElementById("searchBar");

// Load reminder validity from localStorage
const reminders = JSON.parse(localStorage.getItem("reminders") || "[]");

function getReminderValidity(locationName) {
  const match = reminders.find(r => r.location.trim().toLowerCase() === locationName.trim().toLowerCase());
  return match ? match.validity : null;
}

function renderCards(filter = "") {
  cardsContainer.innerHTML = "";
  allLocations
    .filter(loc => loc.toLowerCase().includes(filter.toLowerCase()))
    .forEach(location => {
      const card = document.createElement("div");
      card.className = "location-card";
      card.setAttribute("data-location", location);

      const validity = getReminderValidity(location);
      const reminderText = validity ? `<div class="reminder">📅 Validity: ${validity}</div>` : "";

      card.innerHTML = `
        <div class="card-header">${location}</div>
        ${reminderText}
      `;

      card.addEventListener("click", async () => {
        window.location.href = `detail.html?location=${encodeURIComponent(location)}`;
      });

      cardsContainer.appendChild(card);
    });
}

// 🔍 Search handler
searchBar.addEventListener("input", e => renderCards(e.target.value));

// 🟢 Initial render
document.addEventListener('DOMContentLoaded', () => {
  renderCards();

  const params = new URLSearchParams(window.location.search);
  const targetLocation = params.get('location');

  if (targetLocation) {
    const cards = document.querySelectorAll('.location-card');
    cards.forEach(card => {
      const loc = card.getAttribute('data-location')?.trim().toLowerCase();
      if (loc === targetLocation.trim().toLowerCase()) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('highlight');
      }
    });
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('locationGrid');

  function renderDynamicLocations() {
    const dynamicLocations = JSON.parse(localStorage.getItem('dynamicLocations') || '[]');

    // 🧹 Clear existing dynamic boxes
    const existingDynamicBoxes = grid.querySelectorAll('.location-box.dynamic');
    existingDynamicBoxes.forEach(box => box.remove());

    dynamicLocations.forEach(loc => {
      const box = document.createElement('div');
      box.className = 'location-box dynamic'; // Add 'dynamic' class to identify
      box.dataset.name = loc;
      box.innerHTML = `<h2>${loc}</h2>`;

      // 🧭 Redirect on click
      box.addEventListener('click', () => {
        window.location.href = `leh.html?location=${encodeURIComponent(loc)}`;
      });

      grid.appendChild(box);
    });
  }

  // 🟢 Initial render
  renderDynamicLocations();

  // 🔁 Optional: Listen for storage changes across tabs
  window.addEventListener('storage', (event) => {
    if (event.key === 'dynamicLocations') {
      renderDynamicLocations();
    }
  });
}); // ✅ This closes the DOMContentLoaded listener
