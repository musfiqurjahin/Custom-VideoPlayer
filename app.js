const player = new Plyr('#my-video', {
    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
    clickToPlay: true,
    disableContextMenu: false,
    fullscreen: { enabled: true, fallback: true, iosNative: true }
});

const videoTitleElement = document.getElementById('video-title'); // Element to display the video title

document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const activeHeader = document.querySelector('.accordion-header.active');
        if (activeHeader && activeHeader !== header) {
            activeHeader.classList.remove('active');
            activeHeader.nextElementSibling.style.maxHeight = 0;
        }

        header.classList.toggle('active');
        const content = header.nextElementSibling;
        content.style.maxHeight = header.classList.contains('active') ? content.scrollHeight + 'px' : 0;
    });
});

document.querySelectorAll('.accordion-content li').forEach(item => {
    item.addEventListener("click", () => {
        const videoUrl = item.getAttribute("data-url");
        const videoTitleElement = document.getElementById('video-title'); // Element to display the video title
        const videoTitle = item.getAttribute('data-title'); // Get the video title
        videoTitleElement.innerHTML = `<i class="fas fa-video"></i> Now Playing: ${videoTitle}`; // Update the title dynamically with icon
        if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
            const youtubeId = videoUrl.includes("youtu.be")
                ? videoUrl.split("/").pop()
                : new URL(videoUrl).searchParams.get("v");

            player.source = {
                type: 'video',
                sources: [{ src: youtubeId, provider: 'youtube' }]
            };
        } else {
            player.source = { type: 'video', sources: [{ src: videoUrl, type: 'video/mp4', size: 1080 }] };
        }

        player.muted = false;
        player.play();
    });
});

document.querySelector('.search-bar').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const dropdown = document.getElementById('search-dropdown');
    dropdown.innerHTML = '';
    const items = Array.from(document.querySelectorAll('.accordion-content li'));
    const filteredItems = items.filter(item => item.textContent.toLowerCase().includes(searchTerm));

    if (searchTerm && filteredItems.length > 0) {
        dropdown.style.display = 'block';
        filteredItems.forEach(item => {
            const clone = item.cloneNode(true);
            dropdown.appendChild(clone);

            clone.addEventListener("click", () => {
                const videoUrl = clone.getAttribute("data-url");

                if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
                    const youtubeId = videoUrl.includes("youtu.be")
                        ? videoUrl.split("/").pop()
                        : new URL(videoUrl).searchParams.get("v");

                    player.source = {
                        type: 'video',
                        sources: [{ src: youtubeId, provider: 'youtube' }]
                    };
                } else {
                    player.source = {
                        type: 'video',
                        sources: [{ src: videoUrl, type: 'video/mp4', size: 1080 }]
                    };
                }

                player.muted = false;
                player.play();
                dropdown.style.display = 'none';
            });
        });
    } else {
        dropdown.style.display = 'none';
    }
});

document.addEventListener('click', (e) => {
    const searchContainer = document.querySelector('.search-container');
    const dropdown = document.getElementById('search-dropdown');
    if (!searchContainer.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

let chartInstance = null; // To store the chart instance

function updateCompletionGraph() {
const completedClasses = JSON.parse(localStorage.getItem('completedClasses')) || [];
const totalClasses = document.querySelectorAll('.accordion-content li').length;

// Debugging information
console.log("Completed Classes:", completedClasses);
console.log("Total Classes:", totalClasses);

// Ensure completedClasses only contains valid items
const validCompletedClasses = completedClasses.filter(className => 
    [...document.querySelectorAll('.accordion-content li')].some(li => li.textContent.trim().split("\n")[0] === className)
);

// Re-save valid completedClasses to localStorage
localStorage.setItem('completedClasses', JSON.stringify(validCompletedClasses));

// Calculate completion rate safely
const completionRate = totalClasses > 0 ? Math.round((validCompletedClasses.length / totalClasses) * 100) : 0;

// Debugging information
console.log("Valid Completed Classes:", validCompletedClasses);
console.log("Calculated Completion Rate:", completionRate);

// Update percentage text
document.getElementById('progress-percentage').textContent = `Completion: ${completionRate}%`;

// Update the progress bar
document.getElementById('progress-bar').style.width = `${completionRate}%`;
}

function markCompleted(checkbox) {
const li = checkbox.closest('li');
const className = li.textContent.trim().split("\n")[0];

// Save the completion status to localStorage
let completedClasses = JSON.parse(localStorage.getItem('completedClasses')) || [];
if (checkbox.checked && !completedClasses.includes(className)) {
    completedClasses.push(className);
    li.classList.add('completed');
} else if (!checkbox.checked && completedClasses.includes(className)) {
    completedClasses = completedClasses.filter(cls => cls !== className);
    li.classList.remove('completed');
}
localStorage.setItem('completedClasses', JSON.stringify(completedClasses));

// Update the graph
updateCompletionGraph();
}

function showProgress() {
const completedClasses = JSON.parse(localStorage.getItem('completedClasses')) || [];
const totalClasses = document.querySelectorAll('.accordion-content li').length;
const pendingClasses = totalClasses - completedClasses.length;

// Ensure no negative values
const safePendingClasses = Math.max(pendingClasses, 0);

// Debugging information
console.log("Show Progress: Completed", completedClasses.length, "Pending", safePendingClasses);

// Show overlay and popup
document.getElementById('overlay').style.display = 'block';
document.getElementById('popup').style.display = 'block';

// Destroy existing chart instance if present
if (chartInstance) {
    chartInstance.destroy();
}

// Draw the chart
const ctx = document.getElementById('progress-chart').getContext('2d');
chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
        labels: [
            `Completed (${Math.round((completedClasses.length / totalClasses) * 100)}%)`, 
            `Pending (${Math.round((safePendingClasses / totalClasses) * 100)}%)`
        ],
        datasets: [{
            data: [completedClasses.length, safePendingClasses],
            backgroundColor: ['#3bfc00', '#f44336'],
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: 'top',
            }
        }
    }
});
}

// Function to download the chart
document.getElementById('download-btn').addEventListener('click', () => {
const canvas = document.getElementById('progress-chart');
const link = document.createElement('a');
link.download = 'progress-chart.png';
link.href = canvas.toDataURL('image/png');
link.click();
});

function closePopup() {
document.getElementById('overlay').style.display = 'none';
document.getElementById('popup').style.display = 'none';
}

// Load completed classes from localStorage and initialize the graph
document.addEventListener('DOMContentLoaded', () => {
const completedClasses = JSON.parse(localStorage.getItem('completedClasses')) || [];
document.querySelectorAll('.accordion-content li').forEach(item => {
    const className = item.textContent.trim().split("\n")[0];
    if (completedClasses.includes(className)) {
        item.querySelector('.mark-completed').checked = true;
        item.classList.add('completed');
    }
});

// Initialize the graph
updateCompletionGraph();
});

// Function to download the chart
document.getElementById('download-btn').addEventListener('click', () => {
const canvas = document.getElementById('progress-chart');
const link = document.createElement('a');
link.download = 'progress-chart.png';
link.href = canvas.toDataURL('image/png');
link.click();
});

