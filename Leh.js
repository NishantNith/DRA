document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  let currentLocation = params.get("location") || "";
  const isEdit = params.get("mode") === "edit";
  let editId = params.get("id"); // <-- make this mutable

  const user = JSON.parse(sessionStorage.getItem("user")) || {};
  const userId = user._id || user.id || null;

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
  const locationDisplay = document.getElementById("locationDisplay");

  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");
  const step4 = document.getElementById("step4");

  const stepIndicators = [
    document.getElementById("step1Indicator"),
    document.getElementById("step2Indicator"),
    document.getElementById("step3Indicator")
  ];

  if (!currentLocation && !isEdit) {
    alert("No location specified. Redirecting to Work Locations.");
    window.location.href = "work.html";
    return;
  }

  document.querySelector(".heading").textContent = isEdit ? `Edit Data` : `Add ${currentLocation} Data`;
  locationDisplay.value = currentLocation;

  // Minimum validity date = today
  validityInput.setAttribute('min', new Date().toISOString().split("T")[0]);

  const showStep = (step) => {
    [step1, step2, step3].forEach(el => el.classList.remove("active"));
    step4.style.display = "none";

    if (step === 1) step1.classList.add("active");
    if (step === 2) step2.classList.add("active");
    if (step === 3) step3.classList.add("active");
    if (step === 4) {
      step4.style.display = "block";
      document.getElementById("locationName").textContent = currentLocation;
    }

    stepIndicators.forEach((el, i) => el.classList.toggle("active", i === step - 1));
  };

  const defaultIfEmpty = (val) => val.trim() === "" ? "N/A" : val.trim();

  window.goToStep1 = () => showStep(1);

  window.goToStep2 = () => {
    const applicable = applicableSelect.value;

    if (applicable === "No") {
      registeredSelect.value = "No";
      licenseInput.value = "N/A";
      validityInput.value = "";
      remarksInput.value = "N/A";

      registeredSelect.disabled = true;
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
    if (!locationToSubmit) return alert("Location is missing.");

    const data = {
      user_id: userId,
      location: locationToSubmit,
      description: defaultIfEmpty(descriptionInput.value),
      permission_type: defaultIfEmpty(permissionTypeInput.value),
      agency: defaultIfEmpty(agencyInput.value),
      applicable: applicableSelect.value,
      registered: registeredSelect.value,
      registration_number: licenseInput.disabled ? "N/A" : defaultIfEmpty(licenseInput.value),
      remarks: remarksInput.disabled ? "N/A" : defaultIfEmpty(remarksInput.value),
      validity: (validityInput.disabled || !validityInput.value.trim()) ? null : validityInput.value.trim(),
      quantity: /^\d+$/.test(quantityInput.value.trim()) ? parseInt(quantityInput.value.trim()) : null
    };

    const endpoint = isEdit && editId
      ? `http://localhost:3000/leh-data/id/${editId}`
      : `http://localhost:3000/leh-data`;

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
          if (data.validity) {
            const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
            reminders.push({
              id: Date.now(),
              location: currentLocation,
              description: data.description,
              validity: data.validity,
              remarks: data.remarks,
              disabled: false
            });
            localStorage.setItem('reminders', JSON.stringify(reminders));
          }
        }
      } else {
        alert("Failed: " + (result.message || "Unknown error"));
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
    locationDisplay.value = currentLocation;
    showStep(1);
  };

  window.finishForm = () => window.location.href = "progress.html";

  // Load existing data in edit mode
  if (isEdit && editId) {
    fetch(`http://localhost:3000/leh-data/id/${editId}`)
      .then(res => res.json())
      .then(entry => {
        if (!entry) return;

        // Ensure editId is set to the real MongoDB _id (in case the URL param is not correct)
        if (entry._id) editId = entry._id;

        currentLocation = entry.location || "N/A";
        document.querySelector(".heading").textContent = `Edit ${currentLocation} Data`;
        locationDisplay.value = currentLocation;

        descriptionInput.value = entry.description || "";
        permissionTypeInput.value = entry.permission_type || "";
        agencyInput.value = entry.agency || "";
        applicableSelect.value = entry.applicable || "";
        registeredSelect.value = entry.registered || "";
        licenseInput.value = entry.registration_number || "";
        validityInput.value = entry.validity ? entry.validity.substring(0, 10) : "";
        remarksInput.value = entry.remarks || "";
        quantityInput.value = entry.quantity || "";

        if (entry.applicable === "No") {
          registeredSelect.disabled = true;
          licenseInput.disabled = true;
          validityInput.disabled = true;
          remarksInput.disabled = true;
        }
      })
      .catch(err => {
        console.error("❌ Error loading data:", err);
        alert("Failed to load data.");
      });
  }

  showStep(1);
});
