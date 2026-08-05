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


