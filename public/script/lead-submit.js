(function ($) {
  function setLeadSubmitLoading(isLoading) {
    const $btn = $("#nextBtn");

    if (!$btn.length) {
      return;
    }

    $btn.toggleClass("button--loading", isLoading);
    $btn.prop("disabled", isLoading);
  }

  function normalizeLeadTeamName(teamName) {
    const value = String(teamName || "").trim();
    if (!value) {
      return "";
    }

    const normalized = value.toLowerCase();
    if(value =="Service One Team") return "Service ONE";
    if(value =="Service Two Team") return "Service TWO";
    if(value =="Service Three Team") return "Service THREE";
    if(value =="Apprentice Team") return "Apprentice Team";
    return value;
  }

  function normalizeSalerPersonPosition(teamGroup) {
    const value = String(teamGroup || "").trim();
    if (!value) {
      return "";
    }

   if(value =="Apprentice") return "Industrial (RAC) Apprentice";
   if(value =="HVAC Service Manager") return "Commercial (HVAC) Service Manager";
   if(value =="RAC Supervisor") return "Industrial (RAC) Supervisor";
   if(value =="Technician") return "Industrial (RAC) Technician";
   if(value =="Maintenance Technician") return "Industrial (RAC) Technician";
    return value;
  }

  function updateLeadCustomFields(leadId, baseUrl, authToken) {
    if (!leadId) {
      return $.Deferred().reject(new Error("Lead ID is missing.")).promise();
    }
    const userData = localStorage.getItem("user");
    const user = JSON.parse(userData || "{}");

    const customFields = [
      { id: 7, value: "QUOTE Request - LEAD Form" },
      { id: 4, value: user.Name || "" },
      { id: 6, value: normalizeLeadTeamName(user.TeamName) || "" },
      { id: 5, value: normalizeSalerPersonPosition(user.col3) || "" },
    ];

    const requests = customFields.map((field) => {
      return $.ajax({
        url: `${baseUrl}/companies/6/leads/${leadId}/customFields/${field.id}`,
        method: "PATCH",
        timeout: 0,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: JSON.stringify({ Value: field.value }),
      });
    });

    return $.when.apply($, requests);
  }

  function submitLeadToSimpro(payload, options) {
    const config = window.SIMPRO_CONFIG || {};
    const baseUrl = String(config.baseUrl || "").trim();
    const authToken = String(config.authToken || "").trim();

    setLeadSubmitLoading(true);

    if (!baseUrl || !authToken) {
      const errorMessage = "SIMPRO configuration is missing.";
      console.error(errorMessage);
      setLeadSubmitLoading(false);
      if (typeof options?.onError === "function") {
        options.onError(null, "config_error", errorMessage);
      } else if (window.alert) {
        window.alert("Unable to submit lead because SIMPRO configuration is missing.");
      }
      return $.Deferred().reject(errorMessage);
    }

    const requestBody = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);

    const settings = {
      url: `${baseUrl}/companies/6/leads/`,
      method: "POST",
      timeout: 0,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      data: requestBody,
    };

    return $.ajax(settings)
      .done(function (response) {
        const leadId = response?.ID || response?.Id || response?.id || response?.LeadId || response?.leadId;

        if (leadId) {
          updateLeadCustomFields(leadId, baseUrl, authToken)
            .done(function () {
              console.log("Custom fields updated successfully.");
            })
            .fail(function () {
              console.error("One or more custom field updates failed.");
            });
        }

        if (typeof options?.onSuccess === "function") {
          options.onSuccess(response);
          return;
        }

        console.log(response);
        if (window.alert) {
          window.alert("Lead created successfully.");
        }
      })
      .fail(function (xhr, status, error) {
        //console.error("Lead submission failed:", status, error, xhr);
        if (typeof options?.onError === "function") {
          options.onError(xhr, status, error);
          return;
        }

        if (window.alert) {
          window.alert("Failed to create lead. Please try again. Staff not found.");
        }
      })
      .always(function () {
        setLeadSubmitLoading(false);
      });
  }

  window.submitLeadToSimpro = submitLeadToSimpro;
})(jQuery);
