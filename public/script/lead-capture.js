$(function() {
    const userData = localStorage.getItem("user");
    const user = JSON.parse(userData);
    console.log("Name:", user.name);
    $("#yourName").val(user.name);
    //$("#yourManagerName").val(user.managerName);

});
