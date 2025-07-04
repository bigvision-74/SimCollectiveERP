document.addEventListener('DOMContentLoaded', function () {
    const deviceId = document.getElementById('deviceLocation').value;
    var map = L.map('map').setView([20.5937, 78.9629], 5);

    // Add a tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright"></a> contributors'
    }).addTo(map);

    // Fetch location data from backend
    fetch(`/get-device-location/${deviceId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.loc) {
                const [latitude, longitude] = data.loc.split(',');

                // Add a marker for the IP address location
                L.marker([latitude, longitude])
                    .addTo(map)
                    .bindPopup(`IP: ${data.ip}<br>Location: ${data.city}, ${data.region}, ${data.country}`)
                    .openPopup();

                // Center the map on the IP address location
                map.setView([latitude, longitude], 10);
            } else {
                console.error('No location data found for IP:', data.ip);
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
});