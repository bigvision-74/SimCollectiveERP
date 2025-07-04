
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the map
    var map = L.map('map').setView([20.5937, 78.9629], 5);

    // Add a tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright"></a> contributors'
    }).addTo(map);

    // Fetch user locations and add markers to the map
    fetch('/user-locations')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {

            data.forEach(location => {
                const latitude = parseFloat(location.latitude);
                const longitude = parseFloat(location.longitude);

                // Check if latitude and longitude are valid numbers
                if (!isNaN(latitude) && !isNaN(longitude)) {
                    L.marker([latitude, longitude])
                        .addTo(map)
                        .bindPopup(`Username: ${location.username}<br>City: ${location.city}`)
                        .openPopup();
                } else {
                    console.error('Invalid coordinates for location:', location);
                }
            });
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
});
