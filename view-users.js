const searchInput = document.getElementById("searchInput");
const userContainer = document.getElementById("userContainer");
const noUsersText = document.getElementById("noUsers");

let users = [];
let editingUserId = null;

// 🟢 Fetch users from backend
async function fetchUsers() {
  try {
    const res = await fetch("http://localhost:3000/users");
    const data = await res.json();
    users = data;
    renderUsers();
  } catch (err) {
    console.error("Error fetching users:", err);
    noUsersText.textContent = "Failed to load users.";
    noUsersText.style.display = "block";
  }
}

// 🟢 Render user cards
function renderUsers(filter = "") {
  userContainer.innerHTML = "";

  const filtered = users.filter(user =>
    user.name.toLowerCase().includes(filter.toLowerCase()) ||
    user.email.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    noUsersText.style.display = "block";
    return;
  }

  noUsersText.style.display = "none";

  filtered.forEach(user => {
    const card = document.createElement("div");
    card.className = "user-card";

    let buttonsHTML = `<button class="edit-btn" onclick="openEditModal(${user.id})">Edit</button>`;
    if (user.role !== 'admin') {
      buttonsHTML += `<button class="delete-btn" onclick="deleteUser(${user.id})">Delete</button>`;
    }

    card.innerHTML = `
      <h3>${user.name}</h3>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Phone:</strong> ${user.phone}</p>
      <p><strong>Department:</strong> ${user.department}</p>
      <div class="card-buttons">
        ${buttonsHTML}
      </div>
    `;

    userContainer.appendChild(card);
  });
}
function goToDashboard() {
  window.location.href = 'dashboard.html';
}


// 🔴 Delete user from database
async function deleteUser(id) {
  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    const res = await fetch(`http://localhost:3000/delete-user/${Number(id)}`, {
  method: "DELETE"
});

    const result = await res.json();

    if (result.success) {
      users = users.filter(user => user.id !== id);
      renderUsers(searchInput.value);
    } else {
      alert("Error: " + result.message);
    }
  } catch (err) {
    alert("Error deleting user.");
  }
}

// 🟢 Open modal with user data
function openEditModal(id) {
  const user = users.find(u => u.id === id);
  if (!user) return;

  editingUserId = id;

  document.getElementById("editName").value = user.name;
  document.getElementById("editEmail").value = user.email;
  document.getElementById("editPhone").value = user.phone;
  document.getElementById("editDepartment").value = user.department;

  document.getElementById("editModal").style.display = "flex";
}

// 🟡 Close modal
function closeModal() {
  editingUserId = null;
  document.getElementById("editModal").style.display = "none";
}

// 🟢 Save edited user to database
async function saveEdit() {
  const updatedUser = {
    name: document.getElementById("editName").value,
    email: document.getElementById("editEmail").value,
    phone: document.getElementById("editPhone").value,
    department: document.getElementById("editDepartment").value
  };

  try {
    const res = await fetch(`http://localhost:3000/edit-user/${editingUserId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedUser)
    });

    const result = await res.json();

    if (result.success) {
      closeModal();
      fetchUsers(); // Refresh users list
    } else {
      alert("Failed to update user.");
    }
  } catch (err) {
    alert("Error updating user.");
  }
}

// 🔍 Live search
searchInput.addEventListener("input", () => {
  renderUsers(searchInput.value);
});
// Close modal on outside click
window.addEventListener("click", (e) => {
  const modal = document.getElementById("editModal");
  if (e.target === modal) {
    closeModal();
  }
});


// 🚀 On page load
document.addEventListener("DOMContentLoaded", fetchUsers);
