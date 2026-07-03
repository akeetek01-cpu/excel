$(function() {
    const apiUrl = "https://excel.simprocloud.com//api/v1.0/companies/6/customerAssets/?search=any&pageSize=150&page=1&orderby=Name&limit=10";
    const assetDescriptionSelect = $("#assetDescriptionSelect");
    const assetLocationSelect = $("#assetLocation");
    const assetDescriptionInput = $("#assetDescriptionInput");
    const assetLocationInput = $("#assetLocationInput");

    let assetResponse = [];
    let assetDescriptions = [];
    let assetLocationsByType = {};

    function mapResponse(data) {
        const descriptions = new Map();
        const locations = {};

        data.forEach(item => {
            if (!item || !item.AssetType || !item.Site) {
                return;
            }

            const typeId = item.AssetType.ID;
            const typeName = item.AssetType.Name;
            const siteId = item.Site.ID;
            const siteName = item.Site.Name;

            if (!descriptions.has(typeId)) {
                descriptions.set(typeId, {
                    id: typeId,
                    name: typeName
                });
            }

            if (!locations[typeId]) {
                locations[typeId] = new Map();
            }
            if (!locations[typeId].has(siteId)) {
                locations[typeId].set(siteId, {
                    id: siteId,
                    name: siteName
                });
            }
        });

        assetDescriptions = Array.from(descriptions.values());
        assetLocationsByType = Object.fromEntries(
            Object.entries(locations).map(([typeId, siteMap]) => [typeId, Array.from(siteMap.values())])
        );
    }

    function renderAssetDescriptions() {
        assetDescriptionSelect.find("option:gt(0)").remove();
        assetDescriptionSelect.append(
            `<option value="other">Other (enter below)</option>`
        );
        assetDescriptions.forEach(entry => {
            assetDescriptionSelect.append(
                `<option value="${entry.id}">${entry.name}</option>`
            );
        });
    }

    function renderAssetLocations(typeId) {
        assetLocationSelect.find("option:gt(0)").remove();
        assetLocationSelect.append(
            `<option value="other">Other (enter below)</option>`
        );
        if (!typeId || !assetLocationsByType[typeId]) {
            return;
        }

        assetLocationsByType[typeId].forEach(site => {
            assetLocationSelect.append(
                `<option value="${site.id}">${site.name}</option>`
            );
        });
    }

    function setOtherMode(selectElem, inputElem) {
        const selectedValue = selectElem.val();
        if (selectedValue === "other") {
            inputElem.removeClass("d-none");
        } else {
            inputElem.addClass("d-none");
        }
    }

    assetDescriptionSelect.on("change", function() {
        const selectedTypeId = $(this).val();
        renderAssetLocations(selectedTypeId);
        setOtherMode($(this), assetDescriptionInput);
        setOtherMode(assetLocationSelect, assetLocationInput);
        assetLocationSelect.val("");
    });

    assetLocationSelect.on("change", function() {
        setOtherMode($(this), assetLocationInput);
    });

    function fetchAssetData() {
        $.ajax({
            url: apiUrl,
            method: "GET",
            timeout: 0,
            headers: {
                Accept: "application/json",
                Authorization: "Bearer c9c47eab18f514ad102ae8c78ce2a444e3bc4dab"
            }
        }).done(function(response) {
            assetResponse = Array.isArray(response) ? response : response.items || [];
            mapResponse(assetResponse);
            renderAssetDescriptions();
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Failed to load asset data:", textStatus, errorThrown);
        });
    }

    fetchAssetData();
});
