const express = require('express')
const router = express.Router()

const QH_SEPS_RE = require('../models/QH_data')

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

// ------------------------------------------------------------------------------- Router for getting the data for the current day

router.get('/',checkAuthenticated, async(req, res) => {

  let today = new Date();
  let yesterday = new Date(today);
  let currentHours = today.getHours();


  if (currentHours <= 23) {                       // hodina 13. pre linode server

    yesterday.setDate(today.getDate() + 0)

  } else {

    yesterday.setDate(today.getDate() - 1);

  }

  const sluzbaFinder = "spolu";
  const formattedDate = yesterday.toISOString().split('T')[0];
  let vyraz = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD

  try {


    let query = { qh_perioda: {$regex: `^${vyraz}`} }; // Filter condition

    const SEPS_data = await QH_SEPS_RE.find(query,

      { 
        qh_num: 1,
        aFRRP_PpS_tot: 1,
        aFRRN_PpS_tot: 1,
        TRV3P_PpS_tot: 1,
        TRV3N_PpS_tot: 1,
        mFRRN_PpS_tot: 1,
        mFRRN_PpS_una: 1, 
        mFRRP_PpS_tot: 1,
        mFRRP_PpS_una: 1,
        utc_cas: 1, 

      }

    ).sort({ qh_num: 1 });

    // Process the data to include the extracted period number
    const processedData = SEPS_data.map(item => ({

      qh_num: item.qh_num ?? null, // Ensure a default value
      aFRRP_PpS: item.aFRRP_PpS_tot ?? null, // Ensure a default value
      aFRRN_PpS: item.aFRRN_PpS_tot ?? null, // Ensure a default value
      TRV3P_PpS: item.TRV3P_PpS_tot ?? null, // Ensure a default value
      TRV3N_PpS: item.TRV3N_PpS_tot ?? null, // Ensure a default value
      mFRRP_PpS: item.mFRRP_PpS_tot ?? null - item.mFRRP_PpS_una ?? null, // Ensure a default value
      mFRRN_PpS: item.mFRRN_PpS_tot ?? null - item.mFRRN_PpS_una ?? null, // Ensure a default value
      spolu_PPps: (item.aFRRP_PpS_tot ?? 0) + (item.mFRRP_PpS_tot ?? 0) + (item.TRV3P_PpS_tot ?? 0)  - (item.mFRRP_PpS_una ?? 0), // Calculate the total PpS for positive side
      spolu_NPps: (item.aFRRN_PpS_tot ?? 0) + (item.mFRRN_PpS_tot ?? 0) + (item.TRV3N_PpS_tot ?? 0) - (item.mFRRN_PpS_una ?? 0), // Calculate the total PpS for negative side
      utc_cas: formatUTCToCET(item.utc_cas) ?? null, // Ensure a default value

    }));


    res.render('SEPS_PpS', { currentDay: formattedDate, sluzbaFinder: sluzbaFinder, dataJSON: processedData }); // Render index.ejs and pass the data

  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Internal Server Error');
  }


})  

// ------------------------------------------------------------------------------- Router for POST request to change the date

router.post('/',checkAuthenticated, async(req,res) => {

  const { direction, currentDay, sluzbaFinder } = req.body;

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
  let den_query = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD



  try {


    let query = { qh_perioda: {$regex: `^${den_query}`} }; // Filter condition

    if (sluzbaFinder === "spolu") {
      query_options = {
            qh_num: 1,
            aFRRP_PpS_tot: 1,
            aFRRN_PpS_tot: 1,
            TRV3P_PpS_tot: 1,
            TRV3N_PpS_tot: 1,
            mFRRN_PpS_tot: 1,
            mFRRN_PpS_una: 1, 
            mFRRP_PpS_tot: 1,
            mFRRP_PpS_una: 1,
            utc_cas: 1, 
      } 
    } else if (sluzbaFinder === "afrr") {
        query_options = {
            qh_num: 1,
            aFRRP_PpS_tot: 1,
            aFRRN_PpS_tot: 1,
            utc_cas: 1, 
        };
    } else if (sluzbaFinder === "mfrr") {
        query_options = {
            qh_num: 1,
            mFRRP_PpS_tot: 1,
            mFRRP_PpS_una: 1,
            mFRRN_PpS_tot: 1,
            mFRRN_PpS_una: 1,
            utc_cas: 1, 
        };
    } else if (sluzbaFinder === "trv3") {
        query_options = {
            qh_num: 1,
            TRV3P_PpS_tot: 1,
            TRV3N_PpS_tot: 1,
            utc_cas: 1, 
        };
    }


    const SEPS_data = await QH_SEPS_RE.find(query, query_options).sort({ qh_num: 1 });

    let processedData;

    if (sluzbaFinder === "afrr") {

        processedData = SEPS_data.map(item => ({

          qh_num: item.qh_num ?? null, // Ensure a default value
          aFRRP_PpS: item.aFRRP_PpS_tot ?? null, // Ensure a default value
          aFRRN_PpS: item.aFRRN_PpS_tot ?? null, // Ensure a default value
          utc_cas: formatUTCToCET(item.utc_cas) ?? null, // Ensure a default value

        }));

    } else if (sluzbaFinder === "mfrr") {

        processedData = SEPS_data.map(item => ({

          qh_num: item.qh_num ?? null,
          mFRRP_PpS: item.mFRRP_PpS_tot ?? null,
          mFRRP_una: item.mFRRP_PpS_una ?? null,
          mFRRN_PpS: item.mFRRN_PpS_tot ?? null,
          mFRRN_una: item.mFRRN_PpS_una ?? null,
          utc_cas: formatUTCToCET(item.utc_cas) ?? null,

        }));

    } else if (sluzbaFinder === "trv3") {

        processedData = SEPS_data.map(item => ({

          qh_num: item.qh_num ?? null,
          TRV3P_PpS: item.TRV3P_PpS_tot ?? null,
          TRV3N_PpS: item.TRV3N_PpS_tot ?? null,
          utc_cas: formatUTCToCET(item.utc_cas) ?? null,

        }));

    } else {

        processedData = SEPS_data.map(item => ({

          qh_num: item.qh_num ?? null, // Ensure a default value
          aFRRP_PpS: item.aFRRP_PpS_tot ?? null, // Ensure a default value
          aFRRN_PpS: item.aFRRN_PpS_tot ?? null, // Ensure a default value
          TRV3P_PpS: item.TRV3P_PpS_tot ?? null, // Ensure a default value
          TRV3N_PpS: item.TRV3N_PpS_tot ?? null, // Ensure a default value
          mFRRP_PpS: item.mFRRP_PpS_tot ?? null - item.mFRRP_PpS_una ?? null, // Ensure a default value
          mFRRN_PpS: item.mFRRN_PpS_tot ?? null - item.mFRRN_PpS_una ?? null, // Ensure a default value
          spolu_PPps: (item.aFRRP_PpS_tot ?? 0) + (item.mFRRP_PpS_tot ?? 0) + (item.TRV3P_PpS_tot ?? 0)  - (item.mFRRP_PpS_una ?? 0), // Calculate the total PpS for positive side
          spolu_NPps: (item.aFRRN_PpS_tot ?? 0) + (item.mFRRN_PpS_tot ?? 0) + (item.TRV3N_PpS_tot ?? 0) - (item.mFRRN_PpS_una ?? 0), // Calculate the total PpS for negative side
          utc_cas: formatUTCToCET(item.utc_cas) ?? null, // Ensure a default value

        }));

    }

    res.render('SEPS_PpS', { currentDay: formattedDate, sluzbaFinder: sluzbaFinder, dataJSON: processedData }); // Render index.ejs and pass the data

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