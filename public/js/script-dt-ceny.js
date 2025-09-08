// Prevent form submission entirely
document.getElementById('dateForm').addEventListener('submit', function(event) {
    event.preventDefault();
});

function navigate(direction) {
    const dateInput = document.getElementById('currentDay');
    
    // Check if date input has a valid value
    if (!dateInput.value) {
        console.error('No date selected');
        return;
    }
    
    let currentDate = new Date(dateInput.value);
    
    // Check if date is valid
    if (isNaN(currentDate.getTime())) {
        console.error('Invalid date:', dateInput.value);
        return;
    }
    
    console.log('Current Date:', currentDate, 'Direction:', direction)
    if (direction === 'forward') {
        currentDate.setDate(currentDate.getDate() + 1);
    } else if (direction === 'backward') {
        currentDate.setDate(currentDate.getDate() - 1);
    } else {
        console.error('Unknown direction:', direction);
        return;
    }
    
    // Format date as YYYY-MM-DD
    const newDate = currentDate.toISOString().split('T')[0];
    console.log('New Date:', newDate);
    
    dateInput.value = newDate;
    
    // Load data for the new date
    loadDataForDay(newDate);
}
const dateInput = document.getElementById('currentDay');
dateInput.addEventListener('change', () => {
    const selectedDate = dateInput.value;
    if (selectedDate) {
        loadDataForDay(selectedDate);
    }
});


async function loadDataForDay(date) {

    
    try {
        // Send POST request to your server endpoint
        const response = await fetch('/DT-ceny/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentDay: date,
                // Add other necessary data like smer if needed
            })
        });
        
        if (!response.ok) {
            throw new Error('Server error: ' + response.status);
        }
        
        const newData = await response.json();
        console.log('Data received:', newData);
        
        // Update your page with the new data
        updatePageWithData(newData);
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

 function updatePageWithData(data) {
    // Update your charts and other elements here
    if (data.dataJSON ) {
        updateTablebody(data.dataJSON);
        updateChart(data.dataJSON);
    }

    if (data.currentDay) {
        document.getElementById('currentDay').value = data.currentDay;
     }
}

// Load initial data when page loads
document.addEventListener('DOMContentLoaded', function() {
    const initialDate = document.getElementById('currentDay').value;
    if (initialDate) {
        loadDataForDay(initialDate);
    }
});

function updateTablebody(data) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = ''; // Clear existing rows
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="timestamp">${item.perioda}</td>
            <td class="timestamp">${item.utc_cas}</td>
            <td>${item.cena_SK !== null && item.cena_SK !== undefined ? item.cena_SK.toFixed(2) : 'N/A'}</td>
            <td>${item.cena_CZ !== null && item.cena_CZ !== undefined ? item.cena_CZ.toFixed(2) : 'N/A'}</td>
            <td>${item.cena_DE !== null && item.cena_DE !== undefined ? item.cena_DE.toFixed(2) : 'N/A'}</td>
            <td>${item.cena_HU !== null && item.cena_HU !== undefined ? item.cena_HU.toFixed(2) : 'N/A'}</td>
            <td>${item.cena_PL !== null && item.cena_PL !== undefined ? item.cena_PL.toFixed(2) : 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updateChart(data) {

    if (window.myChart) {
        // Update existing chart data
        window.myChart.data.labels = data.map(item => item.perioda);
        window.myChart.data.datasets[0].data = data.map(item => item.cena_SK);
        window.myChart.data.datasets[1].data = data.map(item => item.cena_CZ);
        window.myChart.data.datasets[2].data = data.map(item => item.cena_DE);
        window.myChart.data.datasets[3].data = data.map(item => item.cena_HU);
        window.myChart.data.datasets[4].data = data.map(item => item.cena_PL);
        
        // Update the chart
        window.myChart.update();

}};


function toggleNav() {
    const navPanel = document.getElementById("nav-panel");
    navPanel.classList.toggle("active");
}

function hideNav() {
    const navPanel = document.getElementById("nav-panel");
    navPanel.classList.remove("active");
}


function formatTimeRange(timeStr) {
            
            
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    
    // Extract the hour part
    const hour = parseInt(timeStr.split(':')[0]);
            
    // Calculate next hour (handling 23 -> 24 case)
    const nextHour = hour === 23 ? 24 : hour + 1;
            
            // Format both hours with leading zeros
    const currentHourFormatted = String(hour).padStart(2, '0') + ':00';
    const nextHourFormatted = String(nextHour).padStart(2, '0') + ':00';
    
    return `${currentHourFormatted} - ${nextHourFormatted}`;
}