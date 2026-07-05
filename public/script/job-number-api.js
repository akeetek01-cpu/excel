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

  function populateCustomerTenancySites(sites) {
    const $select = $("#customerTenancy");
    const currentValue = $select.val();

    $select.find("option").not(":first").remove();

    if (Array.isArray(sites) && sites.length) {
      sites.forEach((site) => {
        if (!site || !site.Name) return;
        const optionValue = site.ID || site.Name;
        const option = new Option(site.Name, optionValue);
        if (site.ID) {
          $(option).attr("data-site-id", site.ID);
        }
        $select.append(option);
      });
    }

    const otherOption = $select.find('option[value="Other"]');
    if (!otherOption.length) {
      $select.append(new Option("Other", "Other"));
    }

    if (currentValue && $select.find(`option[value="${currentValue}"]`).length) {
      $select.val(currentValue);
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

        console.log("Customer Name:", customerName);
        console.log("CustomerID:", customerId);

        if (customerId) {
          getCompanySites(customerId)
            .done(function (sitesResponse) {
              const sites = sitesResponse?.Sites || sitesResponse?.sites || [];
              populateCustomerTenancySites(sites);
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
