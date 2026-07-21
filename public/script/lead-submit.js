(function ($) {
  function setLeadSubmitLoading(isLoading) {
    const $btn = $("#nextBtn");

    if (!$btn.length) {
      return;
    }

    $btn.toggleClass("button--loading", isLoading);
    $btn.prop("disabled", isLoading);
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
        console.error("Lead submission failed:", status, error, xhr);
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
