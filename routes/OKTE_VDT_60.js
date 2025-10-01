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

    const VDT_data_60 = await hodinove_OKTE_ceny.find(
      { oh_perioda: { $regex: `^${vyraz}` } }, // Filter condition
      { oh_perioda: 1,
        'DT_data.DT_SK_cena': 1,
        utc_cas: 1,
        'vdt_data.OKTE_VDT_price_wavg': 1,
        'vdt_data.OKTE_VDT_price_min': 1,
        'vdt_data.OKTE_VDT_price_max': 1,
        'vdt_data.OKTE_VDT_predaj_obj': 1,
        'vdt_data.OKTE_VDT_nakup_obj': 1,

      } // Projection: Include oh_perioda and DT_SK_cena, exclude _id
    ).sort({ oh_perioda: 1 });


    const VDT_data_15 = await qh_OKTE_ceny.aggregate([
      {
        $match: {
          qh_perioda: { $regex: `^${vyraz}` } // Filter for the specific day
        }
      },
      {
        $group: {
          _id: {
            $substr: ["$qh_perioda", 0, 13] // Extract hour part (01, 02, 03, etc.)
          },
          average_VDT: {
            $avg: "$vdt_data.OKTE_VDT_price_wavg"
          },
          average_DT: {
            $avg: "$dt_data.DT_SK_cena"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 } // Sort by hour
      },
      {
        $project: {
          _id: 0,
          hour: "$_id",
          average_VDT: { $round: ["$average_VDT", 2] },
          average_DT: { $round: ["$average_DT", 2] }
        }
      }
    ]);

    const processedData = VDT_data_60.map(item => {

      const hour_DT = item.oh_perioda,
      matchingDT = VDT_data_15.find(dt => dt.hour === hour_DT);  // Find the matching DT_data entry

      return{

        perioda: item.oh_perioda.slice(-2), // Extract last two characters
        cena_SK: item.DT_data.DT_SK_cena ?? null, // Ensure a default value
        cena_VDT60_avg: item.vdt_data.OKTE_VDT_price_wavg ?? null, // Ensure a default value
        cena_VDT60_min: item.vdt_data.OKTE_VDT_price_min ?? null, // Ensure a default value
        cena_VDT60_max: item.vdt_data.OKTE_VDT_price_max ?? null, // Ensure a default value
        objem_VDT_nakup: item.vdt_data.OKTE_VDT_nakup_obj ?? null, // Ensure a default value
        objem_VDT_predaj: item.vdt_data.OKTE_VDT_predaj_obj ?? null, // Ensure a default value
        cena_VDT15_avg: matchingDT ? matchingDT.average_VDT : null, // Handle cases where no match is found
        cena_DT_avg: matchingDT ? matchingDT.average_DT : null, // Handle cases where no match is found
        utc_cas: formatUTCToCET(item.utc_cas) ?? null // Ensure a default value
      
      }

    });

    res.render('OKTE_VDT_60', { currentDay: formattedDate, dataJSON: processedData});

  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Internal Server Error');
  }

  
})

// post router
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

  if ( targetDate < NewWordOrder) {

    try{


      const VDT_data_60 = await hodinove_OKTE_ceny.find(
        { oh_perioda: { $regex: `^${vyraz}` } }, // Filter condition
        { oh_perioda: 1,
          utc_cas: 1,
          'DT_data.DT_SK_cena': 1,
          'vdt_data.OKTE_VDT_price_wavg': 1,
          'vdt_data.OKTE_VDT_price_min': 1,
          'vdt_data.OKTE_VDT_price_max': 1,
          'vdt_data.OKTE_VDT_predaj_obj': 1,
          'vdt_data.OKTE_VDT_nakup_obj': 1,

        } // Projection: Include oh_perioda and DT_SK_cena, exclude _id
      ).sort({ oh_perioda: 1 });


      const VDT_data_15 = await qh_OKTE_ceny.aggregate([
        {
          $match: {
            qh_perioda: { $regex: `^${vyraz}` } // Filter for the specific day
          }
        },
        {
          $group: {
            _id: {
              $substr: ["$qh_perioda", 0, 13] // Extract hour part (01, 02, 03, etc.)
            },
            average_price: {
              $avg: "$vdt_data.OKTE_VDT_price_wavg"
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 } // Sort by hour
        },
        {
          $project: {
            _id: 0,
            hour: "$_id",
            average_price: { $round: ["$average_price", 2] }
          }
        }
      ]);

      
      const processedData = VDT_data_60.map(item => {

        const hour_DT = item.oh_perioda,
        matchingDT = VDT_data_15.find(dt => dt.hour === hour_DT);  // Find the matching DT_data entry

        return{

          perioda: item.oh_perioda.slice(-2), // Extract last two characters
          cena_DT_avg: item.DT_data.DT_SK_cena ?? null,  // Ensure a default value
          cena_VDT60_avg: item.vdt_data.OKTE_VDT_price_wavg ?? null, // Ensure a default value
          cena_VDT60_min: item.vdt_data.OKTE_VDT_price_min ?? null, // Ensure a default value
          cena_VDT60_max: item.vdt_data.OKTE_VDT_price_max ?? null, // Ensure a default value
          objem_VDT_nakup: item.vdt_data.OKTE_VDT_nakup_obj ?? null, // Ensure a default value
          objem_VDT_predaj: item.vdt_data.OKTE_VDT_predaj_obj ?? null, // Ensure a default value
          cena_VDT15_avg: matchingDT ? matchingDT.average_price : null, // Handle cases where no match is found
          utc_cas: formatUTCToCET(item.utc_cas) ?? null // Ensure a default value
        
        }
      });

        res.json({  currentDay: formattedDate,
                  dataJSON: processedData }); // render data as JSON

    
    } catch (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {

   try{

    const VDT_data_60 = await hodinove_OKTE_ceny.find(
      { oh_perioda: { $regex: `^${vyraz}` } }, // Filter condition
      { oh_perioda: 1,
        'DT_data.DT_SK_cena': 1,
        utc_cas: 1,
        'vdt_data.OKTE_VDT_price_wavg': 1,
        'vdt_data.OKTE_VDT_price_min': 1,
        'vdt_data.OKTE_VDT_price_max': 1,
        'vdt_data.OKTE_VDT_predaj_obj': 1,
        'vdt_data.OKTE_VDT_nakup_obj': 1,

      } // Projection: Include oh_perioda and DT_SK_cena, exclude _id
    ).sort({ oh_perioda: 1 });


    const VDT_data_15 = await qh_OKTE_ceny.aggregate([
      {
        $match: {
          qh_perioda: { $regex: `^${vyraz}` } // Filter for the specific day
        }
      },
      {
        $group: {
          _id: {
            $substr: ["$qh_perioda", 0, 13] // Extract hour part (01, 02, 03, etc.)
          },
          average_VDT: {
            $avg: "$vdt_data.OKTE_VDT_price_wavg"
          },
          average_DT: {
            $avg: "$dt_data.DT_SK_cena"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 } // Sort by hour
      },
      {
        $project: {
          _id: 0,
          hour: "$_id",
          average_VDT: { $round: ["$average_VDT", 2] },
          average_DT: { $round: ["$average_DT", 2] }
        }
      }
    ]);

    const processedData = VDT_data_60.map(item => {

      const hour_DT = item.oh_perioda,
      matchingDT = VDT_data_15.find(dt => dt.hour === hour_DT);  // Find the matching DT_data entry

      return{

        perioda: item.oh_perioda.slice(-2), // Extract last two characters
        cena_SK: item.DT_data.DT_SK_cena ?? null, // Ensure a default value
        cena_VDT60_avg: item.vdt_data.OKTE_VDT_price_wavg ?? null, // Ensure a default value
        cena_VDT60_min: item.vdt_data.OKTE_VDT_price_min ?? null, // Ensure a default value
        cena_VDT60_max: item.vdt_data.OKTE_VDT_price_max ?? null, // Ensure a default value
        objem_VDT_nakup: item.vdt_data.OKTE_VDT_nakup_obj ?? null, // Ensure a default value
        objem_VDT_predaj: item.vdt_data.OKTE_VDT_predaj_obj ?? null, // Ensure a default value
        cena_VDT15_avg: matchingDT ? matchingDT.average_VDT : null, // Handle cases where no match is found
        cena_DT_avg: matchingDT ? matchingDT.average_DT : null, // Handle cases where no match is found
        utc_cas: formatUTCToCET(item.utc_cas) ?? null // Ensure a default value
      
      }

    });

    res.json({  currentDay: formattedDate,
                dataJSON: processedData }); // render data as JSON

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