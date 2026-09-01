$(function () {
  window.projectTagItems = Array.isArray(window.projectTagItems)
    ? window.projectTagItems
    : [];

  function loadTags() {
    const settings = {
      url: `${window.SIMPRO_CONFIG.baseUrl}/companies/${window.SIMPRO_CONFIG.companyId}/setup/tags/projects/?search=any&columns=ID,Name&pageSize=250&page=1&limit=100`,
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
        window.projectTagItems = items;
        const $select = $("#tagsSelect");
        const currentValue = $select.val();
        const environmentName = String(window.localStorage?.getItem("SIMPRO_ENV") || "").toUpperCase();
        const shouldFilterPriority = environmentName !== "UAT";

        $select.find("option:not(:first)").remove();

        const filteredItems = shouldFilterPriority
          ? items.filter(function (item) {
              const name = String(item?.Name || "").trim().toLowerCase();
              return name.includes("priority");
            })
          : items;

        const sortedItems = [...filteredItems].sort(function (a, b) {
          const nameA = (a && a.Name) || "";
          const nameB = (b && b.Name) || "";
          return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
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
        console.error("Failed to load tags:", textStatus, errorThrown);
      });
  }

  window.getStaffTagIds = function (staffNames) {
    const names = Array.isArray(staffNames) ? staffNames : [staffNames];
    const normalizedNames = names
      .map((name) => String(name || "").trim().toLowerCase())
      .filter(Boolean)
      .flatMap((name) =>
        name.startsWith("staff - ") ? [name] : [name, `staff - ${name}`],
      );

    return window.projectTagItems
      .filter((tag) => normalizedNames.includes(String(tag?.Name || "").trim().toLowerCase()))
      .map((tag) => Number(tag?.ID || tag?.Id || 0))
      .filter((id, index, ids) => id > 0 && ids.indexOf(id) === index);
  };

  window.loadTags = loadTags;
  loadTags();
});
