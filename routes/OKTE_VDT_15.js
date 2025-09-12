const express = require('express')
const router = express.Router()


const hodinove_OKTE_ceny = require('../models/H_data'); 
const qh_OKTE_ceny = require('../models/QH_data');

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

//   - Start of the router --HOME --

router.get('/',checkAuthenticated, async(req, res) => {

  let today = new Date();

  const formattedDate = today.toISOString().split('T')[0];
  let vyraz = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD

  try{

    const QH_data = await qh_OKTE_ceny.find(
      {qh_perioda: { $regex: `^${vyraz}` } }, // Filter condition
      {
        qh_perioda: 1,
        qh_num: 1,
        IDA1_cena: 1,
        IDA2_cena: 1,
        IDA3_cena: 1,
        DT_cena_DE15: 1,
        'vdt_data.OKTE_VDT_price_wavg': 1,
        'vdt_data.OKTE_VDT_price_max': 1,
        'vdt_data.OKTE_VDT_price_min': 1,
        'vdt_data.OKTE_VDT_nakup_obj': 1,
        'vdt_data.OKTE_VDT_predaj_obj': 1,
        utc_cas: 1,
      } // Projection: Include oh_perioda and DT_SK_cena, exclude _id

    ).sort({ qh_perioda: 1 });

    const DT_data = await hodinove_OKTE_ceny.find(
      { oh_perioda: { $regex: `^${vyraz}` } }, // Filter condition
      { oh_perioda: 1,
        DT_SK_cena: 1,
        'vdt_data.OKTE_VDT_price_wavg': 1
      } // Projection: Include oh_perioda and DT_SK_cena, exclude _id
    ).sort({ oh_perioda: 1 });


    const processedData = QH_data.map(qh => {

      const oh_key = qh.qh_perioda.slice(0,-3);   // Removes the last "-XX" qh part
      const matchingDT = DT_data.find(dt => dt.oh_perioda === oh_key);  // Find the matching DT_data entry

      return{

        perioda: qh.qh_num,
        IDA1_cena: qh.IDA1_cena ?? null, // Ensure a default value
        IDA2_cena: qh.IDA2_cena ?? null, // Ensure a default value
        IDA3_cena: qh.IDA3_cena ?? null, // Ensure a default value
        DT_cena_DE15: qh.DT_cena_DE15 ?? null, // Ensure a default value
        vdt_15_avg: matchingDT ? qh.vdt_data.OKTE_VDT_price_wavg : null, // Handle cases where no match is found
        vdt_15_min: matchingDT ? qh.vdt_data.OKTE_VDT_price_min : null, // Handle cases where no match is found
        vdt_15_max: matchingDT ? qh.vdt_data.OKTE_VDT_price_max : null, // Handle cases where no match is found
        vdt_15_nakup: matchingDT ? qh.vdt_data.OKTE_VDT_nakup_obj : null, // Handle cases where no match is found
        vdt_15_predaj: matchingDT ? qh.vdt_data.OKTE_VDT_predaj_obj : null, // Handle cases where no match is found
        DT_SK_cena: matchingDT ? matchingDT.DT_SK_cena : null, // Handle cases where no match is found
        vdt_60_avg: matchingDT ? matchingDT.vdt_data.OKTE_VDT_price_wavg : null, // Handle cases where no match is found
        utc_cas: formatUTCToCET(qh.utc_cas) ?? null, // Ensure a default value
      }

    });

    res.render('OKTE_VDT_15', { currentDay: formattedDate, dataJSON: processedData});

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

   try{

    const QH_data = await qh_OKTE_ceny.find(
      {qh_perioda: { $regex: `^${vyraz}` } }, // Filter condition
      {
        qh_perioda: 1,
        qh_num: 1,
        IDA1_cena: 1,
        IDA2_cena: 1,
        IDA3_cena: 1,
        DT_cena_DE15: 1,
        'vdt_data.OKTE_VDT_price_wavg': 1,
        'vdt_data.OKTE_VDT_price_max': 1,
        'vdt_data.OKTE_VDT_price_min': 1,
        'vdt_data.OKTE_VDT_nakup_obj': 1,
        'vdt_data.OKTE_VDT_predaj_obj': 1,
        utc_cas: 1,
      } // Projection: Include oh_perioda and DT_SK_cena, exclude _id

    ).sort({ qh_perioda: 1 });

    const DT_data = await hodinove_OKTE_ceny.find(
      { oh_perioda: { $regex: `^${vyraz}` } }, // Filter condition
      { oh_perioda: 1,
        DT_SK_cena: 1,
        'vdt_data.OKTE_VDT_price_wavg': 1
      } // Projection: Include oh_perioda and DT_SK_cena, exclude _id
    ).sort({ oh_perioda: 1 });


    const processedData = QH_data.map(qh => {

      const oh_key = qh.qh_perioda.slice(0,-3);   // Removes the last "-XX" qh part
      const matchingDT = DT_data.find(dt => dt.oh_perioda === oh_key);  // Find the matching DT_data entry

      return{

        perioda: qh.qh_num,
        IDA1_cena: qh.IDA1_cena ?? null, // Ensure a default value
        IDA2_cena: qh.IDA2_cena ?? null, // Ensure a default value
        IDA3_cena: qh.IDA3_cena ?? null, // Ensure a default value
        DT_cena_DE15: qh.DT_cena_DE15 ?? null, // Ensure a default value
        vdt_15_avg: matchingDT ? qh.vdt_data.OKTE_VDT_price_wavg : null, // Handle cases where no match is found
        vdt_15_min: matchingDT ? qh.vdt_data.OKTE_VDT_price_min : null, // Handle cases where no match is found
        vdt_15_max: matchingDT ? qh.vdt_data.OKTE_VDT_price_max : null, // Handle cases where no match is found
        vdt_15_nakup: matchingDT ? qh.vdt_data.OKTE_VDT_nakup_obj : null, // Handle cases where no match is found
        vdt_15_predaj: matchingDT ? qh.vdt_data.OKTE_VDT_predaj_obj : null, // Handle cases where no match is found
        DT_SK_cena: matchingDT ? matchingDT.DT_SK_cena : null, // Handle cases where no match is found
        vdt_60_avg: matchingDT ? matchingDT.vdt_data.OKTE_VDT_price_wavg : null, // Handle cases where no match is found
        utc_cas: formatUTCToCET(qh.utc_cas) ?? null, // Ensure a default value
      }

    });

      res.json({  currentDay: formattedDate,
                dataJSON: processedData }); // render data as JSON

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