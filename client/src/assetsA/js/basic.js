// alert message time out 
document.addEventListener('DOMContentLoaded', function () {
    const alertMsg = document.getElementById('successAlert');
    if (alertMsg) {
        setTimeout(() => {
            successAlert.style.display = 'none';
        }, 4000); // 4000 milliseconds = 4 seconds
    }
});

document.addEventListener('DOMContentLoaded', function () {

    function setupDropzone(dropzoneId, fileInputId, isImage) {
        var dropzone = document.getElementById(dropzoneId);
        if (dropzone) {
            var fileInput = document.getElementById(fileInputId);
            var filenameDisplay = dropzone.querySelector('.filename');
            var preview = dropzone.querySelector('.preview-image');
            var message = dropzone.querySelector('.message');
            var uploadAnimation = dropzone.querySelector('.upload-animation');

            // Click event to trigger file input click
            dropzone.addEventListener('click', function () {
                fileInput.click();
            });

            // Drag over event to change the dropzone style
            dropzone.addEventListener('dragover', function (event) {
                event.preventDefault();
                dropzone.classList.add('dragover');
            });

            // Drag leave event to revert the dropzone style
            dropzone.addEventListener('dragleave', function (event) {
                dropzone.classList.remove('dragover');
            });

            // Drop event to handle file drop
            dropzone.addEventListener('drop', function (event) {
                event.preventDefault();
                dropzone.classList.remove('dragover');

                var files = event.dataTransfer.files;
                if (files.length > 0) {
                    fileInput.files = files;
                    // Trigger a change event if needed
                    var event = new Event('change', { bubbles: true });
                    fileInput.dispatchEvent(event);
                }
            });

            // Change event to display the file name and preview the image
            fileInput.addEventListener('change', function () {
                if (fileInput.files.length > 0) {
                    var file = fileInput.files[0];
                    var fileName = file.name;
                    filenameDisplay.textContent = `Selected file: ${fileName}`;
                    filenameDisplay.style.display = 'block';

                    // Show upload animation and blur the preview image if it's an image
                    if (isImage) {
                        uploadAnimation.style.display = 'flex';
                        preview.classList.add('loading');
                    }

                    if (isImage) {
                        var reader = new FileReader();
                        reader.onload = function (e) {
                            setTimeout(function () { // Add a delay to simulate processing time
                                preview.src = e.target.result;
                                preview.style.display = 'block';
                                preview.classList.remove('loading');
                                preview.style.opacity = 1; // Make the image visible
                                uploadAnimation.style.display = 'none';
                                message.style.display = 'none';

                                // Display uploaded message
                                filenameDisplay.textContent += " - Upload Successful!";
                            }, 2000); // Adjust delay as needed
                        };
                        reader.readAsDataURL(file);
                    } else {
                        // For non-image files, just display success message
                        filenameDisplay.textContent += " - Upload Successful!";
                    }
                } else {
                    filenameDisplay.textContent = '';
                    filenameDisplay.style.display = 'none';
                    if (isImage) {
                        preview.style.display = 'none';
                    }
                    message.style.display = 'block';
                }
            });
        }
    }

    setupDropzone('dropzone', 'file-input', true); // For thumbnail
    setupDropzone('dropzone-course', 'file-input-course', true); // For thumbnail
    setupDropzone('dropzone-apk', 'file-input-apk', false); // For APK
    setupDropzone('dropzone-pdf', 'file-input-pdf', false); // For APK
    setupDropzone('dropzone-video', 'file-input-video', false); // For APK
    setupDropzone('dropzone-user', 'file-input-user', true); // For APK
    setupDropzone('dropzone-logo', 'file-input-logo', true); // For site logo
    setupDropzone('dropzone-favicon', 'file-input-favicon', true); // For favicon
    setupDropzone('dropzone-sitelogo', 'file-input-sitelogo', true); // For sitelogo
});
