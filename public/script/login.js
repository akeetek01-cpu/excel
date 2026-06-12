$(function() {
    $('#loginBtn').on('click', function(e) {
        localStorage.removeItem("user");
        e.preventDefault();
        $("#errorMsg").css("visibility", "hidden");
         $("#loginBtn").addClass("button--loading");
        var data = {
            email: $('#email').val(),
            password: $('#password').val()
        };
        $.ajax({
            url: '/api/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(result) {
                console.log("Login successful:", result.user);
                localStorage.setItem(
                    "user",
                    JSON.stringify(result.user)
                );
                $("#loginBtn").removeClass("button--loading");
                 window.location.href = '/dashboard';
            },
            error: function(xhr) {
                localStorage.removeItem("user");
                $("#loginBtn").removeClass("button--loading");
                var msg = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Login failed';
                $("#errorMsg").text(msg);
                $("#errorMsg").css("visibility", "visible");
            }
        });
    });
});
