/* =========================================================
   dashboard.js
   Populates the Dashboard page with mock (fictional) data.
   In a later stage, these mock arrays will be replaced with
   real data fetched from the backend API, which in turn will
   read from Oracle (structured data) and MongoDB
   (feedback/media/unstructured data).

   Everything here only touches the DOM - no database or
   network calls are made yet.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  loadSummaryStats();
  loadRecentTrips();
  loadFleetStatus();
  loadRecentBookings();
  loadRecentFeedback();
});

/* ---------------------------------------------------------
   Mock data
   Kept in one place so it is easy to find and replace with
   real API calls later.
   --------------------------------------------------------- */
const mockStats = {
  totalVehicles: 42,
  activeVehicles: 35,
  totalDrivers: 38,
  activeTrips: 12,
  todayBookings: 27,
  monthlyRevenue: 1450000 // in Rs.
};

const mockTrips = [
  { id: "TRP-1042", route: "Colombo - Kandy",   driver: "S. Perera",   vehicle: "WP-CAB-4521", status: "Ongoing" },
  { id: "TRP-1041", route: "Galle - Colombo",    driver: "R. Fernando", vehicle: "WP-CAA-8890", status: "Completed" },
  { id: "TRP-1040", route: "Negombo - Airport",  driver: "N. Silva",    vehicle: "WP-CAD-3312", status: "Ongoing" },
  { id: "TRP-1039", route: "Kurunegala - Kandy", driver: "T. Jayasuriya", vehicle: "WP-CAB-7765", status: "Delayed" },
  { id: "TRP-1038", route: "Colombo - Matara",   driver: "M. Wickramasinghe", vehicle: "WP-CAC-1129", status: "Completed" }
];

const mockFleet = [
  { name: "Available Vehicles", count: 20, status: "green" },
  { name: "On a Trip",          count: 15, status: "blue" },
  { name: "Under Maintenance",  count: 5,  status: "orange" },
  { name: "Out of Service",     count: 2,  status: "red" }
];

const mockBookings = [
  { id: "BKG-3301", passenger: "A. Gunawardena", route: "Colombo - Kandy",  date: "2026-09-24", amount: "Rs. 1,800", status: "Confirmed" },
  { id: "BKG-3300", passenger: "K. Dissanayake",  route: "Galle - Colombo", date: "2026-09-24", amount: "Rs. 2,200", status: "Pending" },
  { id: "BKG-3299", passenger: "P. Rathnayake",   route: "Negombo - Airport", date: "2026-09-23", amount: "Rs. 1,200", status: "Confirmed" },
  { id: "BKG-3298", passenger: "H. Bandara",      route: "Kurunegala - Kandy", date: "2026-09-23", amount: "Rs. 950",  status: "Cancelled" }
];

const mockFeedback = [
  { passenger: "A. Gunawardena", rating: 5, comment: "Driver was on time and very polite. Smooth trip!" },
  { passenger: "K. Dissanayake",  rating: 4, comment: "Comfortable vehicle, slight delay in pickup." },
  { passenger: "P. Rathnayake",   rating: 3, comment: "Booking process was a bit confusing on the app." }
];

/* ---------------------------------------------------------
   Render: Summary stat cards
   --------------------------------------------------------- */
function loadSummaryStats() {
  document.getElementById("statTotalVehicles").textContent = mockStats.totalVehicles;
  document.getElementById("statActiveVehicles").textContent = mockStats.activeVehicles;
  document.getElementById("statTotalDrivers").textContent = mockStats.totalDrivers;
  document.getElementById("statActiveTrips").textContent = mockStats.activeTrips;
  document.getElementById("statTodayBookings").textContent = mockStats.todayBookings;
  document.getElementById("statMonthlyRevenue").textContent = formatCurrency(mockStats.monthlyRevenue);
}

/* ---------------------------------------------------------
   Render: Recent Trips table
   --------------------------------------------------------- */
function loadRecentTrips() {
  const tableBody = document.getElementById("recentTripsBody");
  tableBody.innerHTML = "";

  mockTrips.forEach(function (trip) {
    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" + trip.id + "</td>" +
      "<td>" + trip.route + "</td>" +
      "<td>" + trip.driver + "</td>" +
      "<td>" + trip.vehicle + "</td>" +
      "<td>" + buildStatusBadge(trip.status) + "</td>";
    tableBody.appendChild(row);
  });
}

/* ---------------------------------------------------------
   Render: Fleet Status list
   --------------------------------------------------------- */
function loadFleetStatus() {
  const list = document.getElementById("fleetStatusList");
  list.innerHTML = "";

  mockFleet.forEach(function (item) {
    const row = document.createElement("div");
    row.className = "fleet-status-item";
    row.innerHTML =
      '<div>' +
        '<div class="fleet-name">' + item.name + '</div>' +
        '<div class="fleet-sub">' + item.count + ' vehicle(s)</div>' +
      '</div>' +
      buildStatusBadge(statusLabelFromColor(item.status));
    list.appendChild(row);
  });
}

/* ---------------------------------------------------------
   Render: Recent Bookings table
   --------------------------------------------------------- */
function loadRecentBookings() {
  const tableBody = document.getElementById("recentBookingsBody");
  tableBody.innerHTML = "";

  mockBookings.forEach(function (booking) {
    const row = document.createElement("tr");
    row.innerHTML =
      "<td>" + booking.id + "</td>" +
      "<td>" + booking.passenger + "</td>" +
      "<td>" + booking.route + "</td>" +
      "<td>" + booking.date + "</td>" +
      "<td>" + booking.amount + "</td>" +
      "<td>" + buildStatusBadge(booking.status) + "</td>";
    tableBody.appendChild(row);
  });
}

/* ---------------------------------------------------------
   Render: Recent Feedback list
   --------------------------------------------------------- */
function loadRecentFeedback() {
  const list = document.getElementById("feedbackList");
  list.innerHTML = "";

  mockFeedback.forEach(function (fb) {
    const item = document.createElement("div");
    item.className = "feedback-item";
    item.innerHTML =
      '<div class="feedback-top">' +
        '<span>' + fb.passenger + '</span>' +
        '<span class="feedback-rating">' + "★".repeat(fb.rating) + '</span>' +
      '</div>' +
      '<div class="feedback-text">' + fb.comment + '</div>';
    list.appendChild(item);
  });
}

/* ---------------------------------------------------------
   Helper functions (reused across the renderers above)
   --------------------------------------------------------- */

// Turns a status word into a colored badge <span>.
function buildStatusBadge(status) {
  const colorMap = {
    "Completed": "badge-green",
    "Confirmed": "badge-green",
    "Active": "badge-green",
    "Available": "badge-green",
    "Ongoing": "badge-blue",
    "On a Trip": "badge-blue",
    "Pending": "badge-orange",
    "Delayed": "badge-orange",
    "Under Maintenance": "badge-orange",
    "Cancelled": "badge-red",
    "Out of Service": "badge-red"
  };
  const badgeClass = colorMap[status] || "badge-blue";
  return '<span class="badge ' + badgeClass + '">' + status + '</span>';
}

// Maps the simple color keywords used in mockFleet to a
// readable status label for the badge.
function statusLabelFromColor(color) {
  const labels = {
    green: "Available",
    blue: "On a Trip",
    orange: "Under Maintenance",
    red: "Out of Service"
  };
  return labels[color] || color;
}

// Formats a plain number into a "Rs. 1,450,000" style string.
function formatCurrency(amount) {
  return "Rs. " + amount.toLocaleString("en-US");
}
