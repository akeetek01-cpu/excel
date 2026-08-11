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
    setLeadSubmitLoading(true);

    const simproEnv = window.localStorage?.getItem("SIMPRO_ENV") || "PROD";
    const requestBody = JSON.stringify({ jobData: payload, simproEnv });

    const settings = {
      url: "/api/lead",
      method: "POST",
      timeout: 0,
      contentType: "application/json",
      dataType: "json",
      data: requestBody,
    };

    return $.ajax(settings)
      .done(function (response) {
        if (typeof options?.onSuccess === "function") {
          options.onSuccess(response.data || response);
          return;
        }

        if (window.alert) {
          showAlertDialogSuccess("Lead created successfully.");
        }
      })
      .fail(function (xhr, status, error) {
        if (typeof options?.onError === "function") {
          options.onError(xhr, status, error);
          return;
        }

        if (typeof showApiErrorDialog === "function") {
          showApiErrorDialog(xhr, status, error, "Lead creation failed");
          return;
        }

        if (window.alert) {
          window.alert("Failed to create lead. Please try again.");
        }
      })
      .always(function () {
        if (!options?.deferLoadingEnd) {
          setLeadSubmitLoading(false);
        }
      });
  }

  // Expose loading control so callers can clear it after related workflows complete.
  window.setLeadSubmitLoading = setLeadSubmitLoading;
  window.submitLeadToSimpro = submitLeadToSimpro;
})(jQuery);
