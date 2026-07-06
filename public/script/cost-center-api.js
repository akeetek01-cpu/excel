$(function () {
  function loadCostCenters() {
    const settings = {
      url: "https://excel.simprocloud.com/api/v1.0/companies/6/setup/accounts/costCenters/?search=any&pageSize=50&page=1&limit=10",
      method: "GET",
      timeout: 0,
      headers: {
        Accept: "application/json",
        Authorization: "Bearer c9c47eab18f514ad102ae8c78ce2a444e3bc4dab"
      }
    };

    $.ajax(settings)
      .done(function (response) {
        const items = Array.isArray(response) ? response : response?.items || [];
        const $select = $("#costCenterSelect");
        const currentValue = $select.val();

        $select.find("option:not(:first)").remove();

        const sortedItems = [...items].sort(function (a, b) {
          const nameA = (a && a.Name) || "";
          const nameB = (b && b.Name) || "";
          const priorityA = /^(air conditioning service|refrigeration service)$/i.test(nameA.trim()) ? 0 : 1;
          const priorityB = /^(air conditioning service|refrigeration service)$/i.test(nameB.trim()) ? 0 : 1;

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
