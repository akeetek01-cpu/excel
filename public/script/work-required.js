(function (global, $) {
  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildOptions(items) {
    const placeholder = '<option value="">Select Work Required</option>';
    if (!Array.isArray(items) || items.length === 0) {
      return placeholder;
    }

    const sortedItems = [...items].sort((a, b) => {
      const nameA = String(a && a.name ? a.name : "").trim().toLowerCase();
      const nameB = String(b && b.name ? b.name : "").trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const optionHtml = sortedItems
      .map((item) => {
        const name = String(item && item.name ? item.name : "").trim();
        const safeName = escapeHtml(name);
        return `<option value="${safeName}">${safeName}</option>`;
      })
      .join("");

    return placeholder + optionHtml;
  }

  function populateWorkRequiredSelects(items) {
    const optionsHtml = buildOptions(items);
    $(document)
      .find("select.work-required-select")
      .each(function () {
        const $select = $(this);
        const currentValue = $select.val() || "";
        $select.html(optionsHtml);
        if (currentValue) {
          $select.val(currentValue);
        }
      });
  }

  function initWorkRequired(opts) {
    const options = Object.assign({}, opts || {});

    if (options.items && Array.isArray(options.items)) {
      populateWorkRequiredSelects(options.items);
      return Promise.resolve(options.items);
    }

    return $.ajax({
      url: options.url || "data/work_required.json",
      method: "GET",
      dataType: "json",
    })
      .done(function (response) {
        populateWorkRequiredSelects(Array.isArray(response) ? response : []);
      })
      .fail(function () {
        populateWorkRequiredSelects([]);
      });
  }

  global.initWorkRequired = initWorkRequired;
  global.populateWorkRequiredSelects = populateWorkRequiredSelects;

  $(function () {
    initWorkRequired();
  });
})(window, jQuery);
