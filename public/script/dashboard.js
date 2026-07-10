$(function() {
    const userData = localStorage.getItem("user");
    const user = JSON.parse(userData);
    console.log("Name:", user);
    $("#welcomeMessage").text(`Welcome ${user.Name}!`);

});
