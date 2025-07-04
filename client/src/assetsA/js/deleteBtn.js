// delete buttton script 
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.delete-confirmation-modal').forEach(function (deleteLink) {
        deleteLink.addEventListener('click', function (event) {
            // const deleteContentId = this.getAttribute('content-dlt-Btn-id');
            const dltcoursebtnId = this.getAttribute('courese-data-id');
            const modaluserID = this.getAttribute('data-modal-userID');

            // if (deleteContentId) {
            //     document.getElementById('confirm-delete-button').setAttribute(
            //         'content-dlt-Btn-id', deleteContentId);
            // } else
            if (dltcoursebtnId) {
                document.getElementById('confirm-delete-button').setAttribute(
                    'courese-data-id', dltcoursebtnId);
            } else if (modaluserID) {
                document.getElementById('confirm-delete-button').setAttribute(
                    'data-modal-userID', modaluserID);
            }
        });
    });

    // Handle the delete action in the modal
    document.getElementById('confirm-delete-button').addEventListener('click', function () {
        // const deleteContentId = this.getAttribute('content-dlt-Btn-id');
        const dltcoursebtnId = this.getAttribute('courese-data-id');
        // if (deleteContentId) {
        //     window.location.href = `/delete-content/${deleteContentId}`;
        // } else
         if (dltcoursebtnId) {
            window.location.href = `/delete-course/${dltcoursebtnId}`;
        } else if (modaluserID) {
            window.location.href = `/delete-course/${modaluserID}`;
        }
    });
});