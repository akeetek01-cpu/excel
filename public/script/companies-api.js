$(function() {
    const assetDescriptionSelect = $("#assetDescriptionSelect");
    const assetDescriptionSelectWrapper = $("#assetDescriptionSelectWrapper");
    const assetLocationSelect = $("#assetLocation");
    const assetDescriptionInputWrapper = $("#assetDescriptionInputWrapper");
    const assetDescriptionInput = $("#assetDescriptionInput");
    const assetLocationInput = $("#assetLocationInput");

    let assetResponse = [];
    let assetDescriptions = [];
    let assetDetailsByTypeId = new Map();
    let assetDetailsByTypeName = new Map();

    function normalizeFieldName(value) {
        return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
    }

    function getCustomFieldValue(asset, fieldNames) {
        const customFields = Array.isArray(asset?.CustomFields) ? asset.CustomFields : [];
        const normalizedFieldNames = fieldNames.map(function(fieldName) {
            return normalizeFieldName(fieldName);
        });

        for (let i = 0; i < customFields.length; i += 1) {
            const field = customFields[i]?.CustomField || customFields[i] || {};
            const fieldName = normalizeFieldName(field?.Name || customFields[i]?.Name || "");
            const value = String(customFields[i]?.Value || field?.Value || "").trim();

            if (normalizedFieldNames.indexOf(fieldName) !== -1 && value) {
                return value;
            }
        }

        return "";
    }

    function mapResponse(data) {
        const descriptions = new Map();
        const detailsByTypeId = new Map();
        const detailsByTypeName = new Map();

        data.forEach(item => {
            if (!item) {
                return;
            }

            const excelBarcode = getCustomFieldValue(item, ["EXCEL Barcode", "Excel Asset ID", "Excel Barcode", "Barcode"]);
            if (!excelBarcode) {
                return;
            }

            const typeId = String(item.ID || "");
            const typeName = String(item.AssetType.Name || "").trim();

            if (!descriptions.has(typeId)) {
                descriptions.set(typeId, {
                    id: typeId,
                    name: typeName
                });
            }

            if (typeId && !detailsByTypeId.has(typeId)) {
                detailsByTypeId.set(typeId, item);
            }

            if (typeName && !detailsByTypeName.has(normalizeFieldName(typeName))) {
                detailsByTypeName.set(normalizeFieldName(typeName), item);
            }
        });

        assetDescriptions = Array.from(descriptions.values()).sort((a, b) => {
            const nameA = (a && a.name) || "";
            const nameB = (b && b.name) || "";
            return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
        });
        assetDetailsByTypeId = detailsByTypeId;
        assetDetailsByTypeName = detailsByTypeName;
    }

    function populateAssetFields(asset) {
        if (!asset) {
            if(asset==null){
                $("#assertMake, #assertModel, #assertSerialNumber").val("");
            }else {
                 $("#customerAssetId, #assertMake, #assertModel, #assertSerialNumber").val("");
            }
            return;
        }

        const customerAssetNumber = getCustomFieldValue(asset, ["Customer Asset Number", "Cust. Asset No.", "Customer Asset No."]);
        const excelBarcode = getCustomFieldValue(asset, ["EXCEL Barcode", "Excel Asset ID", "Excel Barcode", "Barcode"]);
        const assetMake = getCustomFieldValue(asset, ["Make"]);
        const assetModel = getCustomFieldValue(asset, ["Model (IDU)", "Model"]);
        const assetSerialNumber = getCustomFieldValue(asset, ["Serial Number (IDU)", "Serial Number", "Serial #.", "Serial #"]);
        const assetLocation = getCustomFieldValue(asset, ["Location"]);

        $("#customerAssetId").val(excelBarcode || "");
        $("#assertMake").val(assetMake || "");
        $("#assertModel").val(assetModel || "");
        $("#assertSerialNumber").val(assetSerialNumber || "");
        $("#assetLocation").val(assetLocation || "");
    }

    function applySelectedAssetDetails() {
        const selectedValue = String(assetDescriptionSelect.val() || "").trim();

        if (!selectedValue || selectedValue === "other") {
            populateAssetFields(null);
            return;
        }

        const asset = assetDetailsByTypeId.get(selectedValue) || assetDetailsByTypeName.get(normalizeFieldName(selectedValue));
        populateAssetFields(asset || null);
    }

    function renderAssetDescriptions() {
        assetDescriptionSelect.find("option:gt(0)").remove();
        assetDescriptionSelect.append(
            `<option value="other">Other</option>`
        );
        assetDescriptions.forEach(entry => {
            const asset = assetDetailsByTypeId.get(String(entry.id)) || null;
            const excelBarcode = getCustomFieldValue(asset, ["EXCEL Barcode", "Excel Asset ID", "Excel Barcode", "Barcode"]);
            const label = excelBarcode ? `${excelBarcode} - ${entry.name}` : entry.name;
            assetDescriptionSelect.append(
                `<option value="${entry.id}">${label}</option>`
            );
        });
        applySelectedAssetDetails();
    }

    function setOtherMode(selectElem, selectWrapperElem, inputWrapperElem) {
        const selectedValue = selectElem.val();
        if (selectedValue === "other") {
            selectWrapperElem.removeClass("col-12").addClass("col-3");
            inputWrapperElem.removeClass("d-none").removeClass("col-12").addClass("col-9");
        } else {
            selectWrapperElem.removeClass("col-3").addClass("col-12");
            inputWrapperElem.addClass("d-none").removeClass("col-9").addClass("col-12");
        }
    }

    assetDescriptionSelect.on("change", function() {
        setOtherMode($(this), assetDescriptionSelectWrapper, assetDescriptionInputWrapper);
        applySelectedAssetDetails();
    });

    assetLocationSelect.on("change", function() {
        setOtherMode($(this), assetLocationInput);
    });

    $("#customerTenancy").on("change", function() {
        const siteId = $(this).find("option:selected").attr("data-site-id");

        $("#customerAssetId, #assertMake, #assertModel, #assertSerialNumber").val("");
        assetDescriptionSelect.find("option:gt(0)").remove();
        assetDescriptionSelect.append(`<option value="other">Other</option>`);
        assetDescriptionSelect.val("other").trigger("change");
        assetLocationSelect.val("");
        assetLocationInput.val("").addClass("d-none");
        $("#assetLocationInputError").text("");
        $("#assetDescriptionInput").val("").removeClass("is-invalid");
        $("#assetDescriptionInputError").text("");
        $("#assetLocationError").text("");

        if (!siteId) {
            return;
        }

        fetchAssetData(siteId);
    });

    function fetchAssetData(siteId) {
        $.ajax({
            url: `${window.SIMPRO_CONFIG.baseUrl}/companies/6/sites/${siteId}/assets/?search=any&columns=CustomFields,ID,AssetType&pageSize=250&page=1&orderby=Name&limit=100`,
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
