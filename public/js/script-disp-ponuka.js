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

function zmenaPonuky(event) {
    const selectedValue = event.target.value;

    document.getElementById('ponukaFinder').value = selectedValue;

    let currentDate = new Date(dateInput.value);
    const newDate = currentDate.toISOString().split('T')[0];

    let currentPonuka = document.getElementById('ponukaFinder').value
    let currentSluzba = document.getElementById('sluzbaFinder').value

    console.log("Menim ponuku", currentPonuka);

    debouncedLoadData(newDate, currentPonuka, currentSluzba);

};


function zmenaSluzby(event) {
    
    const selectedValue = event.target.value;

    document.getElementById('sluzbaFinder').value = selectedValue;

    let currentDate = new Date(dateInput.value);
    const newDate = currentDate.toISOString().split('T')[0];

    let currentPonuka = document.getElementById('ponukaFinder').value
    let currentSluzba = document.getElementById('sluzbaFinder').value

    console.log("Menim sluzbu", currentSluzba);

    debouncedLoadData(newDate, currentPonuka, currentSluzba);

};

function navigate(direction) {
    const dateInput = document.getElementById('currentDay');
    const ponuka = document.getElementById('ponukaFinder').value;
    const sluzba = document.getElementById('sluzbaFinder').value;


    
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
    debouncedLoadData(newDate, ponuka, sluzba);
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

async function loadDataForDay(date, ponuka, sluzba) {
    console.log('Requesting data for date:', date);

    
    // Skip initial load if we already loaded data manually
    if (isInitialLoad && date === document.getElementById('currentDay').value
        && ponuka === document.getElementById('ponukaFinder').value
        && sluzba === document.getElementById('sluzbaFinder').value
        
    )
        
        {
        console.log('Skipping initial load - data already loaded');
        
 
        isInitialLoad = false;
        return;
    }
    
    isInitialLoad = false;
    
    try {
        const response = await fetch('/DISP-ponuky/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentDay: date,
                ponuka: ponuka,
                sluzba: sluzba

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
    // Refresh immediately, then every 15 minutes (900,000 milliseconds)
    
    setInterval(() => {
        const currentDate = document.getElementById('currentDay').value;
        console.log('Auto-refreshing data at:', new Date().toLocaleTimeString());
        loadDataForDay(currentDate);
    }, 15 * 60 * 1000); // 15 minutes in milliseconds
}



// Load initial data when page loads
document.addEventListener('DOMContentLoaded', function() {
    const initialDate = document.getElementById('currentDay').value;
    const ponuka = document.getElementById('ponukaFinder').value
    const sluzba = document.getElementById('sluzbaFinder').value
    if (initialDate && ponuka && sluzba) {
        loadDataForDay(initialDate, ponuka, sluzba);
        
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
            <td>${item.DT_SK_cena  !== null && item.DT_SK_cena  !== undefined ? item.DT_SK_cena.toFixed(2) : 'N/A'}</td>
            <td>${item.DT_cena_DE15 !== null && item.DT_cena_DE15 !== undefined ? item.DT_cena_DE15.toFixed(2) : 'N/A'}</td>
            <td>${item.IDA1_cena !== null && item.IDA1_cena !== undefined ? item.IDA1_cena.toFixed(2) : 'N/A'}</td>
            <td>${item.IDA2_cena !== null && item.IDA2_cena !== undefined ? item.IDA2_cena.toFixed(2) : 'N/A'}</td>
            <td>${item.IDA3_cena !== null && item.IDA3_cena !== undefined ? item.IDA3_cena.toFixed(2) : 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updateCharts(data) {   

    if (window.myChart1) {


        window.myChart1.data.labels = data.map(item => item.perioda);
        window.myChart1.data.datasets[0].data = data.map(item => item.IDA1_cena ?? null);
        window.myChart1.data.datasets[1].data = data.map(item => item.IDA2_cena  ?? null);
        window.myChart1.data.datasets[2].data = data.map(item => item.IDA3_cena ?? null);
        window.myChart1.data.datasets[3].data = data.map(item => item.DT_cena_DE15 ?? null);
        window.myChart1.data.datasets[4].data = data.map(item => item.DT_SK_cena ?? null);

        window.myChart1.update();

    }
    
    if (window.myChart2) {
        window.myChart2.data.labels = data.map(item => item.perioda);
        window.myChart2.data.datasets[0].data = data.map(item => item.IDA1_nakup ?? null);
        window.myChart2.data.datasets[1].data = data.map(item => item.IDA1_predaj * -1 ?? null);
        window.myChart2.data.datasets[2].data = data.map(item => item.IDA2_nakup ?? null);
        window.myChart2.data.datasets[3].data = data.map(item => item.IDA2_predaj * -1 ?? null);
        window.myChart2.data.datasets[4].data = data.map(item => item.IDA3_nakup ?? null);
        window.myChart2.data.datasets[5].data = data.map(item => item.IDA3_predaj * -1 ?? null);
        window.myChart2.update();
    
    }
};

