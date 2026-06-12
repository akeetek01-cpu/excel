$(function() {
    $('#changePasswordBtn').on('click', function(e) {
        e.preventDefault();
        $("#errorMsg").css("visibility", "hidden");
         $("#changePasswordBtn").addClass("button--loading");
        var data = {
            email: $('#email').val(),
            oldPassword: $('#oldPassword').val(),
            newPassword: $('#newPassword').val()
        };
        $.ajax({
            url: '/api/changePassword',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(result) {
                $("#changePasswordBtn").removeClass("button--loading");
                 window.location.href = '/login';
            },
            error: function(xhr) {
                $("#changePasswordBtn").removeClass("button--loading");
                var msg = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Login failed';
                $("#errorMsg").text(msg);
                $("#errorMsg").css("visibility", "visible");
            }
        });
    });
});
