const express = require('express')
const router = express.Router()

const DT_OKTE_ceny = require('../models/H_data')
const QH_DT_ceny = require('../models/QH_data')


//   - Start of the router --HOME -- 

router.get('/',checkAuthenticated, async(req, res) => {

  const today = new Date();
  const tomorrow = new Date(today);
  let currentHours = today.getHours();

  if (currentHours >= 11) {                       // hodina 13. pre linode server
    tomorrow.setDate(today.getDate() + 1)
  } else {
    tomorrow.setDate(today.getDate() + 0);
  }

  const formattedDate = tomorrow.toISOString().split('T')[0];
  let vyraz = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD

  try {

    const processedData = await fetchData_new(vyraz);
    console.log(processedData);
    res.render('DT_ceny', { currentDay: formattedDate, dataJSON: processedData }); // Render index.ejs and pass the data

  } catch (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Internal Server Error');
  }


})  

router.post('/data',checkAuthenticated, async(req,res) => {

  const { currentDay } = req.body;

    if (!currentDay) {
        return res.status(400).json({ error: 'Date is required' });
    }
    
    const targetDate = new Date(currentDay);

    if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date' });
    }
    

  const formattedDate = targetDate.toISOString().split('T')[0];
  let vyraz = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD

  const NewWordOrder = new Date("2025-10-01");

  if (targetDate < NewWordOrder){

    try {

      const processedData = await fetchData_old(vyraz);
      res.json({  currentDay: formattedDate,
                  dataJSON: processedData }); // Render index.ejs and pass the data

    } catch (err) {

      console.error('Error fetching data:', err);
      res.status(500).send('Internal Server Error');
  
    }
  } else {

    try {

      const processedData = await fetchData_new(vyraz);
      res.json({  currentDay: formattedDate,
                  dataJSON: processedData }); // Render index.ejs and pass the data

    } catch (err) {

      console.error('Error fetching data:', err);
      res.status(500).send('Internal Server Error');
  
    }

  }

})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}   

function formatUTCToCET(utcDateString) {

  if (!utcDateString) return null;
  const date = new Date(utcDateString);
  return date.toLocaleTimeString('sk-SK', {
    timeZone: 'Europe/Bratislava',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

async function fetchData_old(vyraz) {

  let query = { oh_perioda: {$gte: vyraz, $lt: vyraz + '\uffff' }}; // Filter condition
  const OKTE_data = await DT_OKTE_ceny.find(query,

    { oh_perioda: 1,
      'DT_data.DT_SK_cena': 1,
      'DT_data.DT_CZ_cena': 1,
      'DT_data.DT_DE_cena': 1,
      'DT_data.DT_HU_cena': 1,
      'DT_data.DT_PL_cena': 1,
      utc_cas: 1,
    }
  ).sort({ oh_perioda: 1 });


  query = { oh_perioda: {$gte: vyraz, $lt: vyraz + '\uffff' }}; // Filter condition
  const PL_data = await DT_OKTE_ceny.find(query,   
    { oh_perioda: 1, 
      'DT_data.DT_PL_cena': 1}).sort({ oh_perioda: 1 });  // Projection: Include oh_perioda and DT_SK_cena, exclude _id

      // Process the data to include the extracted period number
  return processedData  = OKTE_data.map(item => ({
    perioda: item.oh_perioda.slice(-2), // Extract last two characters
    cena_SK: item.DT_data.DT_SK_cena ?? null, // Ensure a default value
    cena_CZ: item.DT_data.DT_CZ_cena ?? null, // Ensure a default value
    cena_DE: item.DT_data.DT_DE_cena ?? null, // Ensure a default value
    cena_HU: item.DT_data.DT_HU_cena ?? null, // Ensure a default value
    cena_PL: item.DT_data.DT_PL_cena ?? null, // Ensure a default value
    utc_cas: formatUTCToCET(item.utc_cas) ?? null // Ensure a default value
      
  }));


}

async function fetchData_new(vyraz) {

  let query = { qh_perioda: {$gte: vyraz, $lt: vyraz + '\uffff' }}; // Filter condition
  const OKTE_data = await QH_DT_ceny.find(query,

    { qh_num: 1,
      qh_perioda: 1,
      'dt_data.DT_SK_cena': 1,
      'dt_data.DT_CZ_cena': 1,
      'dt_data.DT_DE_cena': 1,
      'dt_data.DT_HU_cena': 1,
      utc_cas: 1,
    }
  ).sort({ qh_num: 1 });

  query = { oh_perioda: {$gte: vyraz, $lt: vyraz + '\uffff' }}; // Filter condition
  const PL_data = await DT_OKTE_ceny.find(query,   
    { oh_perioda: 1, 
      'DT_data.DT_PL_cena': 1}).sort({ oh_perioda: 1 });  // Projection: Include oh_perioda and DT_SK_cena, exclude _id

  return processedData = OKTE_data.map(qh => {

    const oh_key = qh.qh_perioda.slice(0,-3);   // Removes the last "-XX" qh part
    const matchingDT = PL_data.find(dt => dt.oh_perioda === oh_key);  // Find the matching DT_data entry

    return{

      perioda: qh.qh_num ?? null, // Ensure a default value
      cena_SK: qh.dt_data.DT_SK_cena ?? null, // Ensure a default value
      cena_CZ: qh.dt_data.DT_CZ_cena ?? null, // Ensure a default value
      cena_DE: qh.dt_data.DT_DE_cena ?? null, // Ensure a default value
      cena_HU: qh.dt_data.DT_HU_cena ?? null, // Ensure a default value
      utc_cas: formatUTCToCET(qh.utc_cas) ?? null, // Ensure a default value
      cena_PL: matchingDT ? matchingDT.DT_data.DT_PL_cena : null // Handle cases where no match is found
    }


  });


}

module.exports = router