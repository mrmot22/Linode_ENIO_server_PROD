const express = require('express')
const router = express.Router()



const QH_OKTE_odch = require('../models/QH_data');
const DT_OKTE_ceny = require('.././models/H_data'); 


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

  let today = new Date();
  let yesterday = new Date(today);
  let currentHours = today.getHours();

  if (currentHours < 9) {

    yesterday.setDate(today.getDate() - 2)

  } else {

    yesterday.setDate(today.getDate() - 1)

  }


  const formattedDate = yesterday.toISOString().split('T')[0];
  let vyraz = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD


  try{

    const QH_data = await QH_OKTE_odch.find(
      {qh_perioda: { $regex: `^${vyraz}` } }, // Filter condition
      {qh_perioda: 1, qh_num: 1, cena_odch: 1, sys_odch: 1, utc_cas: 1 } // Projection: Include oh_perioda and DT_SK_cena, exclude _id

    ).sort({ qh_perioda: 1 });

    const DT_data = await DT_OKTE_ceny.find(
      { oh_perioda: { $regex: `^${vyraz}` } }, // Filter condition
      { oh_perioda: 1,
        'DT_data.DT_SK_cena': 1 } // Projection: Include oh_perioda and DT_SK_cena, exclude _id
    ).sort({ oh_perioda: 1 });

    const processedData = QH_data.map(qh => {

      const oh_key = qh.qh_perioda.slice(0,-3);   // Removes the last "-XX" qh part
      const matchingDT = DT_data.find(dt => dt.oh_perioda === oh_key);  // Find the matching DT_data entry

      return{

        perioda: qh.qh_num,
        cena_odch: qh.cena_odch ?? null, // Ensure a default value
        sys_odch: qh.sys_odch ?? null, // Ensure a default value
        DT_SK_cena: matchingDT ? matchingDT.DT_data.DT_SK_cena : null, // Handle cases where no match is found
        utc_cas: formatUTCToCET(qh.utc_cas) ?? null // Ensure a default value

      }

    });

    res.render('DT_vs_Odch', { currentDay: formattedDate, dataJSON: processedData});

  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Internal Server Error');
  }


});


router.post('/',checkAuthenticated, async(req,res) => {

  const { direction, currentDay } = req.body;

  let date = new Date(currentDay);
  let new_date = new Date(date);

  if (direction.toString() == "backward") {

    new_date.setDate(date.getDate() -1);

  } else if  (direction.toString() == "forward")  {

    new_date.setDate(date.getDate() + 1);

  } else {

    new_date.setDate(date.getDate() + 0);
  }

  const formattedDate = new_date.toISOString().split('T')[0];
  let vyraz = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD

  try{

    const QH_data = await QH_OKTE_odch.find(
      {qh_perioda: { $regex: `^${vyraz}` } }, // Filter condition
      {qh_perioda: 1, qh_num: 1, cena_odch: 1, sys_odch: 1,  utc_cas: 1 } // Projection: Include oh_perioda and DT_SK_cena, exclude _id

    ).sort({ qh_perioda: 1 });

    const DT_data = await DT_OKTE_ceny.find(
      { oh_perioda: { $regex: `^${vyraz}` } }, // Filter condition
      { oh_perioda: 1,
        'DT_data.DT_SK_cena': 1 } // Projection: Include oh_perioda and DT_SK_cena, exclude _id
    ).sort({ oh_perioda: 1 });

    const processedData = QH_data.map(qh => {

      const oh_key = qh.qh_perioda.slice(0,-3);   // Removes the last "-XX" qh part
      const matchingDT = DT_data.find(dt => dt.oh_perioda === oh_key);  // Find the matching DT_data entry

      return{

        perioda: qh.qh_num,
        cena_odch: qh.cena_odch ?? null, // Ensure a default value
        sys_odch: qh.sys_odch ?? null, // Ensure a default value
        DT_SK_cena: matchingDT ? matchingDT.DT_data.DT_SK_cena : null, // Handle cases where no match is found
        utc_cas: formatUTCToCET(qh.utc_cas) ?? null // Ensure a default value

      }

    });

    res.render('DT_vs_Odch', { currentDay: formattedDate, dataJSON: processedData});

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