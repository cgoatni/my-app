// const profilePictureInput = document.getElementById('settings-profile-picture');
// const profileImg = document.getElementById('profile-img');

// // Profile picture preview logic
// profilePictureInput.addEventListener('change', function(e) {
//     const file = e.target.files[0];
//     const reader = new FileReader();

//     // Hide the image preview first
//     profileImg.classList.add('hidden');

//     reader.onload = function(event) {
//         profileImg.src = event.target.result;
//         profileImg.classList.remove('hidden');
//     };

//     if (file) {
//         reader.readAsDataURL(file);
//     }
// });

// Validate the old password before updating
async function validateOldPassword(oldPassword) {
    try {
        const response = await fetch('/validatePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: oldPassword }),
        });
        const data = await response.json();

        if (data.isValid) {
            return true;
        } else {
            alert('Old password is incorrect!');
            return false;
        }
    } catch (err) {
        console.error('Error validating password:', err);
        alert('An error occurred while validating the password.');
        return false;
    }
}

// Add event listener for the save changes button to validate the old password and change the password
document.querySelector('form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;

    // Validate if new passwords match
    if (newPassword !== confirmNewPassword) {
        alert("New password and confirm password do not match!");
        return;
    }

    // Validate the old password
    const isOldPasswordValid = await validateOldPassword(oldPassword);

    if (isOldPasswordValid) {
        console.log('Old password validated successfully! Proceeding with password change.');

        // Example of sending new password to server
        await updatePassword(newPassword);
    } else {
        console.log('Old password is invalid.');
    }
});

// Function to update the password (replace this with your actual API call)
async function updatePassword(newPassword) {
    try {
        const response = await fetch('/updatePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: newPassword }),
        });

        const data = await response.json();
        if (data.success) {
            alert('Password updated successfully!');
        } else {
            alert('Error updating password.');
        }
    } catch (err) {
        console.error('Error updating password:', err);
        alert('An error occurred while updating the password.');
    }
}