const express = require('express')
const router = express.Router()



const QH_picasso_avg = require('../models/4s_data'); 


//   - Start of the router --HOME -- 

router.get('/',checkAuthenticated, async(req, res) => {

  let today = new Date();

  const formattedDate = today.toISOString().split('T')[0];
  let vyraz = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD
  
  try{

    const QH_data = await QH_picasso_avg.find(
      {
        qh_perioda: { $gte: vyraz, $lt: vyraz + '\uffff' },
        Cena_SEPS_POS_avg: { $exists: true }  // This ensures the field exists
     },
    {
      qh_perioda: 1, 
      qh_num: 1, 
      cas_zaciatok: 1, 
      Cena_SEPS_POS_avg: 1,
      Cena_SEPS_POS_max: 1, 
      Cena_SEPS_POS_min: 1
    }

    ).sort({ qh_perioda: 1 })
    .hint("qh_perioda_1_Cena_SEPS_POS_avg_1");  // Force the right index



    const processedData = QH_data.map(item => ({

      perioda: item.cas_zaciatok,
      qh_num: item.qh_num,
      cena_avg: item.Cena_SEPS_POS_avg,
      cena_max: item.Cena_SEPS_POS_max,
      cena_min: item.Cena_SEPS_POS_min 

    }));


    res.render('PICASSO_pre', { currentDay: formattedDate, dataJSON: processedData});

  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Internal Server Error');
  }

  
})


// ------------------------------------------------------------------------------- Router for POST request to change the date

router.post('/data',checkAuthenticated, async(req,res) => {

  const { currentDay, smer } = req.body;

  console.log('Received date:', currentDay, 'smer:', smer);

  let new_date = new Date(currentDay);
 
  const formattedDate = new_date.toISOString().split('T')[0];
  let vyraz = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD

  if (smer == "POS") {

    try{

      const QH_data = await QH_picasso_avg.find(
        {
          qh_perioda: { $gte: vyraz, $lt: vyraz + '\uffff' },
          Cena_SEPS_POS_avg: { $exists: true }  // This ensures the field exists
        },
        {
          qh_perioda: 1, 
          qh_num: 1, 
          cas_zaciatok: 1, 
          Cena_SEPS_POS_avg: 1,
          Cena_SEPS_POS_max: 1, 
          Cena_SEPS_POS_min: 1
        }

      ).sort({ qh_perioda: 1 })
       .hint("qh_perioda_1_Cena_SEPS_POS_avg_1"); // Force the right index;



      const processedData = QH_data.map(item => ({

        perioda: item.cas_zaciatok,
        qh_num: item.qh_num,
        cena_avg: item.Cena_SEPS_POS_avg,
        cena_max: item.Cena_SEPS_POS_max,
        cena_min: item.Cena_SEPS_POS_min 

      }));
    
    res.json( { currentDay: formattedDate, dataJSON: processedData, smer: smer});

    } catch (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Internal Server Error');
    }

  } else {

    try{

      const QH_data = await QH_picasso_avg.find(

        {
          qh_perioda: { $regex: `^${vyraz}` },
          Cena_SEPS_POS_avg: { $exists: true }  // This ensures the field exists
        },
        {
          qh_perioda: 1, 
          qh_num: 1, 
          cas_zaciatok: 1, 
          Cena_SEPS_NEG_avg: 1,
          Cena_SEPS_NEG_max: 1, 
          Cena_SEPS_NEG_min: 1
        }

      ).sort({ qh_perioda: 1 })
        .hint("qh_perioda_1_Cena_SEPS_POS_avg_1");  // Force the right index;



      const processedData = QH_data.map(item => ({

        perioda: item.cas_zaciatok,
        qh_num: item.qh_num,
        cena_avg: item.Cena_SEPS_NEG_avg,
        cena_max: item.Cena_SEPS_NEG_max,
        cena_min: item.Cena_SEPS_NEG_min 

      }));


    res.json( { currentDay: formattedDate, dataJSON: processedData, smer: smer});

    } catch (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Internal Server Error');
    }


  }

    });


function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
  }   

module.exports = router