const express = require('express')
const router = express.Router()


const QH_data = require('../models/QH_data');
const DT_OKTE_ceny = require('../models/H_data'); 
const QH_Ponuky = require('../models/4s_data'); 

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
  let tomorrow = new Date(today);
  let currentHours = today.getHours();

  if (currentHours < 13) {   //Linode cas, skutocny nas cas je 15

    tomorrow.setDate(today.getDate() + 0);

  } else {

    tomorrow.setDate(today.getDate() + 1);

  }

  let formattedDate = tomorrow.toISOString().split('T')[0];
  let den_query = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD

  let sluzbaFinder = "fcr";

   
  try{
    
    const aggregationPipeline = [
        { 
          $match: {
            qh_perioda: { $regex: `^${den_query}` },
            SEPS_FCR_disp: { $exists: true }  // Ensure the field exists
          }
        },
        { $unwind: "$SEPS_FCR_disp" },
        {$group: {
          _id: "$SEPS_FCR_disp.ponuka", // Group by UNIT 
        }},
        { $sort: { _id: 1 } }, // Sort the results alphabetically 
        { $project: { _id: 0, ponuka: "$_id" } } // Rename _id to UNIT
    ];

    const uniquePonuky = await QH_Ponuky.aggregate(aggregationPipeline);
    const ponukyList = uniquePonuky.map(item => item.ponuka);
    let akt_ponuka = ponukyList[0];

    const query = { "SEPS_FCR_disp": { $elemMatch: { "ponuka": akt_ponuka} } };
    query["qh_perioda"] = { $regex: `^${ den_query }` } 

    const data = await QH_Ponuky.find(query,
      {
        cas_zaciatok: 1,
        SEPS_FCR_disp: 1,
      }
    );

    const result = data.flatMap(entry => {
      // Filter the aFRR_POS array to only include the matching UNIT
      return entry.SEPS_FCR_disp
          .filter(item => item.ponuka === akt_ponuka) // Filter by UNIT and stav === true   && item.stav === true
          .map(item => ({
              cas: entry.cas_zaciatok,
              ponuka: item.ponuka,
              quantity: item.quantity,
              price: item.price
          }));
  });

  console.log(result);

    res.render('DISP_ponuky', { currentDay: formattedDate, sluzbaFinder: sluzbaFinder, ponukyList: ponukyList, akt_ponuka: akt_ponuka, dataJSON: result });

  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Internal Server Error');
  }

  
})


router.post('/data',checkAuthenticated, async(req,res) => {

  const { currentDay } = req.body;

  let new_date = new Date(currentDay);

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

})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
  }   

module.exports = router