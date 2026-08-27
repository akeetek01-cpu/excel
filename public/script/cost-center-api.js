$(function () {
  function loadCostCenters() {
    const settings = {
      url: `${window.SIMPRO_CONFIG.baseUrl}/companies/${window.SIMPRO_CONFIG.companyId}/setup/accounts/costCenters/?search=any&pageSize=50&page=1&limit=10`,
      method: "GET",
      timeout: 0,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${window.SIMPRO_CONFIG.authToken}`
      }
    };

    $.ajax(settings)
      .done(function (response) {
        const items = Array.isArray(response) ? response : response?.items || [];
        const $select = $("#costCenterSelect");
        const currentValue = $select.val();

        $select.find("option:not(:first)").remove();

        const filteredItems = [...items].filter(function (item) {
          const name = String(item?.Name || "").trim();
          return /air conditioning service/i.test(name) || /Refrigeration Service/i.test(name);
        });

        const sortedItems = filteredItems.sort(function (a, b) {
          const nameA = String(a?.Name || "").trim();
          const nameB = String(b?.Name || "").trim();
          const priorityA = /air conditioning service/i.test(nameA) ? 0 : 1;
          const priorityB = /air conditioning service/i.test(nameB) ? 0 : 1;

          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          return nameA.localeCompare(nameB);
        });

        sortedItems.forEach(function (item) {
          const id = item && item.ID;
          const name = item && item.Name;
          if (!name) return;

          const optionValue = id != null ? String(id) : name;
          $select.append(new Option(name, optionValue));
        });

        if (currentValue && $select.find(`option[value="${currentValue}"]`).length) {
          $select.val(currentValue);
        }
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        console.error("Failed to load cost centers:", textStatus, errorThrown);
      });
  }

  window.loadCostCenters = loadCostCenters;
  loadCostCenters();
});
