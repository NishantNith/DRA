document.addEventListener('DOMContentLoaded', () => {
  const boxes = document.querySelectorAll('.location-box');
  const searchInput = document.getElementById('searchInput');
  const form = document.getElementById('lehForm'); // only exists on leh.html
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const locationToEdit = params.get("location");

  // 🔍 Search filter
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.toLowerCase();
      boxes.forEach(box => {
        const name = box.getAttribute('data-name').toLowerCase();
        box.style.display = name.includes(term) ? 'block' : 'none';
      });
    });
  }

  // 📦 Click a location box → go to leh.html
  boxes.forEach(box => {
    box.addEventListener('click', () => {
      const location = box.getAttribute('data-name');
      window.location.href = `leh.html?location=${encodeURIComponent(location)}`;
    });
  });

  // ✏️ Form edit mode (on leh.html)
  if (form && mode === "edit" && locationToEdit) {
    fetch(`http://localhost:3000/leh-data/location/${encodeURIComponent(locationToEdit)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const entry = data[0];
          form.elements.location.value = entry.location;
          form.elements.description.value = entry.description;
          form.elements.permission_type.value = entry.permission_type;
          form.elements.agency.value = entry.agency;
          form.elements.applicable.value = entry.applicable;
          form.elements.registered.value = entry.registered;
          form.elements.registration_number.value = entry.registration_number;
          form.elements.validity.value = entry.validity;
          form.elements.remarks.value = entry.remarks;

          form.elements.location.readOnly = true;
        }
      })
      .catch(err => {
        console.error("Error loading edit data:", err);
        alert("Could not load location data.");
      });
  }

  // 📨 Form submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        user_id: localStorage.getItem('user_id') || 1,
        location: form.location.value,
        description: form.description.value,
        permission_type: form.permission_type.value,
        agency: form.agency.value,
        applicable: form.applicable.value,
        registered: form.registered.value,
        registration_number: form.registration_number.value,
        validity: form.validity.value,
        remarks: form.remarks.value
      };

      let url = "http://localhost:3000/leh-data";
      let method = "POST";

      if (mode === "edit" && locationToEdit) {
        url = `http://localhost:3000/leh-data/location/${encodeURIComponent(locationToEdit)}`;
        method = "PUT";
      }

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const result = await res.json();
        if (result.success) {
          alert("✅ Data saved successfully!");
          window.location.href = "progress.html";
        } else {
          alert("❌ Save failed: " + result.message);
        }
      } catch (err) {
        console.error("Submit error:", err);
        alert("Error submitting data.");
      }
    });
  }
});
function renderDynamicLocations() {
  const grid = document.getElementById('locationGrid');
  grid.innerHTML = ''; // Clear previous boxes

  const baseLocations = [
    "LEH-Airport", "DND - PKG 1", "DND - PKG 2", "BMC", "ASSAM ROAD PROJECT",
    "AGARTALA ROAD PROJECT", "GUJARAT BULLET TRAIN", "RLDA-AHMD",
    "GLOBAL CITY", "CMRL-CHENNAI", "KHAMMAM ROAD PROJECT", "MP JAL NIGAM",
    "THANE DEPOT MUMBAI", "PRAYAGRAJ RLY STN", "PANIPAT TOLL PROJECT-HR",
    "PATHANGI TOLL PROJECT-TG", "NATHAVASLA TOLL PROJECT-AP", "NTPC PROJECT",
    "NHPC PROJECT", "OFC-H PROJECT", "MERTA-DRPL", "MAURITIUS NSLD"
  ];

  // Add base locations
  baseLocations.forEach(loc => {
    const box = document.createElement('div');
    box.className = 'location-box';
    box.dataset.name = loc;
    box.innerHTML = `<h2>${loc}</h2>`;
    box.addEventListener('click', () => {
      window.location.href = `leh.html?location=${encodeURIComponent(loc)}`;
    });
    grid.appendChild(box);
  });

  // Add dynamic locations from localStorage
  const dynamicLocations = JSON.parse(localStorage.getItem('dynamicLocations') || '[]');
  dynamicLocations.forEach(loc => {
    const box = document.createElement('div');
    box.className = 'location-box';
    box.dataset.name = loc;
    box.innerHTML = `<h2>${loc}</h2>`;
    box.addEventListener('click', () => {
      window.location.href = `leh.html?location=${encodeURIComponent(loc)}`;
    });
    grid.appendChild(box);
  });
}

// 🔁 Initial render
renderDynamicLocations();

// 🔄 Sync when localStorage updates (like from add-work-location)
window.addEventListener('storage', (event) => {
  if (event.key === 'dynamicLocations') {
    renderDynamicLocations();
  }
});
