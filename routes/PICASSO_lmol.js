const express = require('express')
const router = express.Router()



const QH_picasso_lmol = require('../models/4s_data'); 


//   - Start of the router --HOME -- 

router.get('/',checkAuthenticated, async(req, res) => {


  try{

    smer = "POS";

    const data = await QH_picasso_lmol.findOne({ 
      aFRR_POS: { $exists: true, $ne: [] }, // Ensure aFRR_POS exists and is not empty
      },
      {aFRR_NEG: 0,
        ceny_SEPS: 0,
        Cena_SEPS_POS_avg: 0,
        Cena_SEPS_POS_max: 0,
        Cena_SEPS_POS_min: 0,
        Cena_SEPS_NEG_avg: 0,
        Cena_SEPS_NEG_max: 0,
        Cena_SEPS_NEG_min: 0,
        _id: 0 
      })
      .sort({ qh_num_year: -1 }) // Sort by qh_num_year descending
      .exec();

    data_vystup = {};

    data_vystup.perioda = data.qh_perioda;
    data_vystup.qh_num_year = data.qh_num_year;
    data_vystup.smer = "POS";
    data_vystup.lmol = data.aFRR_POS.sort((a, b) => a.price - b.price);

  
    res.render('PICASSO_lmol',  {dataJSON: data_vystup});

} catch (err) {

  console.error('Error fetching data:', err);
  res.status(500).send('Internal Server Error');
}
  
})

// ------------------------------------------------------------------------------------------ POST

router.post('/',checkAuthenticated, async(req,res) => {

  const { direction, smer, qh_num_year, qh_perioda } = req.body;

  let new_qh_num = parseInt(qh_num_year);
  let podmienka = false;

  if (direction.toString() == "backward") {

    new_qh_num = new_qh_num - 1;
    
  } else if  (direction.toString() == "forward")  {

    new_qh_num = new_qh_num + 1;

  } else {

    podmienka = true;

  }

  let query = {};
  let zoznam_riadkov = {};

  if (smer == "POS" && podmienka == false ) {

    query = {qh_num_year: new_qh_num};
    zoznam_riadkov = {aFRR_NEG: 0,
                            ceny_SEPS: 0,
                            Cena_SEPS_POS_avg: 0,
                            Cena_SEPS_POS_max: 0,
                            Cena_SEPS_POS_min: 0,
                            Cena_SEPS_NEG_avg: 0,
                            Cena_SEPS_NEG_max: 0,
                            Cena_SEPS_NEG_min: 0,
                            _id: 0 
                          }


  } else if (smer == "POS" && podmienka == true ) {

    query = {qh_perioda: qh_perioda};
    zoznam_riadkov = {aFRR_NEG: 0,
                            ceny_SEPS: 0,
                            Cena_SEPS_POS_avg: 0,
                            Cena_SEPS_POS_max: 0,
                            Cena_SEPS_POS_min: 0,
                            Cena_SEPS_NEG_avg: 0,
                            Cena_SEPS_NEG_max: 0,
                            Cena_SEPS_NEG_min: 0,
                            _id: 0 
                          }


    
  } else if  (smer == "NEG" && podmienka == false ) {

    query = {qh_num_year: new_qh_num};
    zoznam_riadkov = {aFRR_POS: 0,
                            ceny_SEPS: 0,
                            Cena_SEPS_POS_avg: 0,
                            Cena_SEPS_POS_max: 0,
                            Cena_SEPS_POS_min: 0,
                            Cena_SEPS_NEG_avg: 0,
                            Cena_SEPS_NEG_max: 0,
                            Cena_SEPS_NEG_min: 0,
                            _id: 0 
                          }


  } else if (smer == "NEG" && podmienka == true ) {

      query = {qh_perioda: qh_perioda};
      zoznam_riadkov = {aFRR_POS: 0,
                              ceny_SEPS: 0,
                              Cena_SEPS_POS_avg: 0,
                              Cena_SEPS_POS_max: 0,
                              Cena_SEPS_POS_min: 0,
                              Cena_SEPS_NEG_avg: 0,
                              Cena_SEPS_NEG_max: 0,
                              Cena_SEPS_NEG_min: 0,
                              _id: 0 
                            }

  }


    try{

        const data = await QH_picasso_lmol.findOne(query, zoznam_riadkov).sort({ qh_num_year: -1 }).exec();
    
        data_vystup = {};
    
        data_vystup.perioda = data.qh_perioda;
        data_vystup.qh_num_year = data.qh_num_year;

        if (smer == "POS") {

          data_vystup.smer = "POS";
          data_vystup.lmol = data.aFRR_POS.sort((a, b) => a.price - b.price);

        } else {

          data_vystup.smer = "NEG";
          data_vystup.lmol = data.aFRR_NEG.sort((a, b) =>  b.price - a.price);

        }


        res.render('PICASSO_lmol',  {dataJSON: data_vystup});
     

    } catch (err) {
    
      console.error('Error fetching data:', err);
      res.status(500).send('Internal Server Error');
    }

    });


function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
  }   

module.exports = router