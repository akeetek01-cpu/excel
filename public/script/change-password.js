$(function() {
     const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const emailValue = urlParams.get('email');
        const temp = urlParams.get('tempPw');
        const isTemp = urlParams.get('isTemp'); 
        if (isTemp === 'true') {
            $('#resendPassword').css('display', 'inline-block');
        } else {
             $('#resendPassword').hide()
        }
    $('#changePasswordBtn').on('click', function(e) {
        showLoader()
       
        e.preventDefault();
        $("#errorMsg").css("visibility", "hidden");
         $("#changePasswordBtn").addClass("button--loading");
        var data = {
            email: $('#email').val(),
            oldPassword: $('#oldPassword').val(),
            newPassword: $('#newPassword').val(),
            isTemp: isTemp
        };
        $.ajax({
            url: '/api/changePassword',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(result) {
                hideLoader()
                $("#changePasswordBtn").removeClass("button--loading");
                 window.location.href = '/login';
            },
            error: function(xhr) {
                hideLoader()
                $("#changePasswordBtn").removeClass("button--loading");
                var msg = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : 'Login failed';
                $("#errorMsg").text(msg);
                $("#errorMsg").css("visibility", "visible");
            }
        });
    });
    
});
