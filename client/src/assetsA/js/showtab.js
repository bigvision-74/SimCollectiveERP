function showTab(tab) {

    document.getElementById('profile-content').classList.add('hidden');
    document.getElementById('change-password-content').classList.add('hidden');
    document.getElementById('account-content').classList.add('hidden');

    if (tab === 'profile-content') {
        document.getElementById('profile-content').classList.remove('hidden');
    } else if (tab === 'change-password-content') {
        document.getElementById('change-password-content').classList.remove('hidden');
    } else if (tab === 'account-content') {
        document.getElementById('account-content').classList.remove('hidden');
    }
}


document.addEventListener("DOMContentLoaded", function () {
    const tabs = document.querySelectorAll(".tab-link");
    if (tabs) {
        const contents = document.querySelectorAll(".tab-content2");

        tabs.forEach(tab => {
            tab.addEventListener("click", function (event) {
                event.preventDefault();
                const target = this.getAttribute("data-tab");

                contents.forEach(content => {
                    if (content.id === target) {
                        content.classList.remove("hidden");
                    } else {
                        content.classList.add("hidden");
                    }
                });

                tabs.forEach(t => {
                    t.classList.remove("font-medium", "text-primary");
                    t.classList.add("flex", "items-center");
                });

                this.classList.add("font-medium", "text-primary");
            });
        });
    }
});