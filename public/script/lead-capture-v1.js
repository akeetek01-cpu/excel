$(function() {
    const assetDescriptionSelect = $("#assetDescriptionSelect");
    const assetLocationSelect = $("#assetLocation");
    const assetDescriptionInput = $("#assetDescriptionInput");
    const assetLocationInput = $("#assetLocationInput");

    let assetResponse = [];
    let assetDescriptions = [];

    function mapResponse(data) {
        const descriptions = new Map();

        data.forEach(item => {
            if (!item || !item.AssetType) {
                return;
            }

            const typeId = item.AssetType.ID;
            const typeName = item.AssetType.Name;

            if (!descriptions.has(typeId)) {
                descriptions.set(typeId, {
                    id: typeId,
                    name: typeName
                });
            }
        });

        assetDescriptions = Array.from(descriptions.values()).sort((a, b) => {
            const nameA = (a && a.name) || "";
            const nameB = (b && b.name) || "";
            return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
        });
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

    function setOtherMode(selectElem, inputElem) {
        const selectedValue = selectElem.val();
        if (selectedValue === "other") {
            inputElem.removeClass("d-none");
        } else {
            inputElem.addClass("d-none");
        }
    }

    assetDescriptionSelect.on("change", function() {
        setOtherMode($(this), assetDescriptionInput);
    });

    assetLocationSelect.on("change", function() {
        setOtherMode($(this), assetLocationInput);
    });

    $("#customerTenancy").on("change", function() {
        const siteId = $(this).find("option:selected").attr("data-site-id");

        if (!siteId) {
            assetDescriptionSelect.find("option:gt(0)").remove();
            assetDescriptionSelect.append(`<option value="other">Other (enter below)</option>`);
            assetLocationSelect.val("");
            assetLocationInput.addClass("d-none");
            return;
        }

        fetchAssetData(siteId);
    });

    function fetchAssetData(siteId) {
        $.ajax({
            url: `https://excel.simprocloud.com//api/v1.0/companies/6/sites/${siteId}/assets/?search=any&pageSize=50&page=1&orderby=Name&limit=100`,
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

    // expose fetchAssetData globally so other page scripts can invoke it
    window.fetchAssetData = fetchAssetData;
});
