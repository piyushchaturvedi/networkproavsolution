document.addEventListener('DOMContentLoaded', () => {
    // Handle mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('change', () => {
            if (menuToggle.checked) {
                navMenu.classList.add('active');
            } else {
                navMenu.classList.remove('active');
            }
        });
    }

    // Handle dropdown menu (if applicable)
    const dropdown = document.querySelector('.dropdown');
    if (dropdown) {
        const dropbtn = dropdown.querySelector('.dropbtn');
        const dropdownContent = dropdown.querySelector('.dropdown-content');

        if (dropbtn && dropdownContent) {
            dropbtn.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent default link behavior
                dropdownContent.classList.toggle('show');
            });

            // Close the dropdown if the user clicks outside of it
            window.addEventListener('click', (event) => {
                if (!event.target.matches('.dropbtn') && !event.target.closest('.dropdown-content')) {
                    if (dropdownContent.classList.contains('show')) {
                        dropdownContent.classList.remove('show');
                    }
                }
            });
        }
    }

    // Add any other general client-side interactions here
});
