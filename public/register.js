$(function() {
    $('#registerForm').on('submit', function(e) {
        console.log('Form submitted');
        e.preventDefault();
        console.log('Submitting form with data:', $(this).serialize());
        
        var data = {
            name: $(this).find('[id="name"]').val(),
            email: $(this).find('[id="email"]').val(),
            phone: $(this).find('[id="phone"]').val(),
            password: $(this).find('[id="password"]').val()
        };
        $.ajax({
            url: '/api/register',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(result) {
                console.log(result);
                //$('#registerMsg').html('<span style="color:green">' + result.message + '</span>');
                $('#registerForm')[0].reset();
            },
            error: function(xhr) {
                console.log(xhr);
                var msg = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Registration failed';
                //$('#registerMsg').html('<span style="color:red">' + msg + '</span>');
            }
        });
    });
});
