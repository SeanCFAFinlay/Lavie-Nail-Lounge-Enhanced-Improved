/*
  La Vie Nail Lounge Enhanced Site Interactions

  This script powers the dynamic behaviour of the site. It includes
  functionality for filtering the gallery by category, opening and
  closing the embedded booking scheduler, and passing along the
  requested service to the booking widget. If you integrate a new
  booking provider later, update the `bookingBaseURL` variable and
  optionally append service-specific parameters as needed.
*/

document.addEventListener('DOMContentLoaded', function () {
  // Gallery filtering
  var filterButtons = document.querySelectorAll('.gallery-filters button');
  var galleryItems = document.querySelectorAll('.gallery-item');

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var category = btn.getAttribute('data-category');
      galleryItems.forEach(function (item) {
        var categories = item.getAttribute('data-categories').split(',');
        if (category === 'all' || categories.includes(category)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Booking modal interactions
  var modal = document.getElementById('scheduleModal');
  var iframe = document.getElementById('scheduleIframe');
  var closeBtn = document.querySelector('.modal-close');

  // Base URL for the scheduler. On this site we host our own booking page (schedule.html)
  // which allows guests to select a location, service and timeslot. If you later
  // integrate a third‑party scheduler, update this variable with the provider's
  // URL. When using the internal page, relative links work and avoid third party
  // cookies or blocked content.
  var bookingBaseURL = 'schedule.html';

  // Attach booking behaviour to any element with data-book or data-staff
  document.querySelectorAll('[data-book],[data-staff]').forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      var params = [];
      // When a data-staff attribute is present, preselect the technician on the schedule page
      var staff = trigger.getAttribute('data-staff');
      if (staff) {
        params.push('staff=' + encodeURIComponent(staff));
      }
      // data-book is used to denote a service or other context; ignore generic "general" value
      var service = trigger.getAttribute('data-book');
      if (service && service !== 'general' && !staff) {
        params.push('service=' + encodeURIComponent(service));
      }
      // For location-specific booking buttons (Fleetwood/Newton/Langley), you could pass a location
      // parameter here by adding a data-location attribute on the element and handling it similarly.
      var url = bookingBaseURL;
      if (params.length) {
        url += '?' + params.join('&');
      }
      iframe.src = url;
      modal.style.display = 'flex';
    });
  });

  closeBtn.addEventListener('click', function () {
    modal.style.display = 'none';
    iframe.src = '';
  });
});