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
        const successPayload = response.data || response;

        // Construct combined message for Lead and Quote results
        const leadOk = Boolean(successPayload.leadCreated || successPayload.leadId);
        const quoteOk = Boolean(successPayload.quoteCreated || successPayload.quoteId);
        let finalMsg = "";
        if (leadOk && quoteOk) {
          finalMsg = "Lead and Quote created successfully.";
        } else if (leadOk) {
          finalMsg = "Lead created successfully. Quote creation may have failed.";
        } else if (quoteOk) {
          finalMsg = "Quote created successfully. Lead creation may have failed.";
        } else if (typeof successPayload.message === "string" && successPayload.message.trim()) {
          finalMsg = successPayload.message;
        } else {
          finalMsg = "Operation completed.";
        }

        if (typeof options?.onSuccess === "function") {
          options.onSuccess(successPayload);

          if (options?.showSuccessAlert !== false) {
            if (typeof showAlertDialogSuccess === "function") {
              showAlertDialogSuccess(finalMsg);
            } else if (window.alert) {
              window.alert(finalMsg);
            }
          }

          return;
        }

        if (options?.showSuccessAlert !== false) {
          if (typeof showAlertDialogSuccess === "function") {
            showAlertDialogSuccess(finalMsg);
          } else if (window.alert) {
            window.alert(finalMsg);
          }
        }
      })
      .fail(function (xhr, status, error) {
        // Try to extract partial/fine-grained errors from server response
        let leadError = null;
        let quoteError = null;
        let genericMsg = null;
        try {
          const json = xhr && xhr.responseJSON ? xhr.responseJSON : null;
          if (json) {
            leadError = json.leadError || json.leadMessage || null;
            quoteError = json.quoteError || json.quoteMessage || null;
            genericMsg = json.message || null;
          }
        } catch (e) {
          // ignore JSON parsing errors
        }

        const parts = [];
        if (leadError) parts.push(`Lead: ${leadError}`);
        if (quoteError) parts.push(`Quote: ${quoteError}`);
        if (!parts.length && genericMsg) parts.push(genericMsg);
        const finalFailMsg = parts.length ? parts.join("; ") : "Failed to create lead/quote. Please try again.";

        if (typeof options?.onError === "function") {
          options.onError(xhr, status, error);
          // also show dialog about partial errors unless suppressed
          if (options?.showSuccessAlert !== false) {
            if (typeof showApiErrorDialog === "function") {
              showApiErrorDialog(xhr, status, error, finalFailMsg);
            } else if (window.alert) {
              window.alert(finalFailMsg);
            }
          }
          return;
        }

        if (typeof showApiErrorDialog === "function") {
          showApiErrorDialog(xhr, status, error, finalFailMsg);
          return;
        }

        if (window.alert) {
          window.alert(finalFailMsg);
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
