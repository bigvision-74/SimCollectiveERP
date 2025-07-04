document.addEventListener('DOMContentLoaded', function () {
    const links = document.querySelectorAll('.module-link');
    const videoPlayer = document.getElementById('video-player');
    const videoSource = document.getElementById('video-source');

    links.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();

            // Remove primary color from all links
            links.forEach(l => l.classList.remove('rounded-lg' ,'bg-primary', 'text-white'));

            // Add primary color to the clicked link
            this.classList.add('rounded-lg' ,'bg-primary', 'text-white');

            // Update the video source
            const videoUrl = this.getAttribute('data-video');
            videoSource.src = videoUrl;
            videoPlayer.load();
            videoPlayer.play();
        });
    });
});