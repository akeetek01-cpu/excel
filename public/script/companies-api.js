$(function() {
    const assetDescriptionSelect = $("#assetDescriptionSelect");
    const assetDescriptionSelectWrapper = $("#assetDescriptionSelectWrapper");
    const assetLocationSelect = $("#assetLocation");
    const assetDescriptionInputWrapper = $("#assetDescriptionInputWrapper");
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
            `<option value="other">Other</option>`
        );
        assetDescriptions.forEach(entry => {
            assetDescriptionSelect.append(
                `<option value="${entry.id}">${entry.name}</option>`
            );
        });
    }

    function setOtherMode(selectElem, selectWrapperElem, inputWrapperElem) {
        // Keep layout widths unchanged (always full width). Only toggle visibility of the input wrapper.
        // This function accepts two calling styles in the codebase: some callers pass three args
        // (selectElem, selectWrapperElem, inputWrapperElem) while others pass two (selectElem, inputWrapperElem).
        // Handle both safely.
        const selectedValue = selectElem && typeof selectElem.val === 'function' ? selectElem.val() : null;

        // If only two args were provided, shift parameters so inputWrapperElem is the second arg
        if (inputWrapperElem === undefined && selectWrapperElem) {
            inputWrapperElem = selectWrapperElem;
            selectWrapperElem = null;
        }

        if (selectedValue === "other") {
            if (inputWrapperElem && typeof inputWrapperElem.removeClass === 'function') {
                inputWrapperElem.removeClass("d-none");
            }
        } else {
            if (inputWrapperElem && typeof inputWrapperElem.addClass === 'function') {
                inputWrapperElem.addClass("d-none");
            }
        }
    }

    assetDescriptionSelect.on("change", function() {
        setOtherMode($(this), assetDescriptionSelectWrapper, assetDescriptionInputWrapper);
    });

    assetLocationSelect.on("change", function() {
        setOtherMode($(this), assetLocationInput);
    });

    $("#customerTenancy").on("change", function() {
        const siteId = $(this).find("option:selected").attr("data-site-id");

        if (!siteId) {
            assetDescriptionSelect.find("option:gt(0)").remove();
            assetDescriptionSelect.append(`<option value="other">Other</option>`);
            assetLocationSelect.val("");
            assetLocationInput.addClass("d-none");
            return;
        }

        fetchAssetData(siteId);
    });

    function fetchAssetData(siteId) {
        $.ajax({
            url: `${window.SIMPRO_CONFIG.baseUrl}/companies/6/sites/${siteId}/assets/?search=any&pageSize=50&page=1&orderby=Name&limit=100`,
            method: "GET",
            timeout: 0,
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${window.SIMPRO_CONFIG.authToken}`
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
