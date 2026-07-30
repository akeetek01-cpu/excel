(function (global, $) {
  // Default settings (can be overridden by passing options to initTotalRecovery)
  const DEFAULT = {
    url:
      `${window.SIMPRO_CONFIG.baseUrl}/companies/${window.SIMPRO_CONFIG.companyId}/catalogs/?search=any&pageSize=250&page=1&Group.ID=21`,
    // url:
    //   `${window.SIMPRO_CONFIG.baseUrl}/companies/6/storageDevices/37/stock/?search=any&pageSize=250&page=1&limit=100`,
    // url:
    //   `${window.SIMPRO_CONFIG.baseUrl}/companies/6/storageDeviceStock/?search=any&pageSize=250&page=1&limit=100`,
    method: "GET",
    timeout: 0,
    headers: {
      Accept: "application/json",
      Authorization:
        `Bearer ${window.SIMPRO_CONFIG.authToken}`,
    },
  };

  function buildOptions(items) {
    const placeholder = '<option value="">Select</option>';

    if (!Array.isArray(items) || items.length === 0) return placeholder;

    const sortedItems = [...items].sort((a, b) => {
      const nameA = ((a && a.Catalog && a.Catalog.Name) || a.Name || "").toString();
      const nameB = ((b && b.Catalog && b.Catalog.Name) || b.Name || "").toString();
      return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
    });

    const optionHtml = sortedItems
      .map((it) => {
        const name = ((it && it.Catalog && it.Catalog.Name) || it.Name || "").toString();
        const partNo = ((it && it.Catalog && it.Catalog.PartNo) || it.PartNo || "").toString();
        if (partNo && name) {
          return `<option value="${name} - ${partNo}">${name} - ${partNo}</option>`;
        } else if (name) {
          return `<option value="${name}">${name}</option>`;
        } else if (partNo) {
          return `<option value="${partNo}">${partNo}</option>`;
        }
        return "";
      })
      .join("");

    return placeholder + optionHtml;
  }

  function updateSelects(items) {
    const options = buildOptions(items);
    $(document)
      .find("select.totalRecovery-select")
      .each(function () {
        const $sel = $(this);
        // keep an initial empty option if the select is empty
        $sel.empty().append(options);
      });
  }

  function initTotalRecovery(opts) {
    const settings = Object.assign({}, DEFAULT, opts || {});
    // Allow caller to provide a preloaded list
    if (settings.preloaded && Array.isArray(settings.preloaded)) {
      global.totalRecoveryItems = settings.preloaded;
      updateSelects(global.totalRecoveryItems);
      $(document).trigger("totalRecovery:loaded");
      return Promise.resolve(global.totalRecoveryItems);
    }

    return new Promise(function (resolve, reject) {
      $.ajax(settings)
        .done(function (response) {
          // expected response is an array
          global.totalRecoveryItems = Array.isArray(response) ? response : [];
          updateSelects(global.totalRecoveryItems);
          $(document).trigger("totalRecovery:loaded");
          resolve(global.totalRecoveryItems);
        })
        .fail(function (err) {
          // fallback to empty array
          global.totalRecoveryItems = [];
          updateSelects(global.totalRecoveryItems);
          $(document).trigger("totalRecovery:error", err);
          reject(err);
        });
    });
  }

  // expose API
  global.initTotalRecovery = initTotalRecovery;
  global.getTotalRecoveryOptionsHtml = buildOptions;
  global.totalRecoveryItems = global.totalRecoveryItems || [];
  initTotalRecovery();
})(window, jQuery);
