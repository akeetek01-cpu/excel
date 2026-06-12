$(function() {
    const userData = localStorage.getItem("user");
    const user = JSON.parse(userData);
    console.log("Name:", user.name);
    $("#welcomeMessage").text(`Welcome ${user.name}!`);

});
