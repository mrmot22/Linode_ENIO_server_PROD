const express = require('express')
const router = express.Router()

const DT_OKTE_ceny = require('../models/H_data')

//   - Start of the router --HOME -- 


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

router.get('/',checkAuthenticated, async(req, res) => {

  const today = new Date();
  const tomorrow = new Date(today);
  let currentHours = today.getHours();
  let currentMinutes = today.getMinutes();

  if (currentHours >= 11) {                       // hodina 13. pre linode server

    tomorrow.setDate(today.getDate() + 1)

  } else {

    tomorrow.setDate(today.getDate() + 0);

  }

  const formattedDate = tomorrow.toISOString().split('T')[0];
  let nieco = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD

  try {


    let query = { oh_perioda: {$gte: nieco, $lt: nieco + '\uffff' }}; // Filter condition

    const OKTE_data = await DT_OKTE_ceny.find(query,

      { oh_perioda: 1,
        DT_SK_cena: 1,
        DT_CZ_cena: 1,
        DT_DE_cena: 1,
        DT_HU_cena: 1,
        DT_PL_cena: 1,
        utc_cas: 1,
      }

    ).sort({ oh_perioda: 1 });

    // Process the data to include the extracted period number
    const processedData = OKTE_data.map(item => ({
      perioda: item.oh_perioda.slice(-2), // Extract last two characters
      cena_SK: item.DT_SK_cena ?? null, // Ensure a default value
      cena_CZ: item.DT_CZ_cena ?? null, // Ensure a default value
      cena_DE: item.DT_DE_cena ?? null, // Ensure a default value
      cena_HU: item.DT_HU_cena ?? null, // Ensure a default value
      cena_PL: item.DT_PL_cena ?? null, // Ensure a default value
      utc_cas: formatUTCToCET(item.utc_cas) ?? null // Ensure a default value
    
    }));

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
  let nieco = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD

  //console.log('Using formattedDate:', formattedDate);

  try {


    let query = { oh_perioda: {$regex: `^${nieco}`} }; // Filter condition

    const OKTE_data = await DT_OKTE_ceny.find(query,


      { oh_perioda: 1,
        DT_SK_cena: 1,
        DT_CZ_cena: 1,
        DT_DE_cena: 1,
        DT_HU_cena: 1,
        DT_PL_cena: 1,
        utc_cas: 1,
      }

    ).sort({ oh_perioda: 1 });
  
    const processedData = OKTE_data.map(item => ({
      perioda: item.oh_perioda.slice(-2), // Extract last two characters
      cena_SK: item.DT_SK_cena ?? null, // Ensure a default value
      cena_CZ: item.DT_CZ_cena ?? null, // Ensure a default value
      cena_DE: item.DT_DE_cena ?? null, // Ensure a default value
      cena_HU: item.DT_HU_cena ?? null, // Ensure a default value
      cena_PL: item.DT_PL_cena ?? null, // Ensure a default value
      utc_cas: formatUTCToCET(item.utc_cas) ?? null // Ensure a default value
    }));

    res.json({  currentDay: formattedDate,
                dataJSON: processedData }); // Render index.ejs and pass the data

  } catch (err) {

    console.error('Error fetching data:', err);
    res.status(500).send('Internal Server Error');
  
  }

})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
  }   

module.exports = router