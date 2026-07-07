$(function () {
  function loadTags() {
    const settings = {
      url: "https://excel.simprocloud.com/api/v1.0/companies/6/setup/tags/customers/?search=any&pageSize=100&page=1&orderby=Name&limit=100",
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
        const $select = $("#tagsSelect");
        const currentValue = $select.val();

        $select.find("option:not(:first)").remove();

        items.forEach(function (item) {
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

  //window.loadTags = loadTags;
  //loadTags();
});
