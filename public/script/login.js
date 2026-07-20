$(function() {
    const savedEnv = localStorage.getItem('SIMPRO_ENV') || 'PROD';
    $('#simproEnvSelect').val(savedEnv);

    $('#loginBtn').on('click', function(e) {
        localStorage.removeItem("user");
        const selectedEnv = $('#simproEnvSelect').val() || 'PROD';
        localStorage.setItem('SIMPRO_ENV', selectedEnv);
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
