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

router.get('/',checkAuthenticated, async(req, res) => {

  let today = new Date();
  let yesterday = new Date(today);
  let currentHours = today.getHours();
  let sluzbaFinder = "spolu";

  if (currentHours <= 23) {                       // hodina 13. pre linode server

    yesterday.setDate(today.getDate() + 0)

  } else {

    yesterday.setDate(today.getDate() - 1);

  }

  const formattedDate = yesterday.toISOString().split('T')[0];
  let vyraz = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD

  try {


    let query = { qh_perioda: {$regex: `^${vyraz}`} }; // Filter condition

    const SEPS_data = await QH_SEPS_RE.find(query,

      { 
        qh_num: 1,
        aFRRP_RE_akt: 1,
        aFRRN_RE_akt: 1,
        TRV3P_RE_akt: 1,
        TRV3N_RE_akt: 1,
        utc_cas: 1,
      }

    ).sort({ qh_num: 1 });

    // Process the data to include the extracted period number
    const processedData = SEPS_data.map(item => ({
      qh_num: item.qh_num ?? null, // Ensure a default value
      aFRRP_RE: item.aFRRP_RE_akt ?? null, 
      aFRRN_RE: item.aFRRN_RE_akt ?? null,   // Ensure a default value
      TRV3P_RE: item.TRV3P_RE_akt ?? null, // Ensure a default value
      TRV3N_RE: item.TRV3N_RE_akt ?? null, // Ensure a default value
      utc_cas: formatUTCToCET(item.utc_cas) ?? null, // Ensure a default value

    }));


    res.render('SEPS_RE', { currentDay: formattedDate, sluzbaFinder: sluzbaFinder, dataJSON: processedData }); // Render index.ejs and pass the data

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
  let vyraz = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD

    if (sluzbaFinder === "spolu"){

      try {

        let query = { qh_perioda: {$regex: `^${vyraz}`} }; // Filter condition

        const SEPS_data = await QH_SEPS_RE.find(query,

          { 
            qh_num: 1,
            aFRRP_RE_akt: 1,
            aFRRN_RE_akt: 1,
            TRV3P_RE_akt: 1,
            TRV3N_RE_akt: 1,
            utc_cas: 1,
          }

      ).sort({ qh_num: 1 });
    
        const processedData = SEPS_data.map(item => ({
          qh_num: item.qh_num ?? null, // Ensure a default value
          aFRRP_RE: item.aFRRP_RE_akt ?? null, // Ensure a default value
          aFRRN_RE: item.aFRRN_RE_akt ?? null, // Ensure a default value
          TRV3P_RE: item.TRV3P_RE_akt ?? null, // Ensure a default value
          TRV3N_RE: item.TRV3N_RE_akt ?? null, // Ensure a default value
          utc_cas: formatUTCToCET(item.utc_cas) ?? null, // Ensure a default value

        }));

        res.render('SEPS_RE', { currentDay: formattedDate, sluzbaFinder: sluzbaFinder, dataJSON: processedData }); // Render index.ejs and pass the data

      } catch (err) {

        console.error('Error fetching data:', err);
        res.status(500).send('Internal Server Error');
      
      }

      
    } else if (sluzbaFinder === "afrr"){


      try {

        let query = { qh_perioda: {$regex: `^${vyraz}`} }; // Filter condition

        const SEPS_data = await QH_SEPS_RE.find(query,

          { 
            qh_num: 1,
            aFRRP_RE_akt: 1,
            aFRRN_RE_akt: 1,
            utc_cas: 1,
          }

      ).sort({ qh_num: 1 });
    
        const processedData = SEPS_data.map(item => ({
          qh_num: item.qh_num ?? null, // Ensure a default value
          aFRRP_RE: item.aFRRP_RE_akt ?? null, // Ensure a default value
          aFRRN_RE: item.aFRRN_RE_akt ?? null, // Ensure a default value
          utc_cas: formatUTCToCET(item.utc_cas) ?? null, // Ensure a default value

        }));

        res.render('SEPS_RE', { currentDay: formattedDate, sluzbaFinder: sluzbaFinder, dataJSON: processedData }); // Render index.ejs and pass the data

      } catch (err) {

        console.error('Error fetching data:', err);
        res.status(500).send('Internal Server Error');
      
      }

    } else if (sluzbaFinder === "trv3"){

        try {

          let query = { qh_perioda: {$regex: `^${vyraz}`} }; // Filter condition

          const SEPS_data = await QH_SEPS_RE.find(query,

            { 
              qh_num: 1,
              TRV3P_RE_akt: 1,
              TRV3N_RE_akt: 1,
              utc_cas: 1,
            }

        ).sort({ qh_num: 1 });
      
          const processedData = SEPS_data.map(item => ({

            qh_num: item.qh_num ?? null, // Ensure a default value
            TRV3P_RE: item.TRV3P_RE_akt ?? null, // Ensure a default value
            TRV3N_RE: item.TRV3N_RE_akt ?? null, // Ensure a default value
            utc_cas: formatUTCToCET(item.utc_cas) ?? null, // Ensure a default value

          }));

          res.render('SEPS_RE', { currentDay: formattedDate, sluzbaFinder: sluzbaFinder, dataJSON: processedData }); // Render index.ejs and pass the data

      } catch (err) {

          console.error('Error fetching data:', err);
          res.status(500).send('Internal Server Error');
      
      }


    } else if (sluzbaFinder === "mfrr_sa") {

      try {

        let query = { qh_perioda: {$regex: `^${vyraz}`} }; // Filter condition

          const SEPS_data = await QH_SEPS_RE.find(query,

            { 
              qh_num: 1,
              mFRRN_SA_RE_akt: 1,
              mFRRP_SA_RE_akt: 1,
              utc_cas: 1,
            }

        ).sort({ qh_num: 1 });

          const processedData = SEPS_data.map(item => ({

            qh_num: item.qh_num ?? null, // Ensure a default value
            mFRRP_SA_RE: item.mFRRP_SA_RE_akt ?? null, // Ensure a default value
            mFRRN_SA_RE: item.mFRRN_SA_RE_akt ?? null, // Ensure a default value   
            utc_cas: formatUTCToCET(item.utc_cas) ?? null, // Ensure a default value

          }));

          res.render('SEPS_RE', { currentDay: formattedDate, sluzbaFinder: sluzbaFinder, dataJSON: processedData }); // Render index.ejs and pass the data
      
      } catch (err) {

          console.error('Error fetching data:', err);
          res.status(500).send('Internal Server Error');
      }

    } else if (sluzbaFinder === "mfrr_da") {

      try {

        let query = { qh_perioda: {$regex: `^${vyraz}`} }; // Filter condition

          const SEPS_data = await QH_SEPS_RE.find(query,

            { 
              qh_num: 1,
              mFRRN_DA_RE_akt: 1,
              mFRRP_DA_RE_akt: 1,
              utc_cas: 1,
            }

        ).sort({ qh_num: 1 });

          const processedData = SEPS_data.map(item => ({

            qh_num: item.qh_num ?? null, // Ensure a default value
            mFRRN_DA_RE: item.mFRRN_DA_RE_akt ?? null, // Ensure a default value
            mFRRP_DA_RE: item.mFRRP_DA_RE_akt ?? null, // Ensure a default value
            utc_cas: formatUTCToCET(item.utc_cas) ?? null, // Ensure a default value

          }));

          res.render('SEPS_RE', { currentDay: formattedDate, sluzbaFinder: sluzbaFinder, dataJSON: processedData }); // Render index.ejs and pass the data
      
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

module.exports = router