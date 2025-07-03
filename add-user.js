document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(sessionStorage.getItem('user'));
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  let formData = {};

  document.getElementById('addUserForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const department = document.getElementById('department').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      alert('❌ Passwords do not match!');
      return;
    }

    formData = { name, email, phone, department, password };

    const reviewList = document.getElementById('reviewList');
    reviewList.innerHTML = `
      <li><strong>Name:</strong> ${name}</li>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Phone:</strong> ${phone}</li>
      <li><strong>Department:</strong> ${department}</li>
    `;

    document.getElementById('addUserForm').style.display = 'none';
    document.getElementById('reviewSection').style.display = 'block';
  });
document.getElementById('confirmAddUser').addEventListener('click', async () => {
  const res = await fetch('https://dra-backend.vercel.app/add-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });

  const data = await res.json();
  const msg = document.getElementById('statusMessage');

  if (data.success) {
    msg.style.color = 'green';
    msg.innerText = '✅ User added successfully!';

    // 🔥 Save to localStorage for view-users.html to pick up
    const newUser = {
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      department: formData.department
    };

    let storedUsers = JSON.parse(localStorage.getItem("userList")) || [];
    storedUsers.push(newUser);
    localStorage.setItem("userList", JSON.stringify(storedUsers));

    // ✅ Redirect to view-users.html
    setTimeout(() => {
      window.location.href = 'view-users.html';
    }, 1000);
  } else {
    msg.style.color = 'red';
    msg.innerText = '❌ Error: ' + data.message;
  }
function goToDashboard() {
  window.location.href = 'dashboard.html';
}

  // Optional: reset and hide review
  document.getElementById('addUserForm').reset();
  document.getElementById('addUserForm').style.display = 'block';
  document.getElementById('reviewSection').style.display = 'none';
});
});
