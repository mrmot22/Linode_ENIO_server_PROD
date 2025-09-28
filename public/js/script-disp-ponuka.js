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

    const selectElement = document.getElementById('myListBox_ponuka');
    if (selectElement && selectElement.options.length > 0) {
        selectElement.selectedIndex = 0;
    }

    document.getElementById('ponukaFinder').value = "ponuka_01"

    let currentPonuka = document.getElementById('ponukaFinder').value
    let currentSluzba = document.getElementById('sluzbaFinder').value

    debouncedLoadData(newDate, currentPonuka, currentSluzba);

};

function navigate(direction) {
    const dateInput = document.getElementById('currentDay');


    const selectElement = document.getElementById('myListBox_ponuka');
    if (selectElement && selectElement.options.length > 0) {
        selectElement.selectedIndex = 0;
    }

    document.getElementById('ponukaFinder').value = "ponuka_01"

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
    
    console.log('New Date:', newDate);
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

     if(data.ponukyList) {


        const akt_ponuka = data.akt_ponuka;
        const ponuky = data.ponukyList;

        aktualizujList(ponuky, akt_ponuka);


     }
}


function aktualizujList(optionsArray, value){

    const selectElement = document.getElementById('myListBox_ponuka');
    selectElement.innerHTML = '';

    console.log(optionsArray);
    console.log(value);

    optionsArray.forEach((optionValue, index) => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        
        // If option value matches the provided value, set as selected
        if (optionValue === value) {
            option.selected = true;
        }
        
        selectElement.appendChild(option);
    });
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
            <td class="timestamp">${item.qh_num}</td>
            <td class="timestamp">${item.cas}</td>
            <td>${item.disp_min !== null && item.disp_min !== undefined ? item.disp_min.toFixed(2) : 'N/A'}</td>
            <td>${item.disp_max !== null && item.disp_max !== undefined ? item.disp_max.toFixed(2) : 'N/A'}</td>
            <td>${item.disp_wavg !== null && item.disp_wavg !== undefined ? item.disp_wavg.toFixed(2) : 'N/A'}</td>
            <td>${item.quantity !== null && item.quantity !== undefined ? item.quantity.toFixed(2) : 'N/A'}</td>
            <td>${item.price !== null && item.price !== undefined ? item.price.toFixed(2) : 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updateCharts(data) {   

    if (window.myChart1) {


        window.myChart1.data.labels = data.map(item => item.cas);
        window.myChart1.data.datasets[0].data = data.map(item => item.price ?? null);
        window.myChart1.data.datasets[1].data = data.map(item => item.disp_wavg  ?? null);
        window.myChart1.data.datasets[2].data = data.map(item => item.disp_min ?? null);
        window.myChart1.data.datasets[3].data = data.map(item => item.disp_max ?? null);

        window.myChart1.update();

    }
    
    if (window.myChart2) {
        window.myChart2.data.labels = data.map(item => item.cas);
        window.myChart2.data.datasets[0].data = data.map(item => item.quantity ?? null);
        window.myChart2.data.datasets[1].data = data.map(item => item.offers_spolu ?? null);

        window.myChart2.update();
    
    }
};

