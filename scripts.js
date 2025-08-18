// Load cart from localStorage
function loadCart() {
  const cart = JSON.parse(localStorage.getItem('ztcCart')) || [];
  const tbody = document.querySelector('#cartTable tbody');
  tbody.innerHTML = '';

  cart.forEach((i, idx) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${i.course || ''}</td>
      <td>${i.term || ''}</td>
      <td>${i.section || ''}</td>
      <td>${i.instructor || ''}</td>
      <td>${i.units || ''}</td>
      <td>${i.days || ''}</td>
      <td>${i.time || ''}</td>
      <td>${i.location || ''}</td>
      <td><button onclick="removeFromCart(${idx})">Remove</button></td>
    `;
    tbody.appendChild(row);
  });
}

// Remove item from cart
function removeFromCart(index) {
  let cart = JSON.parse(localStorage.getItem('ztcCart')) || [];
  cart.splice(index, 1);
  localStorage.setItem('ztcCart', JSON.stringify(cart));
  loadCart();
}

// Save cart to file
function saveCart() {
  const cart = localStorage.getItem('ztcCart');
  const blob = new Blob([cart], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ztc_cart.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Print cart
function printCart() {
  window.print();
}

document.addEventListener('DOMContentLoaded', loadCart);
