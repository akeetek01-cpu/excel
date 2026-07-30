$(function () {
  function getJobData(jobNumber) {
    const settings = {
      url: `${window.SIMPRO_CONFIG.baseUrl}/companies/${window.SIMPRO_CONFIG.companyId}/jobs/${jobNumber}`,
      method: "GET",
      timeout: 0,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${window.SIMPRO_CONFIG.authToken}`
      }
    };

    return $.ajax(settings);
  }

  function getCompanySites(customerID) {
    const settings = {
      url: `${window.SIMPRO_CONFIG.baseUrl}/companies/${window.SIMPRO_CONFIG.companyId}/customers/companies/${customerID}`,
      method: "GET",
      timeout: 0,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${window.SIMPRO_CONFIG.authToken}`
      }
    };

    return $.ajax(settings);
  }

  function clearSiteSelection($select) {
    if (!$select || !$select.length) {
      return;
    }

    $select.empty().append(new Option("Select site", ""));
    $select.append(new Option("Other", "Other"));
    $select.val("");
  }

  function clearLookupDependentFields() {
    const $siteSelect = $("#customerTenancy");
    clearSiteSelection($siteSelect);

    $("#autoJobBtn").val("");
    $("#customerAssetIdSelectWrapper").removeClass("col-3-5")
    $("#customerName").val("").removeClass("is-invalid");
    $("#customerNameInput").val("").removeClass("is-invalid");
    $("#customerNameInputWrapper")
      .addClass("d-none")
      .removeClass("col-9")
      .addClass("col-12");
    $("#customerNameSelectWrapper")
      .removeClass("col-3")
      .addClass("col-12");
    $("#customerPhone").val("").removeClass("is-invalid");
    $("#customerEmail").val("").removeClass("is-invalid");
    $("#customerNameError, #customerNameInputError, #customerPhoneError, #customerEmailError").text("");

    const $customerAssetId = $("#customerAssetId");
    const $customerAssetIdInput = $("#customerAssetIdInput");
    const $customerAssetIdInputWrapper = $("#customerAssetIdInputWrapper");
    const $customerAssetIdSelectWrapper = $("#customerAssetIdSelectWrapper");
    const $customerAssetIdInputError = $("#customerAssetIdInputError");
    const $assetDescriptionInput = $("#assetDescriptionInput");

    $customerAssetId.find("option").prop("selected", false);
    const $placeholderOption = $customerAssetId.find('option[value=""]');
    if ($placeholderOption.length) {
      $placeholderOption.prop("selected", true);
    } else {
      $customerAssetId.val("");
    }
    $customerAssetIdInput.val("").removeClass("is-invalid");
    $customerAssetIdInputWrapper.addClass("d-none").removeClass("col-8-5 col-9").addClass("col-12");
    $customerAssetIdSelectWrapper.removeClass("d-none col-3-5 col-3").addClass("col-12");
    $customerAssetIdInputError.text("");

    $assetDescriptionInput
      .val("")
      .removeClass("border-dashed is-invalid")
      .prop("readonly", false);
    $("#assetDescriptionInputError").text("");
    $("#assertMake").val("").removeClass("is-invalid");
    $("#assertModel").val("").removeClass("is-invalid");
    $("#assertSerialNumber").val("").removeClass("is-invalid");
    $("#assetLocation").val("").removeClass("is-invalid");
    $("#assetLocationError, #assetLocationInputError").text("");
    $("#assetLocationInput").val("").addClass("d-none");

    $("#siteContractName").text("");
    window.leadCaptureLookup = {};
    window.pendingCustomerContactId = "";
    window.customerContactsById = {};
  }

  window.clearJobNumberDependentFields = function () {
    clearLookupDependentFields();
  };

  // populate sites and optionally select a default by ID or name
  function populateCustomerTenancySites(sites, defaultSiteId) {
    const $select = $("#customerTenancy");
    const currentValue = $select.val();

    $select.find("option").remove();

    if (Array.isArray(sites) && sites.length) {
      const sortedSites = [...sites]
        .filter((site) => site && site.Name)
        .sort((a, b) => (a.Name || "").localeCompare(b.Name || "", undefined, { sensitivity: "base" }));

      sortedSites.forEach((site) => {
        const optionValue = site.ID != null ? String(site.ID) : site.Name;
        const option = new Option(site.Name, optionValue);
        if (site.ID != null) {
          $(option).attr("data-site-id", site.ID);
        }
        $select.append(option);
      });
    }

    const otherOption = $select.find('option[value="Other"]');
    if (!otherOption.length) {
      $select.append(new Option("Other", "Other"));
    }

    if (!sites || !sites.length) {
      $select.empty().append(new Option("Select site", ""));
      $select.append(new Option("Other", "Other"));
      $select.val("");
      return;
    }

    // prefer current selection if it matches; otherwise try defaultSiteId (ID or name)
    // and leave the field unselected if none of those match.
    if (currentValue && $select.find(`option[value="${currentValue}"]`).length) {
      $select.val(currentValue);
    } else if (defaultSiteId != null && $select.find(`option[value="${defaultSiteId}"]`).length) {
      $select.val(String(defaultSiteId));
    } else {
      clearSiteSelection($select);
    }
  }

  const $customerTenancy = $("#customerTenancy");
  clearSiteSelection($customerTenancy);

  window.handleJobNumberCompleteApi = function (value) {
    if (!value) {
      clearLookupDependentFields();
      return;
    }

    clearLookupDependentFields();

    getJobData(value)
      .done(function (response) {
        const customerName = response?.Customer?.CompanyName || response?.CompanyName || response?.Customer?.Name || response?.Name || "";
        const customerId = response?.Customer?.ID || response?.CustomerID || response?.ID || "";
        const firstSite = response?.Site;
        const defaultSiteId = firstSite?.ID != null ? String(firstSite.ID) : firstSite?.Name;
        const customerContact = response?.CustomerContact || response?.Customer?.CustomerContact || null;
        const customerContactId = customerContact?.ID != null ? String(customerContact.ID) : "";
        const customerContactName = [customerContact?.GivenName, customerContact?.FamilyName]
          .filter(Boolean)
          .join(" ")
          .trim();
        window.leadCaptureLookup = {
          customerId,
          customerName,
          siteContactName: response?.SiteContact?.GivenName || "",
          defaultSiteId,
          customerContactId,
          customerContactName,
        };
        window.pendingCustomerContactId = customerContactId;

        if (customerName) {
          $("#autoJobBtn").val(customerName);
        }

        const siteContractName = response?.SiteContact?.GivenName || "";
        if (siteContractName) {
          $("#siteContractName").text(siteContractName);
        }
        if (defaultSiteId) {
             fetchAssetData(defaultSiteId);
        }

        console.log("Customer Name:", customerName);
        console.log("CustomerID:", customerId);

        if (customerId) {
          if (window.loadCustomerContacts) {
            window.loadCustomerContacts(customerId);
          }

          getCompanySites(customerId)
            .done(function (sitesResponse) {
              const sites = sitesResponse?.Sites || sitesResponse?.sites || [];
              populateCustomerTenancySites(sites, defaultSiteId);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
              console.error("Site lookup failed:", textStatus, errorThrown);
              populateCustomerTenancySites([]);
            });
        } else {
          populateCustomerTenancySites([]);
        }
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        console.error("Job lookup failed:", textStatus, errorThrown);
        clearLookupDependentFields();
      });
  };
});
