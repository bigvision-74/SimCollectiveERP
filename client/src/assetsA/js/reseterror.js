
// reset password error valitadion script 
document.getElementById('resetPasswordForm').addEventListener('submit', function (event) {
    // Clear previous error messages
    document.getElementById('passwordError').textContent = '';
    document.getElementById('confirmationError').textContent = '';

    let valid = true;

    // Password and confirmation fields
    const password = document.getElementById('password').value;
    const passwordConfirmation = document.getElementById('password_confirmation').value;

   
    // Validate password length
    if (password.length < 6) {
        document.getElementById('passwordError').textContent =
            'Password must be at least 6 characters long.';
        valid = false;
    }

    // Validate password confirmation
    if (password !== passwordConfirmation) {
        document.getElementById('confirmationError').textContent = 'Passwords do not match.';
        valid = false;
    }

    // If validation fails, prevent form submission
    if (!valid) {
        event.preventDefault();
    }
});