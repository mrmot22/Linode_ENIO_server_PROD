const express = require('express')
const router = express.Router()


const QH_OKTE_IDA = require('../models/QH_data');
const DT_OKTE_ceny = require('../models/H_data'); 


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

  let today = new Date();
  let yesterday = new Date(today);
  let currentHours = today.getHours();

  if (currentHours < 13) {   //Linode cas, skutocny nas cas je 15

    yesterday.setDate(today.getDate() - 0)

  } else {

    yesterday.setDate(today.getDate() + 1)

  }

  const formattedDate = yesterday.toISOString().split('T')[0];
  let vyraz = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD
  
  delete today, yesterday, currentHours


  try{

    const QH_data = await QH_OKTE_IDA.find(
      {qh_perioda: { $regex: `^${vyraz}` } }, // Filter condition
      {
        qh_perioda: 1,
        qh_num: 1,
        IDA1_cena: 1,
        IDA2_cena: 1,
        IDA3_cena: 1,
        DT_cena_DE15: 1,
        IDA1_nakup_SK_MW: 1,
        IDA1_predaj_SK_MW: 1,
        IDA2_nakup_SK_MW: 1,
        IDA2_predaj_SK_MW: 1,
        IDA3_nakup_SK_MW: 1,
        IDA3_predaj_SK_MW: 1,
        utc_cas: 1,
      } // Projection: Include oh_perioda and DT_SK_cena, exclude _id

    ).sort({ qh_perioda: 1 });

    const DT_data = await DT_OKTE_ceny.find(
      { oh_perioda: { $regex: `^${vyraz}` } }, // Filter condition
      { oh_perioda: 1, DT_SK_cena: 1 } // Projection: Include oh_perioda and DT_SK_cena, exclude _id
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
        IDA1_nakup: qh.IDA1_nakup_SK_MW ?? null, // Ensure a default value
        IDA1_predaj: qh.IDA1_predaj_SK_MW ?? null, // Ensure a default value
        IDA2_nakup: qh.IDA2_nakup_SK_MW ?? null, // Ensure a default value
        IDA2_predaj: qh.IDA2_predaj_SK_MW ?? null, // Ensure a default value
        IDA3_nakup: qh.IDA3_nakup_SK_MW ?? null, // Ensure a default value
        IDA3_predaj: qh.IDA3_predaj_SK_MW ?? null, // Ensure a default value
        utc_cas: formatUTCToCET(qh.utc_cas) ?? null, // Ensure a default value
        DT_SK_cena: matchingDT ? matchingDT.DT_SK_cena : null // Handle cases where no match is found
      }

    });

    res.render('DT_vs_IDA', { currentHour: formattedDate, dataJSON: processedData});

  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Internal Server Error');
  }

  
})


router.post('/',checkAuthenticated, async(req,res) => {

  const { direction, currentHour } = req.body;

  let date = new Date(currentHour);
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

    const QH_data = await QH_OKTE_IDA.find(
      {qh_perioda: { $regex: `^${vyraz}` } }, // Filter condition
      {
        qh_perioda: 1,
        qh_num: 1,
        IDA1_cena: 1,
        IDA2_cena: 1,
        IDA3_cena: 1,
        DT_cena_DE15: 1,
        IDA1_nakup_SK_MW: 1,
        IDA1_predaj_SK_MW: 1,
        IDA2_nakup_SK_MW: 1,
        IDA2_predaj_SK_MW: 1,
        IDA3_nakup_SK_MW: 1,
        IDA3_predaj_SK_MW: 1,
        utc_cas: 1,
      } // Projection: Include oh_perioda and DT_SK_cena, exclude _id

    ).sort({ qh_perioda: 1 });

    const DT_data = await DT_OKTE_ceny.find(
      { oh_perioda: { $regex: `^${vyraz}` } }, // Filter condition
      { oh_perioda: 1, DT_SK_cena: 1, _id: 0 } // Projection: Include oh_perioda and DT_SK_cena, exclude _id
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
        IDA1_nakup: qh.IDA1_nakup_SK_MW ?? null, // Ensure a default value
        IDA1_predaj: qh.IDA1_predaj_SK_MW ?? null, // Ensure a default value
        IDA2_nakup: qh.IDA2_nakup_SK_MW ?? null, // Ensure a default value
        IDA2_predaj: qh.IDA2_predaj_SK_MW ?? null, // Ensure a default value
        IDA3_nakup: qh.IDA3_nakup_SK_MW ?? null, // Ensure a default value
        IDA3_predaj: qh.IDA3_predaj_SK_MW ?? null, // Ensure a default value
        utc_cas: formatUTCToCET(qh.utc_cas) ?? null, // Ensure a default value
        DT_SK_cena: matchingDT ? matchingDT.DT_SK_cena : null // Handle cases where no match is found
      }

    });


    res.render('DT_vs_IDA', { currentHour: formattedDate, dataJSON: processedData});

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