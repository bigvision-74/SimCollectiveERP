
//ORGANISATION SETTING Courses List delete button script 

document.addEventListener('DOMContentLoaded', function () {

    document.querySelectorAll('.delete-confirmation-modal').forEach(function (deleteLink) {
        deleteLink.addEventListener('click', function (event) {
            const deleteVirtualId = this.getAttribute('data-virtual-id');
            const deleteVideoId = this.getAttribute('data-video-id');
            if (deleteVirtualId) {
                document.getElementById('confirm-delete-button').setAttribute(
                    'data-virtual-id', deleteVirtualId);
            } else if (deleteVideoId) {
                document.getElementById('confirm-delete-button').setAttribute(
                    'data-video-id', deleteVideoId);
            }
        });
    });


    document.getElementById('confirm-delete-button').addEventListener('click', function () {
        const deleteVirtualId = this.getAttribute('data-virtual-id');
        const deleteVideoId = this.getAttribute('data-video-id');
        if (deleteVirtualId) {
            window.location.href = `/course-Virtual-Destroy/${deleteVirtualId}`;
        } else if (deleteVideoId) {
            window.location.href = `/course-Virtual-Destroy/${deleteVideoId}`;
        }
    });
});