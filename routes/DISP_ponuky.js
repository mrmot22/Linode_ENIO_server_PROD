const express = require('express')
const router = express.Router()


const QH_data = require('../models/QH_data');
const DT_OKTE_ceny = require('../models/H_data'); 
const QH_Ponuky = require('../models/4s_data'); 

//   - Start of the router --HOME -- 



router.get('/',checkAuthenticated, async(req, res) => {

  let today = new Date();
  let tomorrow = new Date(today);
  let currentHours = today.getHours();

  if (currentHours < 15) {   //Linode cas, skutocny nas cas je 15

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
        qh_num: 1,
        cas_zaciatok: 1,
        SEPS_FCR_disp: 1,
        'DISP_calc.FCR_disp_max': 1,
        'DISP_calc.FCR_disp_min': 1,
        'DISP_calc.FCR_disp_wavg': 1,
        'DISP_calc.FCR_disp_sum_offers': 1,

      }
    );

    const result = data.flatMap(entry => {
      // Filter the aFRR_POS array to only include the matching UNIT
      return entry.SEPS_FCR_disp
          .filter(item => item.ponuka === akt_ponuka) // Filter by UNIT and stav === true   && item.stav === true
          .map(item => ({
              cas: entry.cas_zaciatok,
              qh_num: entry.qh_num,
              disp_max: entry.DISP_calc.FCR_disp_max,
              disp_min: entry.DISP_calc.FCR_disp_min,
              disp_wavg: entry.DISP_calc.FCR_disp_wavg,
              offers_spolu: entry.DISP_calc.FCR_disp_sum_offers,
              ponuka: item.ponuka,
              quantity: item.quantity,
              price: item.price
          }));
  });


    res.render('DISP_ponuky', { currentDay: formattedDate, sluzbaFinder: sluzbaFinder, ponukyList: ponukyList, akt_ponuka: akt_ponuka, dataJSON: result });

  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Internal Server Error');
  }

  
})

// ------------------------------------------------------------------------------- Router for POST request to change the date

router.post('/data', checkAuthenticated, async (req, res) => {
    const { currentDay, ponuka, sluzba } = req.body;

    console.log('Received date:', currentDay, 'ponuka:', ponuka, 'sluzba', sluzba);

    let new_date = new Date(currentDay);
    const formattedDate = new_date.toISOString().split('T')[0];
    let den_query = formattedDate.replace(/-/g, '_');

    if (!sluzba || typeof sluzba !== 'string') {
        return res.status(400).json({ error: 'Service parameter is required' });
    }

    if (!ponuka || typeof ponuka !== 'string') {
        return res.status(400).json({ error: 'Ponuka parameter is required' });
    }

    // CORRECTED FIELD MAPPING - based on your actual data structure
    const fieldMapping = {
        'fcr': { mainField: 'SEPS_FCR_disp', dispBase: 'FCR_disp' },
        'afrrp': { mainField: 'SEPS_aFRRp_disp', dispBase: 'aFRRp_disp' }, // Fixed: aFRRp_disp (not afrrp_disp)
        'afrrn': { mainField: 'SEPS_aFRRn_disp', dispBase: 'aFRRn_disp' }, // Fixed: aFRRn_disp (not afrrn_disp)
        'mfrrp': { mainField: 'SEPS_mFRRp_disp', dispBase: 'mFRRp_disp' },
        'mfrrn': { mainField: 'SEPS_mFRRn_disp', dispBase: 'mFRRn_disp' },
    };

    const mapping = fieldMapping[sluzba];
    if (!mapping) {
        return res.status(400).json({ error: 'Invalid service parameter' });
    }

    const dbFieldName = mapping.mainField;
    const dispFieldBase = mapping.dispBase;

    try {
        const aggregationPipeline = [
            {
                $match: {
                    qh_perioda: { $regex: `^${den_query}` },
                    [dbFieldName]: { $exists: true, $ne: null, $type: 'array' }
                }
            },
            { $unwind: `$${dbFieldName}` },
            { 
                $group: { 
                    _id: `$${dbFieldName}.ponuka`
                } 
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, ponuka: "$_id" } }
        ];

        const uniquePonuky = await QH_Ponuky.aggregate(aggregationPipeline);
        const ponukyList = uniquePonuky.map(item => item.ponuka);

        const query = {
            "qh_perioda": { $regex: `^${den_query}` },
            [dbFieldName]: { 
                $exists: true, 
                $ne: null, 
                $type: 'array',
                $elemMatch: { "ponuka": ponuka } 
            }
        };

        const projection = {
          qh_num: 1,
          cas_zaciatok: 1,
          [dbFieldName]: 1,
          [`DISP_calc.${dispFieldBase}_max`]: 1,
          [`DISP_calc.${dispFieldBase}_min`]: 1,
          [`DISP_calc.${dispFieldBase}_wavg`]: 1,
          [`DISP_calc.${dispFieldBase}_sum_offers`]: 1,
        };

        const data = await QH_Ponuky.find(query, projection).lean();

        // Safe processing
        const result = data.flatMap(entry => {
            try {
                // Check if the main field exists and is an array
                if (!entry || !entry[dbFieldName] || !Array.isArray(entry[dbFieldName])) {
                    console.warn(`Skipping document ${entry._id}: ${dbFieldName} is missing or not an array`);
                    return [];
                }

                // Get DISP_calc data safely
                const dispData = entry.DISP_calc || {};
                
                // Filter items by ponuka and map to result format
                const filteredItems = entry[dbFieldName]
                    .filter(item => {
                        if (!item || typeof item !== 'object') {
                            console.warn(`Skipping invalid item in document ${entry._id}`);
                            return false;
                        }
                        return item.ponuka === ponuka;
                    })
                    .map(item => ({
                        cas: entry.cas_zaciatok,
                        qh_num: entry.qh_num,
                        disp_max: dispData[`${dispFieldBase}_max`] ?? null,
                        disp_min: dispData[`${dispFieldBase}_min`] ?? null,
                        disp_wavg: dispData[`${dispFieldBase}_wavg`] ?? null,
                        offers_spolu: dispData[`${dispFieldBase}_sum_offers`] ?? null,
                        quantity: item.quantity ?? null,
                        price: item.price ?? null
                    }));

                return filteredItems;
            } catch (error) {
                console.error('Error processing entry:', entry?._id, error);
                return [];
            }
        });

        res.json({
            currentDay: formattedDate,
            ponukyList: ponukyList,
            akt_ponuka: ponuka,
            dataJSON: result
        });

    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

module.exports = router;