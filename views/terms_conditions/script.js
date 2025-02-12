const token = new URLSearchParams(window.location.search).get('token');
const verificationCode = new URLSearchParams(window.location.search).get('verificationCode');
let companies = [];

document.addEventListener('DOMContentLoaded', async () => {
    // If verification exist and backend as redirected to this page
    if(verificationCode) {
        // The verification code is incorrect
        document.getElementById('verificationCode-error').hidden = false;
    }

    document.getElementById('terms-conditions-form').addEventListener('submit', function(event) {
        event.preventDefault();
        this.method = 'GET';
        this.action = `/api/v1/user`;
        this.submit();
    });
});
