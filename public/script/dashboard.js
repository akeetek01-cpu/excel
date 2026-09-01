function enforceLeadFormAccess() {
  const user = localStorage.getItem("user");
  if (!user) {
    window.location.replace("/");
    return false;
  }
  return true;
}
window.addEventListener("pageshow", enforceLeadFormAccess);


$(function() {
    const userData = localStorage.getItem("user");
    const user = JSON.parse(userData);
    console.log("Name:", user);
    $("#welcomeMessage").text(`Welcome, ${user.Name}!`);

    if (user.isAdmin) {
        $("#manageUsersBtn").removeClass("d-none");
    } else {
        $("#manageUsersBtn").addClass("d-none");
    }

    $("#manageUsersBtn").on("click", function () {
        if (!user.isAdmin) {
            showAlertDialog("You do not have permission to access this page.", "Access Denied");
            return;
        }
        window.location.href = "/employee-management";
    });

    $("#leadLogoutButton").on("click", function () {
        showCustomDialogConfirm("Logout", "Are you sure you want to logout?", function () {
            window.localStorage.clear();
            window.sessionStorage.clear();
            window.location.replace("/");
        });
    });
    
     $("#welcomeMessage").text(`Welcome, ${user.Name}`);

});
