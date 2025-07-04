document.addEventListener('DOMContentLoaded', function () {
    // Store the selected user ID when delete link is clicked
    document.querySelectorAll('.delete-confirmation-modal').forEach(function (deleteLink) {
        deleteLink.addEventListener('click', function (event) {
            const deleteUserId = this.getAttribute('data-user-id');
            const deleteCourseId = this.getAttribute('data-course-id');
            const deleteCourseUser = this.getAttribute('data-course-user-id');
            const CourseUserId = this.getAttribute('data-course-user');

            // const deleteDeviceId = this.getAttribute('data-device-id');
            if (deleteUserId) {
                document.getElementById('confirm-delete-button').setAttribute(
                    'data-user-id', deleteUserId);
            } else if (deleteCourseId) {
                document.getElementById('confirm-delete-button').setAttribute(
                    'data-course-id', deleteCourseId);
            }else if (deleteCourseUser) {
                document.getElementById('confirm-delete-button').setAttribute(
                    'data-course-user-id', deleteCourseUser);
                document.getElementById('confirm-delete-button').setAttribute(
                    'data-course-user', CourseUserId);
            }
            //  else if (deleteDeviceId) {
            //     document.getElementById('confirm-delete-button').setAttribute(
            //         'data-device-id', deleteDeviceId);
            // }
        });
    });

    // Handle the delete action in the modal
    document.getElementById('confirm-delete-button').addEventListener('click', function () {
        const deleteUserId = this.getAttribute('data-user-id');
        const deleteCourseId = this.getAttribute('data-course-id');
        const deleteCourseUser = this.getAttribute('data-course-user-id');
        const CourseUserId = this.getAttribute('data-course-user');
        // const deleteDeviceId = this.getAttribute('data-course-id');
        if (deleteUserId) {
            window.location.href = `/orguserDestroy/${deleteUserId}`;
        } else if (deleteCourseId) {
            window.location.href = `/orgcourseDestroy/${deleteCourseId}`;
        } else if (deleteCourseUser) {
            window.location.href = `/deleteCourseUsers?userId=${CourseUserId}&courseId=${deleteCourseUser}`;
        }
        // else if (deleteDeviceId) {
        //     window.location.href = `/orgdeviceDestroy/${deleteDeviceId}`;
        // }
    });
});