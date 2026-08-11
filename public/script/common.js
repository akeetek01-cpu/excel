function showCustomDialog(options = {}) {
  const {
    title = "Notice",
    message = "",
    confirmText = "OK",
    cancelText = "",
    showCancel = false,
    onConfirm,
    onCancel,
  } = options || {};

  $("#createNewConfirmModalTitle").text(title);
  $("#createNewConfirmModalMessage").text(message);
  $("#createNewConfirmModal .confirm-yes").text(confirmText);

  const $cancelButton = $("#createNewConfirmModal .confirm-no");
  if (showCancel && cancelText) {
    $cancelButton.text(cancelText).show();
  } else {
    $cancelButton.hide();
  }

  $("#createNewConfirmModal .confirm-yes")
    .off("click")
    .on("click", function (e) {
      e.preventDefault();
      dismissCustomDialog();
      if (typeof onConfirm === "function") {
        onConfirm();
      }
    });

  $cancelButton.off("click").on("click", function (e) {
    e.preventDefault();
    dismissCustomDialog();
    if (typeof onCancel === "function") {
      onCancel();
    }
  });

  $("#createNewConfirmModal").css("display", "flex");
}

function showAlertDialog(message, title = "Email Verification", onConfirm) {
  showCustomDialog({
    title,
    message,
    confirmText: "OK",
    showCancel: false,
    onConfirm: function () {
      if (typeof onConfirm === "function") {
        onConfirm();
      }
    },
  });
}

function parseApiErrorPayload(payload) {
  if (!payload) {
    return null;
  }

  const apiErrors = payload.error?.errors || payload.errors;
  if (Array.isArray(apiErrors) && apiErrors.length) {
    return apiErrors
      .map((error) => {
        const path = error?.path ? `${error.path}: ` : "";
        const message = error?.message || error?.value || error?.text || "";
        return `${path}${message}`.trim();
      })
      .filter(Boolean)
      .join("\n");
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  if (typeof payload.message === "string") {
    return payload.message;
  }

  if (typeof payload === "string") {
    return payload;
  }

  return null;
}

function parseAjaxError(xhr, status, errorMessage) {
  if (xhr?.responseJSON) {
    const parsed = parseApiErrorPayload(xhr.responseJSON);
    if (parsed) {
      return parsed;
    }
  }

  if (xhr?.responseText) {
    try {
      const parsedBody = JSON.parse(xhr.responseText);
      const parsed = parseApiErrorPayload(parsedBody);
      if (parsed) {
        return parsed;
      }
    } catch (e) {
      // ignore invalid JSON
    }
  }

  return errorMessage || status || "An unexpected error occurred.";
}

function showApiErrorDialog(xhr, status, errorMessage, title = "Error") {
  const message = parseAjaxError(xhr, status, errorMessage);
  showAlertDialog(message, title);
}

function showCustomDialogConfirm(title, message, onConfirm, onCancel) {
  showCustomDialog({
    title: title,
    message: message,
    confirmText: "Yes",
    cancelText: "No",
    showCancel: true,
    onConfirm: function () {
      if (typeof onConfirm === "function") {
        onConfirm();
      }
    },
    onCancel: function () {
      if (typeof onCancel === "function") {
        onCancel();
      }
    },
  });
}

function dismissCustomDialog() {
  $("#createNewConfirmModal").hide();
}


function showLoader() {
    $("#containerLoader").removeClass("d-none");
    $("#btnLogin").prop("disabled", true);
}

function hideLoader() {
    $("#containerLoader").addClass("d-none");
    $("#btnLogin").prop("disabled", false);
}


