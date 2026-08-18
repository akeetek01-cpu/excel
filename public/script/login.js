window.appState = window.appState || {
  route: "login",
  accountStatus: "ACTIVE",
  login: { email: "", password: "" },
  forgotEmail: "",
  verificationCode: "",
  resetPassword: "",
  resetConfirm: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  userName: "",
  verificationEmail: "",
  tempPassword: "",
  passwordVisible: {
    login: false,
    current: false,
    new: false,
    confirm: false,
    reset: false,
    resetConfirm: false,
  },
};

$(function () {
  const PROD_UAT_ENABLE = "NO"; // Set to "YES" to enable the environment select dropdown, "NO" to hide it.
  if (PROD_UAT_ENABLE !== "YES") {
    $("#simproEnvSelect").closest("div").hide();
    localStorage.setItem("SIMPRO_ENV", "PROD");
  } else {
    const savedEnv = localStorage.getItem("SIMPRO_ENV") || "PROD";
    $("#simproEnvSelect").val(savedEnv);
    $("#simproEnvSelect").closest("div").show();
  }

  $(document).on("input", "#loginEmail", function () {
    // Fires while user is typing, pasting, deleting, etc.
    console.log("Typing/Input:", this.value);

    handleInput($(this), "input");
  });

  $(document).on("keydown", "#loginEmail", function (e) {
    if (e.key === "Enter" || e.which === 13) {
      e.preventDefault();

      console.log("Enter:", this.value);

      handleInput($(this), "enter");
    }
  });

  $(document).on("blur", "#loginEmail", function () {
    // Fires when user clicks outside / tabs outside
    console.log("Outside/Blur:", this.value);

    handleInput($(this), "blur");
  });

  $(document).on("change", "#loginEmail", function () {
    // Fires when value changes and input loses focus
    console.log("Change:", this.value);

    handleInput($(this), "change");
  });

  $(document).on("animationstart", "#loginEmail", function (e) {
    if (e.originalEvent.animationName === "autofillDetected") {
      // Browser saved value/autofill
      console.log("Browser Autofill:", this.value);

      handleInput($(this), "autofill");
    }
  });

  function handleInput($input, eventType) {
    const value = $.trim($input.val());
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    appState.verificationEmail = value;
    if (emailRegex.test(value)) {
      validateEmailFromApi(value);
    }
    console.log({
      event: eventType,
      value: value,
    });
  }

  function validateEmailFromApi(email) {
    var settings = {
      url: "/api/usersbyemail",
      method: "POST",
      timeout: 0,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        email: email,
      }),
    };
    $.ajax(settings)
      .done(function (response) {
        const nextStatus =
          response &&
          response.isAccountActive &&
          response.isAccountActive === true
            ? "ACTIVE"
            : "INACTIVE";

        if (appState.accountStatus !== nextStatus) {
          appState.accountStatus = nextStatus;
          updateRender();
        }
        appState.userName = response.Name;
        console.log(response && response.Name ? response.Name : "No Name");
      })
      .fail(function (err) {
        appState.accountStatus = "ACTIVE";
        updateRender();
      });
  }

  function updateRender() {
    if (typeof window.render === "function") {
      window.render();
    }
  }

  $(document).on("click", "#loginBtn", function () {
    callLogin();
  });

  $(document).on("click", "#activateBtn", function () {
    callActivate((isResendTempPw = false));
  });

  $(document).on("click", "#resendCodeBtn", function () {
    $("#verificationCode").val("");
    appState.tempPassword = "";
    callActivate((isResendTempPw = true));
  });

  $(document).on("click", "#resetPasswordBtn", function () {
    updatePassword(isTempFlow = true);
  });
   $(document).on("click", "#updatePasswordBtn", function () {
    updatePassword(isTempFlow = false);
  });

   $(document).on("click", "#changePasswordBtn", function () {
    const email = $("#loginEmail").val().trim();
    if (email === "") {
      showAlertDialog(
        "Please enter your email address.",
        "Change Password",
        function () {},
      );
      return;
    }
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      showAlertDialog(
        "Please enter a valid email address.",
        "Change Password",
        function () {},
      );
      return;
    }
    appState.route = 'change';
    render();
  });


  $(document).on("click", "#sendCodeBtn", function () {
    const email = $("#forgotEmail").val().trim();
    appState.forgotEmail = email;
    if (email === "") {
      showAlertDialog(
        "Please enter your email address.",
        "Email Verification",
        function () {},
      );
      return;
    }
     var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      showAlertDialog(
        "Please enter a valid email address.",
        "Email Verification",
        function () {},
      );
      return;
    }
    const tempPw = getTempassword();
    updateCurrentUserWithTempPassword(email, tempPw, false, false);
  });

  $(document).on("click", "#verifyCodeBtn", function () {
    const verificationCode = $("#verificationCode").val().trim();
    if (verificationCode === "") {
      showAlertDialog(
        "Please enter the verification code.",
        "Email Verification",
        function () {},
      );
      return;
    }
    if (appState.tempPassword === verificationCode) {
      appState.route = "reset";
      updateRender();
    } else {
      showAlertDialog(
        "Invalid verification code. Please try again.",
        "Email Verification",
        function () {},
      );
    }
  });

  function callLogin() {
    const email = $("#loginEmail").val().trim();
    const password = $("#loginPassword").val().trim();
    if (email === "" || password === "") {
      showAlertDialog(
        "Please enter both email and password.",
        "Login Error",
        function () {},
      );
      return;
    }
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlertDialog(
        "Please enter a valid email address.",
        "Login Error",
        function () {},
      );
      return;
    }
    showLoader();
    localStorage.removeItem("user");
    const selectedEnv = $("#simproEnvSelect").val() || "PROD";
    localStorage.setItem("SIMPRO_ENV", selectedEnv);

    var data = {
      email: email,
      password: password,
    };
    $.ajax({
      url: "/api/login",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: function (result) {
        hideLoader();
        console.log("Login successful:", result.user);
        localStorage.setItem("user", JSON.stringify(result.user));
        $("#loginBtn").removeClass("button--loading");
        window.location.href = "/lead-form";
      },
      error: function (xhr) {
        hideLoader();
        localStorage.removeItem("user");
        $("#loginBtn").removeClass("button--loading");
        var msg =
          xhr.responseJSON && xhr.responseJSON.error
            ? xhr.responseJSON.error
            : "Login failed";
        $("#errorMsg").text(msg);
        $("#errorMsg").removeClass("d-none");
      },
    });
  }

  function callActivate(isResendTempPw = false) {
    var email;
    if (isResendTempPw) {
      email = appState.verificationEmail;
    } else {
      email = $("#loginEmail").val().trim();
    }
    const tempPw = getTempassword();
    updateCurrentUserWithTempPassword(email, tempPw, false, isResendTempPw);
  }

  function updateCurrentUserWithTempPassword(
    email,
    tempPw,
    isAccountActive,
    isResendTempPw,
  ) {
    showLoader();
    var settings = {
      url: "/api/users",
      method: "PUT",
      timeout: 0,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        email: email,
        tempPassword: tempPw,
        isAccountActive: isAccountActive,
      }),
    };

    $.ajax(settings)
      .done(function (response) {
        console.log("User updated successfully:", response);
        sendPasswordToEmail(email, tempPw, isResendTempPw);
      })
      .fail(function (err) {
        hideLoader();
        console.log(err);
        showAlertDialog(
          err.responseJSON.error,
          "Email Verification",
          function () {},
        );
      });
  }

  function sendPasswordToEmail(email, tempPw, isResendTempPw) {
    var settings = {
      url: "/api/sendEmail",
      method: "POST",
      timeout: 0,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        name: appState.userName || "HI",
        email: email,
        password: tempPw,
      }),
    };
    $.ajax(settings)
      .done(function (response) {
        hideLoader();
        appState.verificationEmail = email;
        appState.tempPassword = tempPw;
        showAlertDialog(response.message, "Email Verification", function () {
          if (!isResendTempPw) {
            appState.route = "verification";
            updateRender();
          } else {
            appState.route = "verification";
            updateRender();
          }
        });
      })
      .fail(function (err) {
        hideLoader();
        showAlertDialog(
          "Failed to send email",
          "Email Verification",
          function () {},
        );
      });
  }
  function getTempassword() {
    return Math.random().toString(36).substring(2, 8);
  }

  function updatePassword(isTempFlow = false) {
    var newPassword = "";
    var confirmPassword ="";
    var oldPassword = "";
    if (!isTempFlow) {
      newPassword = $("#newPassword").val().trim();
      confirmPassword = $("#confirmPassword").val().trim();
      oldPassword = $("#currentPassword").val().trim();
      if (oldPassword === "") {
        showAlertDialog(
          "Please enter your current password.",
          "Change Password",
          function () {},
        );
        return;
      }
    } else {
      newPassword = $("#resetPassword").val().trim();
      confirmPassword = $("#resetConfirm").val().trim();
      oldPassword = appState.tempPassword;
    }
    if (newPassword === "" || confirmPassword === "") {
      showAlertDialog(
        "Please fill in both password fields.",
        "Reset Password",
        function () {},
      );
      return;
    } else if (newPassword !== confirmPassword) {
      showAlertDialog(
        "Passwords do not match. Please try again.",
        "Reset Password",
        function () {},
      );
      return;
    }

    showLoader();

    var data = {
      email: appState.verificationEmail,
      oldPassword: oldPassword,
      newPassword: newPassword,
      isTemp: isTempFlow,
    };
    $.ajax({
      url: "/api/changePassword",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(data),
      success: function (result) {
        hideLoader();
        showAlertDialog(
          "Password has been successfully updated. Please log in with your new password.",
          "Reset Password",
          function () {
            appState.route = "login";
            appState.accountStatus = "ACTIVE";
            updateRender();
          },
        );
      },
      error: function (xhr) {
        hideLoader();
        var msg =
          xhr.responseJSON && xhr.responseJSON.error
            ? xhr.responseJSON.error
            : "Login failed";
        showAlertDialog(msg, "Reset Password", function () {});
      },
    });
  }
});
