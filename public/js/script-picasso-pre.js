function toggleNav() {
    const navPanel = document.getElementById("nav-panel");
    navPanel.classList.toggle("active");
}

function hideNav() {
    const navPanel = document.getElementById("nav-panel");
    navPanel.classList.remove("active");
}

// Prevent form submission entirely
document.getElementById('dateForm').addEventListener('submit', function(event) {
    event.preventDefault();
});

const debouncedLoadData = debounce(loadDataForDay, 300);

const dateInput = document.getElementById('currentDay');
dateInput.addEventListener('change', () => {
    const selectedDate = dateInput.value;
    const selectedSmer = document.getElementById('smer').value;
    if (selectedDate) {
        debouncedLoadData(selectedDate, selectedSmer);
    }
});

function toggleCheckbox(checkbox_meno) {

    const dateInput = document.getElementById('currentDay');
    const smer = document.getElementById('smer');
    let newSmer = smer.value;

    if(checkbox_meno == "checkbox_pos"){

        document.getElementById('checkbox_neg').checked = false;
        newSmer = "POS";


    } else {

        document.getElementById('checkbox_pos').checked = false;
        newSmer = "NEG";

    }


    let currentDate = new Date(dateInput.value);
    const newDate = currentDate.toISOString().split('T')[0];

    debouncedLoadData(newDate, newSmer);

};

function navigate(direction) {
    const dateInput = document.getElementById('currentDay');
    const smer = document.getElementById('smer').value;
    
    if (!dateInput.value) {
        console.error('No date selected');
        return;
    }
    
    let currentDate = new Date(dateInput.value);
    
    if (isNaN(currentDate.getTime())) {
        console.error('Invalid date:', dateInput.value);
        return;
    }
    

    if (direction === 'forward') {
        currentDate.setDate(currentDate.getDate() + 1);
    } else if (direction === 'backward') {
        currentDate.setDate(currentDate.getDate() - 1);
    } else {
        console.error('Unknown direction:', direction);
        return;
    }
    
    const newDate = currentDate.toISOString().split('T')[0];
    
    console.log('New Date:', newDate, " Smer:", smer);
    debouncedLoadData(newDate, smer);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

let isInitialLoad = true;

async function loadDataForDay(date, smer) {
    console.log('Requesting data for date:', date, " smer:", smer);
    
    // Skip initial load if we already loaded data manually
    if (isInitialLoad && date === document.getElementById('currentDay').value
        && smer === document.getElementById("smer").value){

        console.log("Pozadujem data pre den:", date, "Aktualny den:", document.getElementById('currentDay').value);
        console.log("Pozadujem data pre smer:", smer, "Aktualny smer:", document.getElementById('smer').value)
        console.log('Skipping initial load - data already loaded');
        isInitialLoad = false;
        return;
    }
    
    isInitialLoad = false;
    
    try {
        const response = await fetch('/PI-prehlad/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentDay: date,
                smer: smer,
            })
        });
        
        if (!response.ok) {
            throw new Error('Server error: ' + response.status);
        }
        
        const newData = await response.json();
        
        updatePageWithData(newData);
        console.log('Data successfully loaded for date:', date);
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function updatePageWithData(data) {
    // Update your charts and other elements here
    if (data.dataJSON ) {
        updateCaption(data.smer);
        updateTablebody(data.dataJSON);
        updateChart(data.dataJSON);
    }

    if (data.currentDay) {
        document.getElementById('currentDay').value = data.currentDay;
     }

     if(data.smer) {
        document.getElementById('smer').value = data.smer;
     }
}

function startAutoRefresh() {
    const canvas = document.getElementById("circle");
    const ctx = canvas.getContext("2d");
    const radius = 14;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const duration = 15 * 60 * 1000; // 15 minutes

    let startTime = Date.now(); // Changed to let so it can be reassigned

    function drawCircle(fraction) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Outline circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = "green";
        ctx.stroke();

        // Green arc (clockwise shrinking)
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(
            centerX,
            centerY,
            radius,
            -Math.PI / 2,                          // start at top
            -Math.PI / 2 - 2 * Math.PI * fraction, // clockwise
            true                                   // force clockwise
        );
        ctx.closePath();
        ctx.fillStyle = "green";
        ctx.fill();
    }

    function update() {
        let elapsed = Date.now() - startTime;
        let fraction = 1 - elapsed / duration; // goes from 1 → 0

        if (fraction <= 0) {
            const initialDate = document.getElementById('currentDay').value;
            const initialSmer = document.getElementById('smer').value;
            
            if (initialDate) {
                loadDataForDay(initialDate, initialSmer);
            }
            
            // Reset the timer
            startTime = Date.now();
            fraction = 1;
        }
        
        drawCircle(fraction);
        requestAnimationFrame(update);
    }

    drawCircle(1); // full at start
    requestAnimationFrame(update);
}



// Load initial data when page loads
document.addEventListener('DOMContentLoaded', function() {
    const initialDate = document.getElementById('currentDay').value;
    const initialSmer = document.getElementById('smer').value;

    if (initialDate) {
        loadDataForDay(initialDate, initialSmer);
        
    }

    startAutoRefresh();
});

function updateCaption(smer) {

    const nadpis = document.getElementById('smer-nadpis');
    
    if (smer === "POS"){

        nadpis.innerHTML = 'Prehľad cien PICASSO - Kladná RE';
    } else {

        nadpis.innerHTML = 'Prehľad cien PICASSO - Záporná RE';
    }

};

function updateTablebody(data) {

    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = ''; // Clear existing rows
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="timestamp">${item.qh_num}</td>
            <td class="timestamp">${item.perioda}</td>
            <td>${item.cena_min !== null && item.cena_min !== undefined ? item.cena_min.toFixed(2) : 'N/A'}</td>
            <td>${item.cena_max !== null && item.cena_max !== undefined ? item.cena_max.toFixed(2) : 'N/A'}</td>
            <td>${item.cena_avg !== null && item.cena_avg !== undefined ? item.cena_avg.toFixed(2) : 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
};

function updateChart(data) {

    if (window.myChart) {

        window.myChart.data.labels = data.map(item => item.perioda);
        window.myChart.data.datasets[0].data = data.map(item => item.cena_min ?? null);
        window.myChart.data.datasets[1].data = data.map(item => item.cena_max ?? null);
        window.myChart.data.datasets[2].data = data.map(item => item.cena_avg ?? null);

        window.myChart.update();

    }

};