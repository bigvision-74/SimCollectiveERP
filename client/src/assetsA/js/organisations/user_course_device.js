
document.addEventListener('DOMContentLoaded', function () {
    // User Search Functionality
    const userSearchInput = document.getElementById('userSearchInput');
    const orguserTable = document.getElementById('orguserTable');
    if (orguserTable) {
        const userRows = orguserTable.getElementsByTagName('tr');

        userSearchInput.addEventListener('keyup', function () {
            const filter = userSearchInput.value.toLowerCase();
            for (let i = 1; i < userRows.length; i++) { // Start from 1 to skip the header row
                const cells = userRows[i].getElementsByTagName('td');
                let match = false;
                for (let j = 0; j < cells.length; j++) {
                    if (cells[j].innerText.toLowerCase().includes(filter)) {
                        match = true;
                        break;
                    }
                }
                userRows[i].style.display = match ? '' : 'none';
            }
        });
    }

    // Course Search Functionality
    const courseSearchInput = document.getElementById('courseSearchInput');
    const orgcourseTable = document.getElementById('orgcourseTable');
    if (orgcourseTable) {
        const courseRows = orgcourseTable.getElementsByTagName('tr');

        courseSearchInput.addEventListener('keyup', function () {
            const filter = courseSearchInput.value.toLowerCase();
            for (let i = 1; i < courseRows.length; i++) { // Start from 1 to skip the header row
                const cells = courseRows[i].getElementsByTagName('td');
                let match = false;
                for (let j = 0; j < cells.length; j++) {
                    if (cells[j].innerText.toLowerCase().includes(filter)) {
                        match = true;
                        break;
                    }
                }
                courseRows[i].style.display = match ? '' : 'none';
            }
        });
    }

    // Device Search Functionality
    const deviceSearchInput = document.getElementById('deviceSearchInput');
    const orgdeviceTable = document.getElementById('orgdeviceTable');
    if (orgdeviceTable) {
        const deviceRows = orgdeviceTable.getElementsByTagName('tr');

        deviceSearchInput.addEventListener('keyup', function () {
            const filter = deviceSearchInput.value.toLowerCase();
            for (let i = 1; i < deviceRows.length; i++) { // Start from 1 to skip the header row
                const cells = deviceRows[i].getElementsByTagName('td');
                let match = false;
                for (let j = 0; j < cells.length; j++) {
                    if (cells[j].innerText.toLowerCase().includes(filter)) {
                        match = true;
                        break;
                    }
                }
                deviceRows[i].style.display = match ? '' : 'none';
            }
        });
    }
});
