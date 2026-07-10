(function (global, $) {
  // Default settings (can be overridden by passing options to initTotalRecovery)
  const DEFAULT = {
    url:
      "https://excel.simprocloud.com//api/v1.0/companies/6/storageDevices/37/stock/?search=any&pageSize=250&page=1&limit=100",
    method: "GET",
    timeout: 0,
    headers: {
      Accept: "application/json",
      Authorization:
        "Bearer c9c47eab18f514ad102ae8c78ce2a444e3bc4dab",
    },
  };

  function buildOptions(items) {
    if (!Array.isArray(items) || items.length === 0) return '<option value="">Select equipment</option>';
    return items
      .map((it) => {
        const name = (it && it.Catalog && it.Catalog.Name) || it.Name || "";
        const val = String(name || "");
        return `<option value="${val}">${val}</option>`;
      })
      .join("");
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
