$(function () {
  function getCustomFieldValue(asset, fieldNames) {
    const customFields = Array.isArray(asset?.CustomFields) ? asset.CustomFields : [];
    const normalizedFieldNames = fieldNames.map(function (fieldName) {
      return String(fieldName || "").trim().toLowerCase();
    });

    for (let i = 0; i < customFields.length; i += 1) {
      const field = customFields[i]?.CustomField || customFields[i] || {};
      const name = String(field?.Name || "").trim().toLowerCase();
      const value = String(customFields[i]?.Value || field?.Value || "").trim();

      if (normalizedFieldNames.indexOf(name) !== -1 && value) {
        return value;
      }
    }

    return "";
  }

  function getAssetLocationValue(asset) {
    //const fieldNames = ["location", "physical location (idu)", "physical location (odu)", "physical location"];
    const fieldNames = ["Location"];
    return getCustomFieldValue(asset, fieldNames);
  }

  function getAssetTypeName(asset) {
    return String(asset?.AssetType?.Name || "").trim();
  }

  function ensureAssetDescriptionOption(assetTypeName) {
    const $select = $("#assetDescriptionSelect");
    const normalizedName = String(assetTypeName || "").trim();

    if (!$select.length || !normalizedName) {
      return;
    }

    const matchingOption = $select.find("option").filter(function () {
      const optionValue = String($(this).val() || "").trim().toLowerCase();
      const optionText = String($(this).text() || "").trim().toLowerCase();
      const normalizedValue = normalizedName.toLowerCase();
      return optionValue === normalizedValue || optionText === normalizedValue;
    }).first();

    if (matchingOption.length) {
      $select.val(matchingOption.val()).trigger("change");
      return;
    }

    const newOption = new Option(normalizedName, normalizedName);
    $select.append(newOption);
    $select.val(normalizedName).trigger("change");
  }

  function applyAssetLookupResult(asset) {
    if (!asset) return;

    const assetTypeName = getAssetTypeName(asset);
    const assetLocation = getAssetLocationValue(asset);

    if (assetTypeName) {
      ensureAssetDescriptionOption(assetTypeName);
    }

    if (assetLocation) {
      $("#assetLocation").val(assetLocation);
    }
  }

  window.lookupAssetByValue = function (value) {
    const normalizedValue = String(value || "").trim();
    if (!normalizedValue) return;

    const settings = {
      url: `${window.SIMPRO_CONFIG.baseUrl}/companies/6/sites/536/assets/?search=any&columns=CustomFields,ID,AssetType&pageSize=100&page=1&orderby=Name&limit=100&CustomFields.Value=${encodeURIComponent(normalizedValue)}`,
      method: "GET",
      timeout: 0,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${window.SIMPRO_CONFIG.authToken}`,
      },
    };

    $.ajax(settings)
      .done(function (response) {
        const assets = Array.isArray(response) ? response : [];
        const matchingAsset = assets.find(function (asset) {
          const customFields = Array.isArray(asset?.CustomFields) ? asset.CustomFields : [];
          return customFields.some(function (item) {
            const field = item?.CustomField || item || {};
            const fieldName = String(field?.Name || "").trim().toLowerCase();
            const fieldValue = String(item?.Value || field?.Value || "").trim();
            return fieldName === "location" || fieldValue === normalizedValue;
          });
        });

        if (matchingAsset) {
          applyAssetLookupResult(matchingAsset);
        } else {
          const $select = $("#assetDescriptionSelect");
          if ($select.length) {
            $select.val("other").trigger("change");
          }
        }
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        console.error("Asset lookup failed:", textStatus, errorThrown);
      });
  };
});
