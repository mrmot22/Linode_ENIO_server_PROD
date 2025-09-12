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

function toggleCheckbox(checkbox_meno) {

    if(checkbox_meno == "checkbox_pos"){

        document.getElementById('checkbox_neg').checked = false;
        document.getElementById('smer').value = "POS";

    } else {

        document.getElementById('checkbox_pos').checked = false;
        document.getElementById('smer').value = "NEG";

    }
};

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

async function loadDataForDay(date, smer) {
    console.log('Requesting data for date:', date);
    
    // Skip initial load if we already loaded data manually
    if (isInitialLoad && date === document.getElementById('currentDay').value) {
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
                smer: document.getElementById('smer').value
            })
        });
        
        if (!response.ok) {
            throw new Error('Server error: ' + response.status);
        }
        
        const newData = await response.json();
     //   console.log('Data received:', newData);
        
        updatePageWithData(newData);
        console.log('Data successfully loaded for date:', date);
        
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
}

function updateChart(data) {

        if (window.myChart) {

            window.myChart.data.labels = data.map(item => item.perioda);
            window.myChart.data.datasets[0].data = data.map(item => item.cena_min ?? null);
            window.myChart.data.datasets[1].data = data.map(item => item.cena_max ?? null);
            window.myChart.data.datasets[2].data = data.map(item => item.cena_avg ?? null);

            window.myChart.update();

        }

    }