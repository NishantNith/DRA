document.addEventListener('DOMContentLoaded', () => {
  const locationInput = document.getElementById('locationInput');
  const addBtn = document.getElementById('addLocationBtn');
  const list = document.getElementById('locationList');
  const submitBtn = document.getElementById('submitBtn');
  const backBtn = document.getElementById('backBtn');

  let locations = JSON.parse(localStorage.getItem('dynamicLocations') || '[]');

  function renderList() {
    list.innerHTML = '';
    locations.forEach((loc, index) => {
      const li = document.createElement('li');
      li.textContent = loc;
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => {
        locations.splice(index, 1);
        localStorage.setItem('dynamicLocations', JSON.stringify(locations));
        renderList();
      });
      li.appendChild(delBtn);
      list.appendChild(li);
    });
  }

  addBtn.addEventListener('click', () => {
    const name = locationInput.value.trim();
    if (name && !locations.includes(name)) {
      locations.push(name);
      localStorage.setItem('dynamicLocations', JSON.stringify(locations));
      renderList();
      locationInput.value = '';
    }
  });

  submitBtn.addEventListener('click', () => {
    window.location.href = 'work.html';
  });

  backBtn.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });

  renderList();
});
