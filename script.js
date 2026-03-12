/**
 * StockFlow — Inventory Management System
 * script.js
 */

// ============================================================
// Data layer
// ============================================================

const STORAGE_KEY = 'stockflow_products';

const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'Monitor Dell UltraSharp 27',
    sku: 'ELEC-0027',
    category: 'Electrónicos',
    stock: 12,
    minStock: 5,
    price: 489.0,
    supplier: 'Dell LATAM',
    notes: 'Panel IPS, resolución 4K. Ubicación: estante B-12.',
  },
  {
    id: 2,
    name: 'Laptop HP EliteBook 840 G9',
    sku: 'ELEC-0840',
    category: 'Electrónicos',
    stock: 3,
    minStock: 4,
    price: 1249.0,
    supplier: 'HP Business',
    notes: 'i7, 16 GB RAM, SSD 512 GB.',
  },
  {
    id: 3,
    name: 'Teclado Logitech MX Keys',
    sku: 'PERI-0041',
    category: 'Periféricos',
    stock: 8,
    minStock: 3,
    price: 119.0,
    supplier: 'Logitech',
    notes: 'Distribución en español. Retroiluminado.',
  },
  {
    id: 4,
    name: 'Mouse Logitech MX Master 3S',
    sku: 'PERI-0042',
    category: 'Periféricos',
    stock: 0,
    minStock: 3,
    price: 99.0,
    supplier: 'Logitech',
    notes: 'Pendiente de reposición.',
  },
  {
    id: 5,
    name: 'Silla ergonómica Aeron',
    sku: 'MOBI-0015',
    category: 'Mobiliario',
    stock: 5,
    minStock: 2,
    price: 1475.0,
    supplier: 'Herman Miller',
    notes: 'Color grafito. Área administrativa.',
  },
  {
    id: 6,
    name: 'Impresora HP LaserJet Pro M428',
    sku: 'PERI-0210',
    category: 'Periféricos',
    stock: 2,
    minStock: 2,
    price: 299.0,
    supplier: 'HP Business',
    notes: 'Multifunción A4. Oficina principal.',
  },
  {
    id: 7,
    name: 'Tóner HP Negro CF258A',
    sku: 'CONS-0058',
    category: 'Consumibles',
    stock: 6,
    minStock: 8,
    price: 64.5,
    supplier: 'Staples Business',
    notes: 'Compatible con impresoras HP LaserJet.',
  },
  {
    id: 8,
    name: 'Cable HDMI 2.0 2m',
    sku: 'ACCE-0112',
    category: 'Accesorios',
    stock: 24,
    minStock: 5,
    price: 18.9,
    supplier: 'Belkin',
    notes: 'Compatible con 4K 60Hz.',
  },
  {
    id: 9,
    name: 'Papel A4 80g Navigator',
    sku: 'OFIC-0301',
    category: 'Oficina',
    stock: 48,
    minStock: 10,
    price: 6.2,
    supplier: 'Navigator',
    notes: 'Unidad por resma de 500 hojas.',
  },
  {
    id: 10,
    name: 'Hub USB-C 7 en 1',
    sku: 'ACCE-0215',
    category: 'Accesorios',
    stock: 4,
    minStock: 5,
    price: 54.99,
    supplier: 'Anker',
    notes: 'Con HDMI, USB-A, SD y carga PD.',
  },
  {
    id: 11,
    name: 'Webcam Logitech C920',
    sku: 'PERI-0095',
    category: 'Periféricos',
    stock: 0,
    minStock: 2,
    price: 89.0,
    supplier: 'Logitech',
    notes: 'Full HD 1080p.',
  },
  {
    id: 12,
    name: 'SSD Samsung 970 EVO 1TB',
    sku: 'ELEC-0970',
    category: 'Electrónicos',
    stock: 9,
    minStock: 4,
    price: 109.0,
    supplier: 'Samsung',
    notes: 'NVMe PCIe.',
  },
];

function loadProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [...INITIAL_PRODUCTS];

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [...INITIAL_PRODUCTS];
  } catch {
    return [...INITIAL_PRODUCTS];
  }
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function generateId(products) {
  return products.length > 0 ? Math.max(...products.map(product => product.id)) + 1 : 1;
}

// ============================================================
// State
// ============================================================

let products = loadProducts();
let currentView = 'dashboard';
let pendingDeleteId = null;
let editingProductId = null;
let searchQuery = '';
let categoryFilter = '';
let statusFilter = '';

// ============================================================
// Status helpers
// ============================================================

function getStatus(product) {
  if (product.stock === 0) return 'out-of-stock';
  if (product.stock <= product.minStock) return 'low-stock';
  return 'in-stock';
}

function statusLabel(status) {
  const labels = {
    'in-stock': 'En stock',
    'low-stock': 'Stock bajo',
    'out-of-stock': 'Sin stock',
  };

  return labels[status] || status;
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);
}

function formatInventoryValue(total) {
  if (total >= 1000) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(total);
  }

  return formatPrice(total);
}

// ============================================================
// DOM helpers
// ============================================================

const $ = id => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function statusBadge(status) {
  return `<span class="status-badge status-badge--${status}">${statusLabel(status)}</span>`;
}

function actionButtons(productId) {
  return `
    <div class="td-actions">
      <button class="btn-icon btn-edit" type="button" data-id="${productId}" title="Editar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="btn-icon btn-icon--danger btn-delete" type="button" data-id="${productId}" title="Eliminar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/>
          <path d="M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    </div>
  `;
}

// ============================================================
// Navigation
// ============================================================

function switchView(view) {
  currentView = view;

  document.querySelectorAll('.view').forEach(element => {
    element.classList.remove('active');
  });

  document.querySelectorAll('.nav-link[data-view]').forEach(element => {
    element.classList.remove('active');
  });

  const viewElement = $(`view-${view}`);
  if (viewElement) {
    viewElement.classList.add('active');
  }

  const navLink = document.querySelector(`.nav-link[data-view="${view}"]`);
  if (navLink) {
    navLink.classList.add('active');
  }

  const titles = {
    dashboard: ['Dashboard', 'Resumen general del inventario'],
    products: ['Productos', 'Gestión del inventario y control de stock'],
  };

  const [title, subtitle] = titles[view] || ['', ''];
  $('page-title').textContent = title;
  $('page-subtitle').textContent = subtitle;

  refreshCurrentView();
}

// ============================================================
// Dashboard
// ============================================================

function renderDashboard() {
  const totalProducts = products.length;
  const lowOrOutProducts = products.filter(product => getStatus(product) !== 'in-stock');
  const inventoryValue = products.reduce((acc, product) => acc + product.stock * product.price, 0);
  const categoriesCount = new Set(products.map(product => product.category)).size;

  $('metric-total').textContent = totalProducts;
  $('metric-low').textContent = lowOrOutProducts.length;
  $('metric-value').textContent = formatInventoryValue(inventoryValue);
  $('metric-categories').textContent = categoriesCount;

  const alertChip = $('alert-chip');
  const alertChipText = $('alert-chip-text');

  if (lowOrOutProducts.length > 0) {
    alertChip.classList.remove('hidden');
    alertChipText.textContent = `${lowOrOutProducts.length} producto${lowOrOutProducts.length > 1 ? 's' : ''} requiere${lowOrOutProducts.length > 1 ? 'n' : ''} atención`;
  } else {
    alertChip.classList.add('hidden');
    alertChipText.textContent = '';
  }

  const lowStockSection = $('low-stock-section');
  const alertList = $('alert-list');

  if (lowOrOutProducts.length > 0) {
    lowStockSection.classList.remove('hidden');

    alertList.innerHTML = lowOrOutProducts
      .slice(0, 5)
      .map(product => {
        const status = getStatus(product);
        const typeClass = status === 'out-of-stock' ? 'alert-item--out' : 'alert-item--low';
        const detail =
          status === 'out-of-stock'
            ? 'Sin existencias — reposición urgente'
            : `${product.stock} unidades disponibles (mín. ${product.minStock})`;

        return `
          <div class="alert-item ${typeClass}">
            <div class="alert-item-left">
              <span class="alert-item-name">${escapeHtml(product.name)}</span>
              <span class="alert-item-detail">${escapeHtml(product.sku)} · ${escapeHtml(detail)}</span>
            </div>
            ${statusBadge(status)}
          </div>
        `;
      })
      .join('');
  } else {
    lowStockSection.classList.add('hidden');
    alertList.innerHTML = '';
  }

  const recentProducts = [...products].slice(0, 6);
  const tbody = $('dashboard-table-body');

  tbody.innerHTML = recentProducts
    .map(product => {
      const status = getStatus(product);
      const rowClass =
        status === 'out-of-stock'
          ? 'row--out'
          : status === 'low-stock'
            ? 'row--low'
            : '';

      return `
        <tr class="${rowClass}">
          <td>
            <div class="td-product">
              <span class="td-product-name">${escapeHtml(product.name)}</span>
            </div>
          </td>
          <td><span class="td-sku">${escapeHtml(product.sku)}</span></td>
          <td>${escapeHtml(product.category)}</td>
          <td>${product.stock}</td>
          <td>${statusBadge(status)}</td>
          <td>${formatPrice(product.price)}</td>
        </tr>
      `;
    })
    .join('');
}

// ============================================================
// Products table
// ============================================================

function getFilteredProducts() {
  return products.filter(product => {
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      (product.supplier || '').toLowerCase().includes(query);

    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const matchesStatus = !statusFilter || getStatus(product) === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });
}

function populateCategoryFilter() {
  const categories = [...new Set(products.map(product => product.category))].sort();
  const select = $('category-filter');
  const selected = categoryFilter;

  select.innerHTML =
    '<option value="">Todas las categorías</option>' +
    categories
      .map(category => `<option value="${escapeHtml(category)}" ${category === selected ? 'selected' : ''}>${escapeHtml(category)}</option>`)
      .join('');
}

function renderProductsTable() {
  populateCategoryFilter();

  const filteredProducts = getFilteredProducts();
  const tbody = $('products-table-body');
  const emptyState = $('empty-state');
  const tableCount = $('table-count');

  if (filteredProducts.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');

    tbody.innerHTML = filteredProducts
      .map(product => {
        const status = getStatus(product);
        const rowClass =
          status === 'out-of-stock'
            ? 'row--out'
            : status === 'low-stock'
              ? 'row--low'
              : '';

        return `
          <tr class="${rowClass}">
            <td>
              <div class="td-product">
                <span class="td-product-name">${escapeHtml(product.name)}</span>
                ${product.notes ? `<span class="td-product-notes">${escapeHtml(product.notes)}</span>` : ''}
              </div>
            </td>
            <td><span class="td-sku">${escapeHtml(product.sku)}</span></td>
            <td>${escapeHtml(product.category)}</td>
            <td><strong>${product.stock}</strong></td>
            <td>${product.minStock}</td>
            <td>${statusBadge(status)}</td>
            <td>${formatPrice(product.price)}</td>
            <td>${product.supplier ? escapeHtml(product.supplier) : '<span style="color:var(--text-muted)">—</span>'}</td>
            <td>${actionButtons(product.id)}</td>
          </tr>
        `;
      })
      .join('');
  }

  tableCount.textContent =
    filteredProducts.length === products.length
      ? `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''}`
      : `${filteredProducts.length} de ${products.length} productos`;
}

// ============================================================
// Modal
// ============================================================

function openModal(product = null) {
  editingProductId = product ? product.id : null;

  $('modal-title').textContent = product ? 'Editar producto' : 'Nuevo producto';
  $('btn-save').textContent = product ? 'Guardar cambios' : 'Guardar producto';
  $('form-error').classList.add('hidden');

  const categories = [...new Set(products.map(item => item.category))].sort();
  $('category-list').innerHTML = categories
    .map(category => `<option value="${escapeHtml(category)}">`)
    .join('');

  $('form-id').value = product ? product.id : '';
  $('form-name').value = product ? product.name : '';
  $('form-sku').value = product ? product.sku : '';
  $('form-category').value = product ? product.category : '';
  $('form-stock').value = product ? product.stock : '';
  $('form-min-stock').value = product ? product.minStock : '';
  $('form-price').value = product ? product.price : '';
  $('form-supplier').value = product ? product.supplier || '' : '';
  $('form-notes').value = product ? product.notes || '' : '';

  document.querySelectorAll('.form-input.invalid').forEach(element => {
    element.classList.remove('invalid');
  });

  $('modal-backdrop').classList.remove('hidden');

  setTimeout(() => {
    $('form-name').focus();
  }, 80);
}

function closeModal() {
  $('modal-backdrop').classList.add('hidden');
  editingProductId = null;
}

function validateForm() {
  const requiredFields = [
    'form-name',
    'form-sku',
    'form-category',
    'form-stock',
    'form-min-stock',
    'form-price',
  ];

  let valid = true;

  requiredFields.forEach(id => {
    const field = $(id);
    field.classList.remove('invalid');

    if (!field.value.toString().trim()) {
      field.classList.add('invalid');
      valid = false;
    }
  });

  const stock = parseInt($('form-stock').value, 10);
  const minStock = parseInt($('form-min-stock').value, 10);
  const price = parseFloat($('form-price').value);

  if (Number.isNaN(stock) || stock < 0) {
    $('form-stock').classList.add('invalid');
    valid = false;
  }

  if (Number.isNaN(minStock) || minStock < 0) {
    $('form-min-stock').classList.add('invalid');
    valid = false;
  }

  if (Number.isNaN(price) || price < 0) {
    $('form-price').classList.add('invalid');
    valid = false;
  }

  return valid;
}

function saveProduct() {
  if (!validateForm()) {
    $('form-error').classList.remove('hidden');
    return;
  }

  $('form-error').classList.add('hidden');

  const productData = {
    name: $('form-name').value.trim(),
    sku: $('form-sku').value.trim(),
    category: $('form-category').value.trim(),
    stock: parseInt($('form-stock').value, 10),
    minStock: parseInt($('form-min-stock').value, 10),
    price: parseFloat($('form-price').value),
    supplier: $('form-supplier').value.trim(),
    notes: $('form-notes').value.trim(),
  };

  if (editingProductId !== null) {
    const index = products.findIndex(product => product.id === editingProductId);
    if (index !== -1) {
      products[index] = {
        ...products[index],
        ...productData,
      };
    }
  } else {
    products.unshift({
      id: generateId(products),
      ...productData,
    });
  }

  saveProducts(products);
  closeModal();
  refreshCurrentView();
}

// ============================================================
// Delete flow
// ============================================================

function openConfirmDelete(productId) {
  const product = products.find(item => item.id === productId);
  if (!product) return;

  pendingDeleteId = productId;
  $('confirm-product-name').textContent = product.name;
  $('confirm-backdrop').classList.remove('hidden');
}

function closeConfirmDelete() {
  $('confirm-backdrop').classList.add('hidden');
  pendingDeleteId = null;
}

function confirmDelete() {
  if (pendingDeleteId === null) return;

  products = products.filter(product => product.id !== pendingDeleteId);
  saveProducts(products);
  closeConfirmDelete();
  refreshCurrentView();
}

// ============================================================
// Refresh
// ============================================================

function refreshCurrentView() {
  renderDashboard();

  if (currentView === 'products') {
    renderProductsTable();
  }
}

// ============================================================
// Events
// ============================================================

function init() {
  document.addEventListener('click', event => {
    const navLink = event.target.closest('.nav-link[data-view]');
    if (navLink) {
      event.preventDefault();
      switchView(navLink.dataset.view);
      return;
    }

    const linkAction = event.target.closest('.link-action[data-view]');
    if (linkAction) {
      event.preventDefault();
      switchView(linkAction.dataset.view);
      return;
    }

    const editButton = event.target.closest('.btn-edit');
    if (editButton) {
      const product = products.find(item => item.id === parseInt(editButton.dataset.id, 10));
      if (product) openModal(product);
      return;
    }

    const deleteButton = event.target.closest('.btn-delete');
    if (deleteButton) {
      openConfirmDelete(parseInt(deleteButton.dataset.id, 10));
    }
  });

  $('btn-add-product').addEventListener('click', () => openModal());

  $('modal-close').addEventListener('click', closeModal);
  $('btn-cancel').addEventListener('click', closeModal);

  $('modal-backdrop').addEventListener('click', event => {
    if (event.target === $('modal-backdrop')) {
      closeModal();
    }
  });

  $('btn-save').addEventListener('click', saveProduct);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModal();
      closeConfirmDelete();
    }
  });

  $('btn-confirm-cancel').addEventListener('click', closeConfirmDelete);
  $('btn-confirm-delete').addEventListener('click', confirmDelete);

  $('confirm-backdrop').addEventListener('click', event => {
    if (event.target === $('confirm-backdrop')) {
      closeConfirmDelete();
    }
  });

  $('search-input').addEventListener('input', event => {
    searchQuery = event.target.value;
    renderProductsTable();
  });

  $('category-filter').addEventListener('change', event => {
    categoryFilter = event.target.value;
    renderProductsTable();
  });

  $('status-filter').addEventListener('change', event => {
    statusFilter = event.target.value;
    renderProductsTable();
  });

  switchView('dashboard');
}

document.addEventListener('DOMContentLoaded', init);