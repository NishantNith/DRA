document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  let currentLocation = params.get("location") || "";
const isEdit = params.get("mode") === "edit";
const editId = params.get("id");

  const user = JSON.parse(sessionStorage.getItem("user")) || {};
  const userId = user.id || 1;

  const descriptionInput = document.getElementById("description");
  const permissionTypeInput = document.getElementById("permissionType");
  const agencyInput = document.getElementById("agency");
  const quantityInput = document.getElementById("quantity");
  const applicableSelect = document.getElementById("applicable");
  const registeredSelect = document.getElementById("registered");
  const licenseInput = document.getElementById("license");
  const validityInput = document.getElementById("validity");
  const remarksInput = document.getElementById("remarks");
  const reviewData = document.getElementById("reviewData");

  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");
  const step4 = document.getElementById("step4");

  const stepIndicators = [
    document.getElementById("step1Indicator"),
    document.getElementById("step2Indicator"),
    document.getElementById("step3Indicator")
  ];

  document.querySelector(".heading").textContent = isEdit ? `Edit Data` : `Add ${currentLocation} Data`;

  const today = new Date().toISOString().split("T")[0];
  validityInput.setAttribute('min', today);

  function showStep(step) {
    step1.classList.remove("active");
    step2.classList.remove("active");
    step3.classList.remove("active");
    step4.style.display = "none";

    if (step === 1) step1.classList.add("active");
    if (step === 2) step2.classList.add("active");
    if (step === 3) step3.classList.add("active");
    if (step === 4) {
      step4.style.display = "block";
      document.getElementById("locationName").textContent = currentLocation;
    }

    stepIndicators.forEach((el, index) => {
      el.classList.toggle("active", index === step - 1);
    });
  }

  function defaultIfEmpty(val) {
    return val.trim() === "" ? "N/A" : val.trim();
  }

  window.goToStep1 = () => showStep(1);

  window.goToStep2 = () => {
    if (applicableSelect.value === "No") {
      registeredSelect.value = "No";
      registeredSelect.disabled = true;
      licenseInput.value = "N/A";
      validityInput.value = "";
      remarksInput.value = "N/A";
      licenseInput.disabled = true;
      validityInput.disabled = true;
      remarksInput.disabled = true;
      goToReview();
    } else {
      registeredSelect.disabled = false;
      licenseInput.disabled = false;
      validityInput.disabled = false;
      remarksInput.disabled = false;
      showStep(2);
    }
  };

  window.goToReview = () => {
    if (registeredSelect.value === "No") {
      licenseInput.value = "N/A";
      validityInput.value = "";
      remarksInput.value = "N/A";
      licenseInput.disabled = true;
      validityInput.disabled = true;
      remarksInput.disabled = true;
    }

    const validityVal = validityInput.value.trim();
    const validityDisplay = validityVal === "" ? "N/A" : validityVal;

    const data = {
      Description: defaultIfEmpty(descriptionInput.value),
      Permission_Type: defaultIfEmpty(permissionTypeInput.value),
      Agency: defaultIfEmpty(agencyInput.value),
      Applicable: applicableSelect.value,
      Registered: registeredSelect.value,
      License: defaultIfEmpty(licenseInput.value),
      Validity: validityDisplay,
      Remarks: defaultIfEmpty(remarksInput.value),
      Quantity: defaultIfEmpty(quantityInput.value),
      Location: currentLocation || "N/A"
    };

    reviewData.innerHTML = Object.entries(data)
      .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
      .join("");

    showStep(3);
  };

  window.submitLehData = () => {
    const locationToSubmit = currentLocation.trim();
    if (!locationToSubmit) {
      alert("Location is missing. Please go back and select location properly.");
      return;
    }

    // Explicitly assign N/A if fields are disabled
    const regNo = licenseInput.disabled ? "N/A" : defaultIfEmpty(licenseInput.value);
    const remarks = remarksInput.disabled ? "N/A" : defaultIfEmpty(remarksInput.value);
    const validity = (validityInput.disabled || validityInput.value.trim() === "" || validityInput.value.trim() === "N/A")
      ? null : validityInput.value.trim();

    const qtyRaw = defaultIfEmpty(quantityInput.value);
    const quantity = /^\d+$/.test(qtyRaw) ? parseInt(qtyRaw) : null;

    const data = {
      user_id: userId,
      location: locationToSubmit,
      description: defaultIfEmpty(descriptionInput.value),
      permission_type: defaultIfEmpty(permissionTypeInput.value),
      agency: defaultIfEmpty(agencyInput.value),
      applicable: applicableSelect.value,
      registered: registeredSelect.value,
      registration_number: regNo,
      validity,
      remarks,
      quantity
    };

    const endpoint = isEdit && editId
      ? `https://dra-backend.vercel.app/leh-data/id/${editId}`
      : `https://dra-backend.vercel.app/leh-data`;

    const method = isEdit ? "PUT" : "POST";

    fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        alert(isEdit ? "Data updated successfully!" : "Data submitted successfully!");
        if (isEdit) {
          window.location.href = "progress.html";
        } else {
          showStep(4);
          if (validity) {
            const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
            reminders.push({
              id: Date.now(),
              location: currentLocation,
              description: data.description,
              validity: validity,
              remarks: data.remarks,
              disabled: false
            });
            localStorage.setItem('reminders', JSON.stringify(reminders));
          }
        }
      } else {
        alert("Failed: " + result.message);
      }
    })
    .catch(err => {
      console.error("❌ Submission Error:", err);
      alert("Error submitting form");
    });
  };

  window.repeatForm = () => {
    ["description", "permissionType", "agency", "quantity", "license", "validity", "remarks"]
      .forEach(id => document.getElementById(id).value = "");
    applicableSelect.value = "";
    registeredSelect.value = "";
    registeredSelect.disabled = false;
    licenseInput.disabled = false;
    validityInput.disabled = false;
    remarksInput.disabled = false;
    showStep(1);
  };

  window.finishForm = () => window.location.href = "progress.html";

  // ✅ Load data in edit mode
if (isEdit && editId) {
  fetch(`https://dra-backend.vercel.app/leh-data/id/${editId}`)
    .then(res => res.json())
    .then(entry => {
  currentLocation = entry.location || "N/A"; // ✅ Fix: set correct location
  document.querySelector(".heading").textContent = `Edit ${currentLocation} Data`; // ✅ Fix heading
  descriptionInput.value = entry.description || "";
  permissionTypeInput.value = entry.permission_type || "";
  agencyInput.value = entry.agency || "";
  applicableSelect.value = entry.applicable || "";
  registeredSelect.value = entry.registered || "";
  licenseInput.value = entry.registration_number || "";
  validityInput.value = entry.validity ? entry.validity.substring(0, 10) : "";
  remarksInput.value = entry.remarks || "";
  quantityInput.value = entry.quantity || "";

  // ✅ Auto-disable fields if applicable is "No"
  if (entry.applicable === "No") {
    registeredSelect.disabled = true;
    licenseInput.disabled = true;
    validityInput.disabled = true;
    remarksInput.disabled = true;
  }
})

    .catch(err => {
      console.error("❌ Failed to load entry:", err);
    });
}

  showStep(1);
});
