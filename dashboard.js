document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(sessionStorage.getItem('user')) || { name: 'New Admin', role: 'admin' };
  document.getElementById('username').innerText = user.name;

  // 🔒 Hide admin-only features
  if (user.role !== 'admin') {
    const manageUsersLinkWrapper = document.getElementById('manageUsersLink');
    if (manageUsersLinkWrapper) manageUsersLinkWrapper.style.display = 'none';

    const manageUsersCard = document.getElementById('manageUsersCard');
    if (manageUsersCard) manageUsersCard.style.display = 'none';

    const showUsersBtn = document.getElementById('showUsersBtn');
    if (showUsersBtn) showUsersBtn.style.display = 'none';

    const showUsersLink = document.getElementById('showUsersLink');
    if (showUsersLink) showUsersLink.parentElement.style.display = 'none';
  }

  // 🔗 Navigation handlers
  document.getElementById('manageUsersLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'add-user.html';
  });

  document.getElementById('manageUsersCard')?.addEventListener('click', () => {
    window.location.href = 'add-user.html';
  });

  document.getElementById('showUsersBtn')?.addEventListener('click', () => {
    window.location.href = 'view-users.html';
  });

  document.getElementById('showUsersLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'view-users.html';
  });

  document.getElementById('addInitiativeCard')?.addEventListener('click', () => {
    window.location.href = 'work.html';
  });

  document.getElementById('addInitiativeSidebar')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'work.html';
  });

  document.getElementById('progressCard')?.addEventListener('click', () => {
    window.location.href = 'progress.html';
  });

  document.getElementById('progressOverviewLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'progress.html';
  });

  document.getElementById('logout').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  });

  // 🟡 Load Reminders from localStorage
  const container = document.getElementById('reminderCards');
  const today = new Date();
  const days30FromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');

  const filtered = reminders.filter(item => {
    const date = new Date(item.validity);
    return !item.disabled && date >= today && date <= days30FromNow;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p>No upcoming expiries within 30 days.</p>';
  } else {
    container.innerHTML = '';
    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'reminder-card';

      card.innerHTML = `
        <h4>${item.location} - ${item.description}</h4>
        <p><strong>Validity:</strong> ${item.validity}</p>
        <p><strong>Remarks:</strong> ${item.remarks || 'N/A'}</p>
        <div class="reminder-actions">
          <button class="ok-btn">OK</button>
          <button class="go-btn">Go to Form</button>
        </div>
      `;

      const okBtn = card.querySelector('.ok-btn');
      okBtn.addEventListener('click', () => {
        item.disabled = true;
        localStorage.setItem('reminders', JSON.stringify(reminders));
        okBtn.disabled = true;
        okBtn.innerText = '✔️ Done';
        card.style.opacity = '0.5';
      });

      const goBtn = card.querySelector('.go-btn');
    goBtn.addEventListener('click', () => {
  const validityOnly = item.validity.split('T')[0]; // get YYYY-MM-DD
  window.location.href = `progress.html?location=${encodeURIComponent(item.location)}&validity=${validityOnly}`;
});
 container.appendChild(card);
    });
  }
});
document.getElementById("manageWorkLocationCard").addEventListener("click", () => {
  window.location.href = "add-work-locations.html";
});
document.getElementById("manageWorkLocationLink").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "add-work-locations.html";
});
