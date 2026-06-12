$(function() {
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        var data = {
            email: $(this).find('[id="email"]').val(),
            password: $(this).find('[id="password"]').val()
        };
        $.ajax({
            url: '/api/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(result) {
                window.location.href = '/home';
            },
            error: function(xhr) {
                var msg = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Login failed';
                $('#loginMsg').html('<span style="color:red">' + msg + '</span>');
            }
        });
    });
});
