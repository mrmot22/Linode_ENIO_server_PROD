const express = require('express')
const router = express.Router()


const QH_OKTE_IDA = require('../models/QH_data');
const DT_OKTE_ceny = require('../models/H_data'); 

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
  let tomorrow = new Date(today);
  let currentHours = today.getHours();

  if (currentHours < 13) {   //Linode cas, skutocny nas cas je 15

    tomorrow.setDate(today.getDate() - 0)

  } else {

    tomorrow.setDate(today.getDate() + 1)

  }

  const NewWordOrder = new Date("2025-10-01");
  const formattedDate = tomorrow.toISOString().split('T')[0];
  let vyraz = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD

  if (tomorrow < NewWordOrder) {

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
        { oh_perioda: 1,
          'DT_data.DT_SK_cena': 1  } // Projection: Include oh_perioda and DT_SK_cena, exclude _id
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
          DT_SK_cena: matchingDT ? matchingDT.DT_data.DT_SK_cena : null // Handle cases where no match is found
        }

      });

      res.render('DT_vs_IDA', { currentDay: formattedDate, dataJSON: processedData});

    } catch (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Internal Server Error');
    }


  } else {

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
            'dt_data.DT_SK_cena': 1,
            'dt_data.DT_DE_cena': 1,
            utc_cas: 1,
          } // Projection: Include oh_perioda and DT_SK_cena, exclude _id

        ).sort({ qh_perioda: 1 });

        const processedData = QH_data.map(item => ({


            perioda: item.qh_num,
            IDA1_cena: item.IDA1_cena ?? null, // Ensure a default value
            IDA2_cena: item.IDA2_cena ?? null, // Ensure a default value
            IDA3_cena: item.IDA3_cena ?? null, // Ensure a default value
            IDA1_nakup: item.IDA1_nakup_SK_MW ?? null, // Ensure a default value
            IDA1_predaj: item.IDA1_predaj_SK_MW ?? null, // Ensure a default value
            IDA2_nakup: item.IDA2_nakup_SK_MW ?? null, // Ensure a default value
            IDA2_predaj: item.IDA2_predaj_SK_MW ?? null, // Ensure a default value
            IDA3_nakup: item.IDA3_nakup_SK_MW ?? null, // Ensure a default value
            IDA3_predaj: item.IDA3_predaj_SK_MW ?? null, // Ensure a default value
            DT_cena_DE15: item.dt_data.DT_DE_cena ?? null, // Ensure a default value
            DT_SK_cena:item.dt_data.DT_SK_cena ?? null, // Ensure a default value
            utc_cas: formatUTCToCET(item.utc_cas) ?? null, // Ensure a default value
    
      }));

          res.render('DT_vs_IDA', { currentDay: formattedDate, dataJSON: processedData});

    } catch (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Internal Server Error');
    }

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
    


  let new_date = new Date(currentDay);

  const formattedDate = new_date.toISOString().split('T')[0];
  let vyraz = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD
  const NewWordOrder = new Date("2025-10-01");

  if (targetDate < NewWordOrder){

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
        { oh_perioda: 1, 
          'DT_data.DT_SK_cena': 1
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
          IDA1_nakup: qh.IDA1_nakup_SK_MW ?? null, // Ensure a default value
          IDA1_predaj: qh.IDA1_predaj_SK_MW ?? null, // Ensure a default value
          IDA2_nakup: qh.IDA2_nakup_SK_MW ?? null, // Ensure a default value
          IDA2_predaj: qh.IDA2_predaj_SK_MW ?? null, // Ensure a default value
          IDA3_nakup: qh.IDA3_nakup_SK_MW ?? null, // Ensure a default value
          IDA3_predaj: qh.IDA3_predaj_SK_MW ?? null, // Ensure a default value
          utc_cas: formatUTCToCET(qh.utc_cas) ?? null, // Ensure a default value
          DT_SK_cena: matchingDT ? matchingDT.DT_data.DT_SK_cena : null // Handle cases where no match is found
        }

      });

      res.json({  currentDay: formattedDate,
                  dataJSON: processedData }); // Render index.ejs and pass the data

    } catch (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Internal Server Error');
    }

  } else {

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
            'dt_data.DT_SK_cena': 1,
            'dt_data.DT_DE_cena': 1,
            utc_cas: 1,
          } // Projection: Include oh_perioda and DT_SK_cena, exclude _id

        ).sort({ qh_perioda: 1 });

        const processedData = QH_data.map(item => ({


            perioda: item.qh_num,
            IDA1_cena: item.IDA1_cena ?? null, // Ensure a default value
            IDA2_cena: item.IDA2_cena ?? null, // Ensure a default value
            IDA3_cena: item.IDA3_cena ?? null, // Ensure a default value
            IDA1_nakup: item.IDA1_nakup_SK_MW ?? null, // Ensure a default value
            IDA1_predaj: item.IDA1_predaj_SK_MW ?? null, // Ensure a default value
            IDA2_nakup: item.IDA2_nakup_SK_MW ?? null, // Ensure a default value
            IDA2_predaj: item.IDA2_predaj_SK_MW ?? null, // Ensure a default value
            IDA3_nakup: item.IDA3_nakup_SK_MW ?? null, // Ensure a default value
            IDA3_predaj: item.IDA3_predaj_SK_MW ?? null, // Ensure a default value
            DT_cena_DE15: item.dt_data.DT_DE_cena ?? null, // Ensure a default value
            DT_SK_cena:item.dt_data.DT_SK_cena ?? null, // Ensure a default value
            utc_cas: formatUTCToCET(item.utc_cas) ?? null, // Ensure a default value
    
      }));

          res.json({  currentDay: formattedDate, dataJSON: processedData }); // Render index.ejs and pass the data

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