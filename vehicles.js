/* =========================================================
   vehicles.js
   Handles everything on the Vehicles page: the mock vehicle
   data, rendering the summary cards and table, search/filter,
   and the Add/Edit Vehicle modal.

   Like dashboard.js, this only works with data kept in memory
   (the mockVehicles array). Nothing here talks to a database
   or API yet - that will replace this array later.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  setupVehicleModal();
  setupVehicleSearchAndFilters();
  setupVehicleForm();
  renderVehiclesPage();
});

/* ---------------------------------------------------------
   Mock data
   Each vehicle is a plain object. "id" is used as the unique
   key for editing/deleting a row.
   --------------------------------------------------------- */
let mockVehicles = [
  { id: "VEH-001", regNumber: "WP-CAB-4521", type: "Bus",  model: "Coaster",      manufacturer: "Toyota",  year: 2021, capacity: 26, fuelType: "Diesel",  status: "In Service",  driver: "S. Perera" },
  { id: "VEH-002", regNumber: "WP-CAA-8890", type: "Van",  model: "Hiace",        manufacturer: "Toyota",  year: 2020, capacity: 14, fuelType: "Diesel",  status: "Available",   driver: "" },
  { id: "VEH-003", regNumber: "WP-CAD-3312", type: "Car",  model: "Prius",        manufacturer: "Toyota",  year: 2022, capacity: 4,  fuelType: "Hybrid",  status: "In Service",  driver: "N. Silva" },
  { id: "VEH-004", regNumber: "WP-CAB-7765", type: "Bus",  model: "Civilian",     manufacturer: "Nissan",  year: 2019, capacity: 32, fuelType: "Diesel",  status: "Maintenance", driver: "" },
  { id: "VEH-005", regNumber: "WP-CAC-1129", type: "Van",  model: "Caravan",      manufacturer: "Nissan",  year: 2021, capacity: 12, fuelType: "Diesel",  status: "Available",   driver: "" },
  { id: "VEH-006", regNumber: "WP-CAE-5540", type: "Car",  model: "Axio",         manufacturer: "Toyota",  year: 2020, capacity: 4,  fuelType: "Petrol",  status: "In Service",  driver: "R. Fernando" },
  { id: "VEH-007", regNumber: "WP-CAF-9081", type: "Lorry", model: "Canter",      manufacturer: "Mitsubishi", year: 2018, capacity: 2, fuelType: "Diesel", status: "Maintenance", driver: "" },
  { id: "VEH-008", regNumber: "WP-CAG-2247", type: "Bus",  model: "Rosa",         manufacturer: "Mitsubishi", year: 2022, capacity: 28, fuelType: "Diesel", status: "Available",  driver: "" },
  { id: "VEH-009", regNumber: "WP-CAH-6634", type: "Van",  model: "Urvan",        manufacturer: "Nissan",  year: 2023, capacity: 15, fuelType: "Diesel",  status: "In Service",  driver: "T. Jayasuriya" },
  { id: "VEH-010", regNumber: "WP-CAI-8802", type: "Car",  model: "Aqua",         manufacturer: "Toyota",  year: 2021, capacity: 4,  fuelType: "Hybrid",  status: "Available",   driver: "" }
];

/* ---------------------------------------------------------
   Master render function
   Re-reads the current search/filter values, then redraws
   the table and the summary cards to match.
   --------------------------------------------------------- */
function renderVehiclesPage() {
  const visibleVehicles = getFilteredVehicles();
  renderVehicleTable(visibleVehicles);
  renderVehicleSummary();
}

/* ---------------------------------------------------------
   Summary cards - always based on the FULL vehicle list,
   not the filtered/search results.
   --------------------------------------------------------- */
function renderVehicleSummary() {
  const total = mockVehicles.length;
  const available = mockVehicles.filter(function (v) { return v.status === "Available"; }).length;
  const inService = mockVehicles.filter(function (v) { return v.status === "In Service"; }).length;
  const maintenance = mockVehicles.filter(function (v) { return v.status === "Maintenance"; }).length;

  document.getElementById("vehTotalCount").textContent = total;
  document.getElementById("vehAvailableCount").textContent = available;
  document.getElementById("vehInServiceCount").textContent = inService;
  document.getElementById("vehMaintenanceCount").textContent = maintenance;
}

/* ---------------------------------------------------------
   Table rendering
   --------------------------------------------------------- */
function renderVehicleTable(vehicles) {
  const tableBody = document.getElementById("vehicleTableBody");
  const emptyState = document.getElementById("vehicleEmptyState");
  tableBody.innerHTML = "";

  if (vehicles.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  vehicles.forEach(function (vehicle) {
    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" + vehicle.id + "</td>" +
      "<td>" + vehicle.regNumber + "</td>" +
      "<td>" + vehicle.type + "</td>" +
      "<td>" + vehicle.model + "</td>" +
      "<td>" + vehicle.capacity + "</td>" +
      "<td>" + vehicle.fuelType + "</td>" +
      "<td>" + buildVehicleStatusBadge(vehicle.status) + "</td>" +
      "<td>" + (vehicle.driver || "-") + "</td>" +
      "<td>" +
        '<button class="action-btn view-btn" data-id="' + vehicle.id + '" title="View">👁</button>' +
        '<button class="action-btn edit-btn" data-id="' + vehicle.id + '" title="Edit">✏️</button>' +
        '<button class="action-btn delete-btn" data-id="' + vehicle.id + '" title="Delete">🗑️</button>' +
      "</td>";
    tableBody.appendChild(row);
  });

  // Action buttons are re-created every render, so their click
  // handlers are attached here, after the HTML above exists.
  attachVehicleRowActions();
}

// Turns a status word into a colored badge <span>, matching the
// badge classes already defined in style.css.
function buildVehicleStatusBadge(status) {
  const colorMap = {
    "Available": "badge-green",
    "In Service": "badge-blue",
    "Maintenance": "badge-orange"
  };
  const badgeClass = colorMap[status] || "badge-blue";
  return '<span class="badge ' + badgeClass + '">' + status + '</span>';
}

/* ---------------------------------------------------------
   Row action buttons: View / Edit / Delete
   --------------------------------------------------------- */
function attachVehicleRowActions() {
  document.querySelectorAll(".view-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      viewVehicle(btn.getAttribute("data-id"));
    });
  });

  document.querySelectorAll(".edit-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openEditVehicleModal(btn.getAttribute("data-id"));
    });
  });

  document.querySelectorAll(".delete-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      deleteVehicle(btn.getAttribute("data-id"));
    });
  });
}

function findVehicleById(id) {
  return mockVehicles.find(function (v) { return v.id === id; });
}

// Simple read-only view. A dedicated details page/modal can
// replace this alert later.
function viewVehicle(id) {
  const vehicle = findVehicleById(id);
  if (!vehicle) return;

  alert(
    "Vehicle Details\n\n" +
    "ID: " + vehicle.id + "\n" +
    "Registration: " + vehicle.regNumber + "\n" +
    "Type: " + vehicle.type + "\n" +
    "Model: " + vehicle.model + " (" + vehicle.manufacturer + ", " + vehicle.year + ")\n" +
    "Capacity: " + vehicle.capacity + " seats\n" +
    "Fuel Type: " + vehicle.fuelType + "\n" +
    "Status: " + vehicle.status + "\n" +
    "Assigned Driver: " + (vehicle.driver || "Not assigned")
  );
}

function deleteVehicle(id) {
  const vehicle = findVehicleById(id);
  if (!vehicle) return;

  const confirmed = confirm("Delete vehicle " + vehicle.id + " (" + vehicle.regNumber + ")? This cannot be undone.");
  if (!confirmed) return;

  mockVehicles = mockVehicles.filter(function (v) { return v.id !== id; });
  renderVehiclesPage();
}

/* ---------------------------------------------------------
   Search box + Type/Status filters
   All three conditions are combined with AND: a vehicle must
   match the search text AND the selected type AND the
   selected status to be shown.
   --------------------------------------------------------- */
function setupVehicleSearchAndFilters() {
  document.getElementById("vehicleSearchInput").addEventListener("input", renderVehiclesPage);
  document.getElementById("vehicleTypeFilter").addEventListener("change", renderVehiclesPage);
  document.getElementById("vehicleStatusFilter").addEventListener("change", renderVehiclesPage);
}

function getFilteredVehicles() {
  const searchText = document.getElementById("vehicleSearchInput").value.trim().toLowerCase();
  const typeFilter = document.getElementById("vehicleTypeFilter").value;
  const statusFilter = document.getElementById("vehicleStatusFilter").value;

  return mockVehicles.filter(function (vehicle) {
    const matchesSearch =
      searchText === "" ||
      vehicle.id.toLowerCase().includes(searchText) ||
      vehicle.regNumber.toLowerCase().includes(searchText) ||
      vehicle.model.toLowerCase().includes(searchText);

    const matchesType = typeFilter === "" || vehicle.type === typeFilter;
    const matchesStatus = statusFilter === "" || vehicle.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });
}

/* ---------------------------------------------------------
   Add / Edit Vehicle modal
   The same modal and form are reused for both adding a new
   vehicle and editing an existing one. The hidden
   "vehicleEditingId" field tracks which mode we are in:
   empty = adding, filled = editing that vehicle's id.
   --------------------------------------------------------- */
function setupVehicleModal() {
  const overlay = document.getElementById("vehicleModalOverlay");

  document.getElementById("openAddVehicleBtn").addEventListener("click", openAddVehicleModal);
  document.getElementById("closeVehicleModalBtn").addEventListener("click", closeVehicleModal);
  document.getElementById("cancelVehicleModalBtn").addEventListener("click", closeVehicleModal);

  // Clicking the dark area outside the modal box also closes it.
  overlay.addEventListener("click", function (event) {
    if (event.target === overlay) {
      closeVehicleModal();
    }
  });
}

function openAddVehicleModal() {
  document.getElementById("vehicleModalTitle").textContent = "Add Vehicle";
  document.getElementById("vehicleForm").reset();
  document.getElementById("vehicleEditingId").value = ""; // empty = "add" mode

  // Suggest the next Vehicle ID automatically (e.g. VEH-011).
  document.getElementById("fieldVehicleId").value = generateNextVehicleId();

  document.getElementById("vehicleModalOverlay").classList.add("show");
}

function openEditVehicleModal(id) {
  const vehicle = findVehicleById(id);
  if (!vehicle) return;

  document.getElementById("vehicleModalTitle").textContent = "Edit Vehicle";
  document.getElementById("vehicleEditingId").value = vehicle.id; // filled = "edit" mode

  // Fill the form with the vehicle's current details.
  document.getElementById("fieldVehicleId").value = vehicle.id;
  document.getElementById("fieldRegNumber").value = vehicle.regNumber;
  document.getElementById("fieldVehicleType").value = vehicle.type;
  document.getElementById("fieldModel").value = vehicle.model;
  document.getElementById("fieldManufacturer").value = vehicle.manufacturer;
  document.getElementById("fieldYear").value = vehicle.year;
  document.getElementById("fieldCapacity").value = vehicle.capacity;
  document.getElementById("fieldFuelType").value = vehicle.fuelType;
  document.getElementById("fieldStatus").value = vehicle.status;
  document.getElementById("fieldAssignedDriver").value = vehicle.driver;

  document.getElementById("vehicleModalOverlay").classList.add("show");
}

function closeVehicleModal() {
  document.getElementById("vehicleModalOverlay").classList.remove("show");
}

// Looks at the highest existing "VEH-xxx" number and suggests
// the next one, e.g. VEH-010 -> VEH-011.
function generateNextVehicleId() {
  let highestNumber = 0;
  mockVehicles.forEach(function (vehicle) {
    const numberPart = parseInt(vehicle.id.replace("VEH-", ""), 10);
    if (!isNaN(numberPart) && numberPart > highestNumber) {
      highestNumber = numberPart;
    }
  });
  const nextNumber = highestNumber + 1;
  return "VEH-" + String(nextNumber).padStart(3, "0");
}

/* ---------------------------------------------------------
   Form submit: add a new vehicle OR save changes to an
   existing one, depending on "vehicleEditingId".
   --------------------------------------------------------- */
function setupVehicleForm() {
  document.getElementById("vehicleForm").addEventListener("submit", function (event) {
    event.preventDefault(); // stop the page from reloading

    const editingId = document.getElementById("vehicleEditingId").value;

    const vehicleData = {
      id: document.getElementById("fieldVehicleId").value.trim(),
      regNumber: document.getElementById("fieldRegNumber").value.trim(),
      type: document.getElementById("fieldVehicleType").value,
      model: document.getElementById("fieldModel").value.trim(),
      manufacturer: document.getElementById("fieldManufacturer").value.trim(),
      year: parseInt(document.getElementById("fieldYear").value, 10),
      capacity: parseInt(document.getElementById("fieldCapacity").value, 10),
      fuelType: document.getElementById("fieldFuelType").value,
      status: document.getElementById("fieldStatus").value,
      driver: document.getElementById("fieldAssignedDriver").value.trim()
    };

    if (editingId === "") {
      // Add mode: make sure the Vehicle ID is not already used.
      if (findVehicleById(vehicleData.id)) {
        alert("A vehicle with ID " + vehicleData.id + " already exists. Please use a different ID.");
        return;
      }
      mockVehicles.push(vehicleData);
    } else {
      // Edit mode: replace the existing vehicle's data in place.
      const index = mockVehicles.findIndex(function (v) { return v.id === editingId; });
      if (index !== -1) {
        mockVehicles[index] = vehicleData;
      }
    }

    closeVehicleModal();
    renderVehiclesPage();
  });
}
