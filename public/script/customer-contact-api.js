$(function () {
  function formatContactName(contact) {
    const givenName = String(contact?.GivenName || "").trim();
    const familyName = String(contact?.FamilyName || "").trim();
    return [givenName, familyName].filter(Boolean).join(" ").trim();
  }

  function populateContactDetails(contact) {
    const phone = String(contact?.WorkPhone || "").replace(/\D/g, "").trim();
    const email = String(contact?.Email || "").trim();

    $("#customerPhone").val(phone);
    $("#customerEmail").val(email);
  }

  function populateCustomerContacts(contacts) {
    const $select = $("#customerName");
    const selectedValue = String($select.val() || "").trim();
    const placeholderText = "Select Contact";

    $select.find("option").not(':first').remove();
    $select.empty().append(new Option(placeholderText, "", true, true));
    $select.find("option[value='']").prop("disabled", true).prop("hidden", true);

    window.customerContactsById = {};

    const normalizedContacts = Array.isArray(contacts) ? contacts.filter(Boolean) : [];
    normalizedContacts
      .slice()
      .sort((a, b) => {
        const aName = formatContactName(a).toLowerCase();
        const bName = formatContactName(b).toLowerCase();
        return aName.localeCompare(bName);
      })
      .forEach((contact) => {
        const label = formatContactName(contact) || `Contact ${contact?.ID || ""}`.trim();
        const value = String(contact?.ID || "");
        if (value) {
          window.customerContactsById[value] = contact;
        }
        $select.append(new Option(label, value));
      });

    if (selectedValue && window.customerContactsById[selectedValue]) {
      $select.val(selectedValue);
    } else {
      $select.val("");
    }

    if ($select.val()) {
      const selectedContact = window.customerContactsById[$select.val()];
      if (selectedContact) {
        populateContactDetails(selectedContact);
      }
    }
  }

  window.loadCustomerContacts = function (customerId) {
    const $select = $("#customerName");
    $select.empty().append(new Option("Select Contact", "", true, true));
    $select.find("option[value='']").prop("disabled", true).prop("hidden", true);
    $("#customerPhone").val("");
    $("#customerEmail").val("");

    if (!customerId) {
      window.customerContactsById = {};
      return;
    }

    const settings = {
      url: `https://excel.simprocloud.com/api/v1.0/companies/6/customers/${customerId}/contacts/?search=any&columns=ID,GivenName,FamilyName,Position,Email,WorkPhone,CellPhone&pageSize=250&page=1&limit=100`,
      method: "GET",
      timeout: 0,
      headers: {
        Accept: "application/json",
        Authorization: "Bearer c9c47eab18f514ad102ae8c78ce2a444e3bc4dab",
      },
    };

    $.ajax(settings)
      .done(function (response) {
        populateCustomerContacts(response);
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        console.error("Customer contact lookup failed:", textStatus, errorThrown);
        populateCustomerContacts([]);
      });
  };

  $(document).on("change", "#customerName", function () {
    const contactId = String($(this).val() || "").trim();
    if (!contactId) {
      $("#customerPhone").val("");
      $("#customerEmail").val("");
      return;
    }

    const selectedContact = window.customerContactsById?.[contactId];
    if (selectedContact) {
      populateContactDetails(selectedContact);
    }
  });
});
