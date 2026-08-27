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

  function setCustomerNameMode() {
    const $select = $("#customerName");
    const selectedValue = String($select.val() || "").trim();
    const $wrapper = $("#customerNameInputWrapper");
    const $selectWrapper = $("#customerNameSelectWrapper");
    const $input = $("#customerNameInput");

    if (selectedValue === "other") {
      $wrapper.removeClass("d-none").removeClass("col-12").addClass("col-9");
      $selectWrapper.removeClass("col-12").addClass("col-3");
    } else {
      $wrapper.addClass("d-none").removeClass("col-9").addClass("col-12");
      $selectWrapper.removeClass("col-3").addClass("col-12");
      $input.removeClass("is-invalid").val("");
      $("#customerNameInputError").text("");
    }
  }

  function populateCustomerContacts(contacts) {
    const $select = $("#customerName");
    const preferredContactId = String(window.pendingCustomerContactId || $select.val() || "").trim();
    const selectedValue = preferredContactId || String($select.val() || "").trim();
    const placeholderText = "Select Contact";

    $select.find("option").not(':first').remove();
    $select.empty().append(new Option(placeholderText, "", true, true));
    $select.find("option[value='']").prop("disabled", true).prop("hidden", true);
    $select.append(new Option("Other", "other"));

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

    if (!normalizedContacts.length) {
      $select.val("other");
      setCustomerNameMode();
      return;
    }

    if (selectedValue === "other") {
      $select.val("other");
    } else if (selectedValue && window.customerContactsById[selectedValue]) {
      $select.val(selectedValue);
    } else {
      $select.val("");
    }

    if (window.pendingCustomerContactId) {
      window.pendingCustomerContactId = "";
    }

    if ($select.val() && $select.val() !== "other") {
      const selectedContact = window.customerContactsById[$select.val()];
      if (selectedContact) {
        populateContactDetails(selectedContact);
      }
    } else {
      $("#customerPhone").val("");
      $("#customerEmail").val("");
    }

    setCustomerNameMode();
  }

  window.loadCustomerContacts = function (customerId) {
    const $select = $("#customerName");
    $select.empty().append(new Option("Select Contact", "", true, true));
    $select.find("option[value='']").prop("disabled", true).prop("hidden", true);
    $select.append(new Option("Other", "other"));
    $("#customerPhone").val("");
    $("#customerEmail").val("");

    if (!customerId) {
      window.customerContactsById = {};
      setCustomerNameMode();
      return;
    }

    const settings = {
      url: `${window.SIMPRO_CONFIG.baseUrl}/companies/${window.SIMPRO_CONFIG.companyId}/customers/${customerId}/contacts/?search=any&columns=ID,GivenName,FamilyName,Position,Email,WorkPhone,CellPhone&pageSize=250&page=1&limit=100`,
      method: "GET",
      timeout: 0,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${window.SIMPRO_CONFIG.authToken}`,
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
    const contactValue = String($(this).val() || "").trim();
    if (contactValue === "other") {
      setCustomerNameMode();
      return;
    }

    if (!contactValue) {
      $("#customerPhone").val("");
      $("#customerEmail").val("");
      setCustomerNameMode();
      return;
    }

    const selectedContact = window.customerContactsById?.[contactValue];
    if (selectedContact) {
      populateContactDetails(selectedContact);
    }
    setCustomerNameMode();
  });
});
