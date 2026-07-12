$(function () {
  function getJobData(jobNumber) {
    const settings = {
      url: `https://excel.simprocloud.com/api/v1.0/companies/6/jobs/${jobNumber}`,
      method: "GET",
      timeout: 0,
      headers: {
        Accept: "application/json",
        Authorization: "Bearer c9c47eab18f514ad102ae8c78ce2a444e3bc4dab"
      }
    };

    return $.ajax(settings);
  }

  function getCompanySites(customerID) {
    const settings = {
      url: `https://excel.simprocloud.com/api/v1.0/companies/6/customers/companies/${customerID}`,
      method: "GET",
      timeout: 0,
      headers: {
        Accept: "application/json",
        Authorization: "Bearer c9c47eab18f514ad102ae8c78ce2a444e3bc4dab"
      }
    };

    return $.ajax(settings);
  }

  // populate sites and optionally select a default by ID or name
  function populateCustomerTenancySites(sites, defaultSiteId) {
    const $select = $("#customerTenancy");
    const currentValue = $select.val();

    $select.find("option").not(":first").remove();

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

    // prefer current selection if it matches; otherwise try defaultSiteId (ID or name),
    // otherwise fall back to the first returned site (if any)
    if (currentValue && $select.find(`option[value="${currentValue}"]`).length) {
      $select.val(currentValue);
    } else if (defaultSiteId != null && $select.find(`option[value="${defaultSiteId}"]`).length) {
      $select.val(String(defaultSiteId));
    } else if (Array.isArray(sites) && sites.length) {
      const firstSite = sites[0];
      const firstValue = firstSite.ID != null ? String(firstSite.ID) : firstSite.Name;
      $select.val(firstValue);
    } else {
      $select.val("");
    }
  }

  window.handleJobNumberCompleteApi = function (value) {
    if (!value) return;

    getJobData(value)
      .done(function (response) {
        const customerName = response?.Customer?.CompanyName || response?.CompanyName || response?.Customer?.Name || response?.Name || "";
        const customerId = response?.Customer?.ID || response?.CustomerID || response?.ID || "";

        if (customerName) {
          $("#autoJobBtn").text(customerName);
        }

        const siteContractName = response?.SiteContact?.GivenName || "";
        if (siteContractName) {
          $("#siteContractName").text(siteContractName);
        }

        const firstSite = response?.Site;
        const defaultSiteId = firstSite?.ID != null ? String(firstSite.ID) : firstSite?.Name;
        if (defaultSiteId) {
             fetchAssetData(defaultSiteId);
        }

        console.log("Customer Name:", customerName);
        console.log("CustomerID:", customerId);

        if (customerId) {
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
      });
  };
});
