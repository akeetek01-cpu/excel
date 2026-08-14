$(function () {
  const savedEnv = localStorage.getItem("SIMPRO_ENV") || "PROD";
  $("#simproEnvSelect").val(savedEnv);

  if (window.location.pathname === "/login") {
    checkEmailInput();
}
  

  $("#email").on("input", function () {
    const email = $(this).val().trim();
    if (email) {
        $("#changePasswordLink").attr(
            "href",
            "/forgotPassword?email=" + encodeURIComponent(email)
        );

        //$("#forgotPassword").removeClass("d-none");
    } else {
        $("#changePasswordLink").attr("href", "/forgotPassword");
        //$("#forgotPassword").addClass("d-none");
    }

    checkEmailInput();
  });

  function callLogin() {
    localStorage.removeItem("user");
    const selectedEnv = $("#simproEnvSelect").val() || "PROD";
    localStorage.setItem("SIMPRO_ENV", selectedEnv);

    $("#errorMsg").css("visibility", "hidden");
    $("#loginBtn").addClass("button--loading");
    var data = {
      email: $("#email").val(),
      password: $("#password").val(),
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
        window.location.href = "/dashboard";
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
        $("#errorMsg").css("visibility", "visible");
      },
    });
  }

  function checkEmailInput() {
    $("#password").val("").trigger("input").trigger("change");
    // Email regex
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    var email = $("#email").val().trim();
    if (emailRegex.test(email)) {
      callUsersByEmail(email);
    } else {
      $("#password")
        .prop("disabled", true)
        .val("")
        .trigger("input")
        .trigger("change");
    }
  }
  function callUsersByEmail() {
    var email = $("#email").val().trim();
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
        if (
          response &&
          response.isAccountActive &&
          response.isAccountActive === true
        ) {
          $("#password").prop("disabled", false);
          $("#forgotPassword").removeClass("d-none");
          $("#loginBtn").removeClass("d-none");
          $("#loginBtn").text("Login");
        } else {
          $("#password").prop("disabled", true);
          $("#forgotPassword").addClass("d-none");
          $("#loginBtn").removeClass("d-none");
          $("#loginBtn").text("Activate Account");
        }
        console.log(response.Name);
      })
      .fail(function (err) {
        $("#password").prop("disabled", true);
        $("#forgotPassword").addClass("d-none");
        $("#loginBtn").addClass("d-none");
      });
  }

  $("#loginBtn").on("click", function () {
    showLoader();
    const loginBtnText = $(this).text().trim();
    var email = $("#email").val().trim();
    if (loginBtnText === "Activate Account") {
      const tempPw = getTempassword();
      updateCurrentUserWithTempPassword(email, tempPw, false, false);
    } else if (loginBtnText === "Login") {
      callLogin();
    }
  });

  function sendPasswordToEmail(email, tempPw, isResendTempPw) {
    var settings = {
      url: "/api/sendEmail",
      method: "POST",
      timeout: 0,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        name: "Test",

        email: email,

        password: tempPw,
      }),
    };
    $.ajax(settings)
      .done(function (response) {
        hideLoader();
        showAlertDialog(response.message, "Email Verification", function () {
          if (!isResendTempPw) {
            window.location.href =
          "/forgotPassword?email=" + encodeURIComponent(email) +"&isTemp=true";
          } else {
            $('#oldPassword').attr('placeholder', 'Temp Password').prop('readonly', true).val(tempPw);
          }
      });
      })
      .fail(function (err) {
        hideLoader();
        showAlertDialog("Failed to send email", "Email Verification", function () {});
      });
  }

  function updateCurrentUserWithTempPassword(email, tempPw, isAccountActive, isResendTempPw) {
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
       sendPasswordToEmail(email, tempPw, isResendTempPw);
    
    })
    .fail(function (err) {
      hideLoader();
      console.log(err);
          showAlertDialog(err.responseJSON.error, "Email Verification", function () {});
      });
  }
  function getTempassword() {
    return Math.random().toString(36).substring(2, 8);
  }

  $("#forgotPasswordLink").on("click", function() {
    showLoader();
        const tempPw = getTempassword();
        var email = $("#email").val().trim();
      updateCurrentUserWithTempPassword(email, tempPw, true, false);
    });
  
     $("#resendPassword").on("click", function() {
    showLoader();
        const tempPw = getTempassword();
        var email = $("#email").val().trim();
      updateCurrentUserWithTempPassword(email, tempPw, true, true);
    });
});
