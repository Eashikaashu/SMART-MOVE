/* =========================================================
   app.js
   General application behaviour that applies to the whole
   dashboard shell: sidebar navigation, mobile sidebar toggle,
   search box, notifications button, and the live date/time
   line shown at the top of the page content.

   dashboard.js (loaded after this file) handles the data
   that is specific to the Dashboard page itself.
   ========================================================= */

// Run once the HTML has fully loaded
document.addEventListener("DOMContentLoaded", function () {
  setupSidebarNavigation();
  setupMobileSidebarToggle();
  setupSearchBox();
  setupNotifications();
  showCurrentDateTime();
});

/* ---------------------------------------------------------
   1. Sidebar navigation
   Clicking a sidebar link marks it as "active" and updates
   the page title in the top bar. Since this coursework
   version only builds the Dashboard page, the other links
   just update the title/text for now.
   --------------------------------------------------------- */
function setupSidebarNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const pageTitle = document.getElementById("pageTitle");

  navItems.forEach(function (item) {
    item.addEventListener("click", function (event) {
      event.preventDefault();

      const pageName = item.getAttribute("data-page");

      // Only pages that have actually been built have a matching
      // "page-<name>" section in the HTML (e.g. page-Dashboard,
      // page-Vehicles). Pages not built yet just show a notice
      // and the view does not change.
      const targetSection = document.getElementById("page-" + pageName);
      if (!targetSection) {
        alert(pageName + " page is not built yet in this coursework version.");
        return;
      }

      // Remove "active" class from every link, then add it
      // back only to the one that was clicked.
      navItems.forEach(function (link) {
        link.classList.remove("active");
      });
      item.classList.add("active");

      // Hide every page section, then show only the target one.
      document.querySelectorAll(".page-section").forEach(function (section) {
        section.classList.remove("active");
      });
      targetSection.classList.add("active");

      // Update the top bar title to match the clicked page.
      pageTitle.textContent = pageName;

      // Close the sidebar automatically on mobile after a click.
      closeMobileSidebar();
    });
  });
}

/* ---------------------------------------------------------
   2. Mobile sidebar toggle (hamburger button + overlay)
   --------------------------------------------------------- */
function setupMobileSidebarToggle() {
  const toggleBtn = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  toggleBtn.addEventListener("click", function () {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show");
  });

  // Clicking the dark overlay also closes the sidebar.
  overlay.addEventListener("click", closeMobileSidebar);
}

function closeMobileSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

/* ---------------------------------------------------------
   3. Search box
   For now this only reacts to the Enter key and shows a
   simple alert, since there is no backend/data source to
   search yet. This is a placeholder that can be replaced
   later once the API is connected.
   --------------------------------------------------------- */
function setupSearchBox() {
  const searchInput = document.getElementById("searchInput");

  searchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      const query = searchInput.value.trim();
      if (query.length > 0) {
        alert("Search requested for: " + query + "\n(Search will work once the backend is connected.)");
      }
    }
  });
}

/* ---------------------------------------------------------
   4. Notifications button
   Just a simple placeholder click handler for now.
   --------------------------------------------------------- */
function setupNotifications() {
  const notifBtn = document.getElementById("notifBtn");

  notifBtn.addEventListener("click", function () {
    alert("You have 3 new notifications.\n(This will later come from the backend.)");
  });
}

/* ---------------------------------------------------------
   5. Live date/time line
   Shows the current date and time above the stat cards,
   and updates every minute.
   --------------------------------------------------------- */
function showCurrentDateTime() {
  const dateTimeLine = document.getElementById("dateTimeLine");

  function updateDateTime() {
    const now = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    };
    dateTimeLine.textContent = now.toLocaleDateString("en-US", options);
  }

  updateDateTime();
  setInterval(updateDateTime, 60000); // refresh every minute
}
