$(function() {
  // populate #serviceManagerSelect from cached user or /api/users

  function populateManagerSelect(managers, defaultVal) {
    const $sel = $("#serviceManagerSelect");
    const $salesTeam = $("#salesTeamId");
    if (!$sel.length && !$salesTeam.length) return;

    // set sales team if available on user
    if ($salesTeam.length && typeof defaultVal !== 'object') {
      // leave salesTeam population to caller if needed
    }

    // ensure element is a select; if not, just set text for display
    if (!$sel.is('select')) {
      // if defaultVal is a string name, show it
      if (defaultVal && typeof defaultVal === 'string') {
        $sel.text(defaultVal);
      }
      return;
    }

    $sel.empty();
    $sel.append(new Option('Select Manager', ''));

    managers.forEach(m => {
      $sel.append(new Option(m.name, String(m.id)));
    });

    if (defaultVal) {
      // try matching by ID first, then by name
      const byId = managers.find(x => String(x.id) === String(defaultVal));
      if (byId) {
        $sel.val(String(byId.id));
      } else {
        const byName = managers.find(x => x.name === defaultVal);
        if (byName) $sel.val(String(byName.id));
      }
    }
  }

  function loadManagers(defaultManagerIdOrName) {
    return $.ajax({
      url: '/api/users',
      method: 'GET',
      timeout: 0
    }).done(function(response) {
      const users = response && typeof response === 'object' ? Object.values(response) : [];
      const mgrMap = new Map();

      users.forEach(u => {
        if (!u) return;
        // prefer ManagerID/ManagerName pairs
        if (u.ManagerID != null && u.ManagerName) {
          mgrMap.set(String(u.ManagerID), u.ManagerName);
        }
        // also include users who are managers themselves (their role contains Manager)
        if (u.col3 && /manager/i.test(u.col3) && u.ID && u.Name) {
          mgrMap.set(String(u.ID), u.Name);
        }
      });

      // produce sorted array (by name)
      const managers = Array.from(mgrMap.entries()).map(([id, name]) => ({ id, name }));
      managers.sort((a, b) => a.name.localeCompare(b.name));

      populateManagerSelect(managers, defaultManagerIdOrName);
    }).fail(function() {
      populateManagerSelect([], defaultManagerIdOrName);
    });
  }

  // entry: use local user if present, otherwise load from API
  try {
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    if (user) {
      if (user.TeamName) {
        $('#salesTeamId').text(user.TeamName);
      }
      if (user.Name) {
        $('#createLeadLabel').text(user.Name);
      }
      

      if (user.ManagerName) {
        // set ManagerName as default display or select value
        const $sel = $('#serviceManagerSelect');
        if ($sel.length && $sel.is('select')) {
          // ensure option exists and select it
          if (!$sel.find(`option[value="${user.ManagerID || user.ManagerName}"]`).length) {
            $sel.prepend(new Option(user.ManagerName, user.ManagerID || user.ManagerName));
          }
          $sel.val(user.ManagerID || user.ManagerName);
        } else {
          $('#serviceManagerSelect').text(user.ManagerName);
        }
      } else {
        // Manager missing: load list and populate
        const defaultVal = user.ManagerID || user.ManagerName || null;
        loadManagers(defaultVal);
      }
    } else {
      // no user in localStorage: still attempt to load managers for the select
      loadManagers(null);
    }
  } catch (e) {
    loadManagers(null);
  }

  // expose for manual reloads / tests
  window.loadServiceManagers = loadManagers;
});
