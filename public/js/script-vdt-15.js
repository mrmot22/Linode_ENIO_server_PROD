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
    if (selectedDate) {
        debouncedLoadData(selectedDate);
    }
});

function navigate(direction) {
    const dateInput = document.getElementById('currentDay');
    
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
    console.log('New Date:', newDate);
    
    dateInput.value = newDate;
    debouncedLoadData(newDate);
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

async function loadDataForDay(date) {
    console.log('Requesting data for date:', date);
    
    // Skip initial load if we already loaded data manually
    if (isInitialLoad && date === document.getElementById('currentDay').value) {
        console.log('Skipping initial load - data already loaded');
        isInitialLoad = false;
        return;
    }
    
    isInitialLoad = false;
    
    try {
        const response = await fetch('/VDT-15/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentDay: date,
            })
        });
        
        if (!response.ok) {
            throw new Error('Server error: ' + response.status);
        }
        
        const newData = await response.json();
     //   console.log('Data received:', newData);
        
        updatePageWithData(newData);
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

 function updatePageWithData(data) {
    // Update your charts and other elements here
    if (data.dataJSON ) {
        updateTablebody(data.dataJSON);
        updateCharts(data.dataJSON);
    }

    if (data.currentDay) {
        document.getElementById('currentDay').value = data.currentDay;
     }
}

function startAutoRefresh() {
    const canvas = document.getElementById("circle");
    const ctx = canvas.getContext("2d");
    const radius = 14;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const duration = 15 * 60 * 1000; // 15 seconds

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
            
            if (initialDate) {
                loadDataForDay(initialDate);
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
    if (initialDate) {
        loadDataForDay(initialDate);
        
    }

    startAutoRefresh();
});

function updateTablebody(data) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = ''; // Clear existing rows
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="timestamp">${item.perioda}</td>
            <td class="timestamp">${item.utc_cas}</td>
            <td>${item.DT_SK_cena  !== null && item.DT_SK_cena  !== undefined ? item.DT_SK_cena.toFixed(2) : 'N/A'}</td>
            <td>${item.vdt_15_min !== null && item.vdt_15_min !== undefined ? item.vdt_15_min.toFixed(2) : 'N/A'}</td>
            <td>${item.vdt_15_max !== null && item.vdt_15_max !== undefined ? item.vdt_15_max.toFixed(2) : 'N/A'}</td>
            <td>${item.vdt_15_avg !== null && item.vdt_15_avg !== undefined ? item.vdt_15_avg.toFixed(2) : 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updateCharts(data) {   

    if (window.myChart1) {

        window.myChart1.data.labels = data.map(item => item.perioda);
        window.myChart1.data.datasets[0].data = data.map(item => item.vdt_15_avg ?? null);
        window.myChart1.data.datasets[1].data = data.map(item => item.vdt_60_avg  ?? null);
        window.myChart1.data.datasets[2].data = data.map(item => item.DT_SK_cena ?? null);
        window.myChart1.data.datasets[3].data = data.map(item => item.IDA1_cena ?? null);
        window.myChart1.data.datasets[4].data = data.map(item => item.IDA2_cena ?? null);
        window.myChart1.data.datasets[5].data = data.map(item => item.IDA3_cena ?? null);
        window.myChart1.data.datasets[6].data = data.map(item => item.DT_cena_DE15 ?? null);
        window.myChart1.data.datasets[7].data = data.map(item => item.vdt_15_min ?? null);
        window.myChart1.data.datasets[8].data = data.map(item => item.vdt_15_max ?? null);

        const { maximalna_cena, minimalna_cena } = vypocitajOsy(data);

        window.myChart1.options.scales.y.max = maximalna_cena;
        window.myChart1.options.scales.y.min = minimalna_cena;
        window.myChart1.update();

        }
    
    if (window.myChart2) {
        window.myChart2.data.labels = data.map(item => item.perioda);
        window.myChart2.data.datasets[0].data = data.map(item => item.vdt_15_nakup ?? null);
        window.myChart2.data.datasets[1].data = data.map(item => item.vdt_15_predaj * -1 ?? null);
        window.myChart2.update();
    
    }};


function vypocitajOsy(data) {

    const IDA1_cena = data.map(item => item.IDA1_cena ?? null);
    const IDA2_cena = data.map(item => item.IDA2_cena ?? null);
    const IDA3_cena = data.map(item => item.IDA3_cena ?? null);
    const DE_cena = data.map(item => item.DT_cena_DE15 ?? null);
    const vdt_15_max  = data.map(item => item.vdt_15_max ?? null);
    const vdt_15_min  = data.map(item => item.vdt_15_min ?? null);  

    let kombinovany_array = [...IDA1_cena, ...IDA2_cena, ...IDA3_cena, ...DE_cena];
    maximalna_cena = Math.max(...kombinovany_array);
    minimalna_cena = Math.min(...kombinovany_array);


    if (maximalna_cena > 500) {

        maximalna_cena = 500;

    } else {

        maximalna_cena = Math.ceil(maximalna_cena / 100) * 100; // Round up to nearest 100
    }


    if (minimalna_cena < -500) {

         minimalna_cena = -500;

    } else {

        minimalna_cena = Math.floor(minimalna_cena / 100) * 100; // Round down to nearest 100
    }

    if (maximalna_cena < Math.ceil(Math.max(...vdt_15_max) / 100) * 100) {

        maximalna_cena = Math.ceil(Math.max(...vdt_15_max) / 100) * 100; // Round up to nearest 100

    }

    if (minimalna_cena > Math.floor(Math.min(...vdt_15_min) / 100) * 100) {

        minimalna_cena = Math.floor(Math.min(...vdt_15_min) / 100) * 100; // Round down to nearest 100  

    }

    return {maximalna_cena, minimalna_cena}
    
};

