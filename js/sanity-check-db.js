// ============================================
// SANITY CHECK — DATABASE MODULE
// ============================================
var SanityDB = (function() {
  var API_URL = ''; // Set during init
  var dbListings = [];
  var dbFlagged = [];

  function init(apiUrl) {
    API_URL = apiUrl;
    loadDatabases();
  }

  async function loadDatabases() {
    try {
      var res = await fetch(API_URL + '?action=listings');
      dbListings = await res.json();
    } catch(e) {
      console.log('Listings DB unavailable');
    }
    try {
      var res = await fetch(API_URL + '?action=flagged');
      dbFlagged = await res.json();
    } catch(e) {
      console.log('Flagged DB unavailable');
    }
  }

  function fuzzyMatch(a, b) {
    a = (a || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    b = (b || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    return false;
  }

  function checkName(name) {
    // Check flagged first
    for (var i = 0; i < dbFlagged.length; i++) {
      if (fuzzyMatch(dbFlagged[i].name, name)) {
        return { found: 'flagged', data: dbFlagged[i] };
      }
    }
    // Check listings
    for (var i = 0; i < dbListings.length; i++) {
      if (fuzzyMatch(dbListings[i].name, name)) {
        return { found: 'listed', data: dbListings[i] };
      }
    }
    return { found: 'none' };
  }

  async function submit(data) {
    try {
      var res = await fetch(API_URL + '?action=submit', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch(e) {
      return { success: false, error: e.toString() };
    }
  }

  // Public API
  return {
    init: init,
    checkName: checkName,
    submit: submit
  };
})();