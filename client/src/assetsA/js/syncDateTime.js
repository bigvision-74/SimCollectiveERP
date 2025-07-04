function updateDateTime() {

    let now = new Date();
    let day = String(now.getDate()).padStart(2, '0');
    let month = String(now.getMonth() + 1).padStart(2, '0');
    let year = now.getFullYear();

    // Format time
    let hours = now.getHours();
    let minutes = String(now.getMinutes()).padStart(2, '0');
    let seconds = String(now.getSeconds()).padStart(2, '0');
    let period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    let currentDate = `${day}/${month}/${year}`;
    let currentTime = `${hours}:${minutes}:${seconds} ${period}`;

    // Update the element content
    let dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = `${currentDate}, ${currentTime}`;
    }
}

updateDateTime();
setInterval(updateDateTime, 1000);