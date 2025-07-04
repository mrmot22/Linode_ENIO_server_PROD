const express = require('express')
const router = express.Router()



const QH_picasso = require('../models/4s_data'); 


//   - Start of the router --HOME -- 

router.get('/',checkAuthenticated, async(req, res) => {

  let today = new Date();


  const formattedDate = today.toISOString().split('T')[0];
  let vyraz = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD
  
  delete today

  try{

    const QH_data = await QH_picasso.find(
      {
        qh_perioda: { $regex: `^${vyraz}` },
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

    ).sort({ qh_perioda: 1 });



    const processedData = QH_data.map(item => ({

      perioda: item.cas_zaciatok,
      qh_num: item.qh_num,
      cena_avg: item.Cena_SEPS_POS_avg,
      cena_max: item.Cena_SEPS_POS_max,
      cena_min: item.Cena_SEPS_POS_min 

    }));

    let smer = "POS"

    res.render('PICASSO_pre', { currentHour: formattedDate, dataJSON: processedData, smer: smer});

  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Internal Server Error');
  }

  
})


// ------------------------------------------------------------------------------- Router for POST request to change the date

router.post('/',checkAuthenticated, async(req,res) => {

  const { direction, currentHour, smer } = req.body;

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

  if (smer == "POS") {

    try{

      const QH_data = await QH_picasso.find(
        {
          qh_perioda: { $regex: `^${vyraz}` },
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

      ).sort({ qh_perioda: 1 });



      const processedData = QH_data.map(item => ({

        perioda: item.cas_zaciatok,
        qh_num: item.qh_num,
        cena_avg: item.Cena_SEPS_POS_avg,
        cena_max: item.Cena_SEPS_POS_max,
        cena_min: item.Cena_SEPS_POS_min 

      }));

      res.render('PICASSO_pre', { currentHour: formattedDate, dataJSON: processedData, smer: smer});

    } catch (err) {
      console.error('Error fetching data:', err);
      res.status(500).send('Internal Server Error');
    }

  } else {

    try{

      const QH_data = await QH_picasso.find(

        {
          qh_perioda: { $regex: `^${vyraz}` },
          Cena_SEPS_NEG_avg: { $exists: true }  // This ensures the field exists
        },
        {
          qh_perioda: 1, 
          qh_num: 1, 
          cas_zaciatok: 1, 
          Cena_SEPS_NEG_avg: 1,
          Cena_SEPS_NEG_max: 1, 
          Cena_SEPS_NEG_min: 1
        }

      ).sort({ qh_perioda: 1 });



      const processedData = QH_data.map(item => ({

        perioda: item.cas_zaciatok,
        qh_num: item.qh_num,
        cena_avg: item.Cena_SEPS_NEG_avg,
        cena_max: item.Cena_SEPS_NEG_max,
        cena_min: item.Cena_SEPS_NEG_min 

      }));


      res.render('PICASSO_pre', { currentHour: formattedDate, dataJSON: processedData, smer: smer});

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