

// pagination script 
function changePageSize(select) {
    let pageSize = select.value;
    let url = new URL(window.location.href);
    url.searchParams.set('per_page', pageSize);
    window.location.href = url.toString();
}

// table data search script 
// document.addEventListener('DOMContentLoaded', function () {
//     const searchInput = document.getElementById('searchInput');
//     const table = document.getElementById('userTable').getElementsByTagName('tbody')[0];

//     searchInput.addEventListener('keyup', function () {
//         const filter = searchInput.value.toLowerCase();
//         const rows = table.getElementsByTagName('tr');

//         // Reset the display property for all rows
//         Array.from(rows).forEach(row => {
//             row.style.display = '';
//         });

//         // Apply the filter
//         Array.from(rows).forEach(row => {
//             const username = row.cells[2].textContent.toLowerCase();
//             const email = row.cells[3].textContent.toLowerCase();
//             const role = row.cells[4].textContent.toLowerCase();
//             if (username.indexOf(filter) === -1 && email.indexOf(filter) === -1 && role.indexOf(filter) === -1) {
//                 row.style.display = 'none';
//             }
//         });
//     });
// });

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const searchInput1 = document.getElementById('searchInput1');
    const deviceSearchInput = document.getElementById('deviceSearchInput');
    const tagInput = document.getElementById('tagInput');
    const table = document.getElementById('userTable');
    const table1 = document.getElementById('userTable1');
    const deviceTable = document.getElementById('deviceTable');
    const tagTable = document.getElementById('tagTable');
    const activityTable = document.getElementById('activityTable');
    const projectList = document.getElementById('projectList');

    function filterProjectList(filter) {
        const projectItems = projectList.getElementsByClassName('project-item');

        Array.from(projectItems).forEach(item => {
            const projectNameElement = item.querySelector('.text-base');
            const typeElement = item.querySelector('.flex .text-slate-600');

            if (projectNameElement && typeElement) {
                const projectName = projectNameElement.textContent.trim().toLowerCase();
                const type = typeElement.textContent.trim().toLowerCase();

                if (projectName.includes(filter) || type.includes(filter)) {
                    item.style.display = ''; // Show the item
                } else {
                    item.style.display = 'none'; // Hide the item
                }
            }
        });
    }

    function filterTableRows(filter) {
        const tbody = table.querySelector('tbody');
        const rows = tbody ? tbody.getElementsByTagName('tr') : [];

        Array.from(rows).forEach(row => {
            const usernameCell = row.cells[2];
            const emailCell = row.cells[3];
            const roleCell = row.cells[4];

            const username = usernameCell ? usernameCell.textContent.trim().toLowerCase() : '';
            const email = emailCell ? emailCell.textContent.trim().toLowerCase() : '';
            const role = roleCell ? roleCell.textContent.trim().toLowerCase() : '';

            if (username.includes(filter) || email.includes(filter) || role.includes(filter)) {
                row.style.display = ''; // Show the row
            } else {
                row.style.display = 'none'; // Hide the row
            }
        });
    }

    function filterTableRows1(filter) {
        const tbody = table1.querySelector('tbody');
        const rows = tbody ? tbody.getElementsByTagName('tr') : [];

        Array.from(rows).forEach(row => {
            const usernameCell = row.cells[2];
            const emailCell = row.cells[3];
            const roleCell = row.cells[4];

            const username = usernameCell ? usernameCell.textContent.trim().toLowerCase() : '';
            const email = emailCell ? emailCell.textContent.trim().toLowerCase() : '';
            const role = roleCell ? roleCell.textContent.trim().toLowerCase() : '';

            if (username.includes(filter) || email.includes(filter) || role.includes(filter)) {
                row.style.display = ''; // Show the row
            } else {
                row.style.display = 'none'; // Hide the row
            }
        });
    }

    function filterDeviceTable(filter) {
        const tbody = deviceTable.querySelector('tbody');
        const rows = tbody ? tbody.getElementsByTagName('tr') : [];

        Array.from(rows).forEach(row => {
            const cells = row.getElementsByTagName('td');
            let match = false;

            Array.from(cells).forEach(cell => {
                if (cell.textContent.trim().toLowerCase().includes(filter)) {
                    match = true;
                }
            });

            row.style.display = match ? '' : 'none';
        });
    }
    function filterTagTable(filter) {
        const tbody = tagTable.querySelector('tbody');
        const rows = tbody ? tbody.getElementsByTagName('tr') : [];

        Array.from(rows).forEach(row => {
            const cells = row.getElementsByTagName('td');
            let match = false;

            Array.from(cells).forEach(cell => {
                if (cell.textContent.trim().toLowerCase().includes(filter)) {
                    match = true;
                }
            });

            row.style.display = match ? '' : 'none';
        });
    }
    function filterActivityTable(filter) {
        const tbody = activityTable.querySelector('tbody');
        const rows = tbody ? tbody.getElementsByTagName('tr') : [];

        Array.from(rows).forEach(row => {
            const cells = row.getElementsByTagName('td');
            let match = false;

            Array.from(cells).forEach(cell => {
                if (cell.textContent.trim().toLowerCase().includes(filter)) {
                    match = true;
                }
            });

            row.style.display = match ? '' : 'none';
        });
    }

    const attachSearchListener = (input) => {
        input.addEventListener('keyup', function () {
            const filter = input.value.trim().toLowerCase();

            if (projectList) {
                filterProjectList(filter);
            }

            if (table) {
                filterTableRows(filter);
            }

            if (table1) {
                filterTableRows1(filter);
            }

            if (deviceTable) {
                filterDeviceTable(filter);
            }
            if (tagTable) {
                filterTagTable(filter);
            }
            if (activityTable) {
                filterActivityTable(filter);
            }
        });
    };

    if (searchInput) {
        attachSearchListener(searchInput);
    }

    if (searchInput1) {
        attachSearchListener(searchInput1);
    }
    if (deviceSearchInput) {
        attachSearchListener(deviceSearchInput);
    }
    if (tagInput) {
        attachSearchListener(tagInput);
    }

});







