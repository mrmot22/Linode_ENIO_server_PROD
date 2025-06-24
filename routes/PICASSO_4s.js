const express = require('express')
const router = express.Router()



const S4_picasso = require('../models/4s_data'); 


//   - Start of the router --HOME -- 

router.get('/',checkAuthenticated, async(req, res) => {


  try{

    const S4_data = await S4_picasso.findOne().sort({ qh_num_year: -1 }).exec();


    res.render('PICASSO_4s', { dataJSON: S4_data});

  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Internal Server Error');
  }

  
})


router.post('/',checkAuthenticated, async(req,res) => {

  const { direction, currentHour, qh_num_year } = req.body;

  let new_qh_num = parseInt(qh_num_year);

  if (direction.toString() == "backward") {

    new_qh_num = new_qh_num - 1;
    
  } else if  (direction.toString() == "forward")  {

    new_qh_num = new_qh_num + 1;

  }


  try{


    console.log(new_qh_num);

    if (new_qh_num != parseInt(qh_num_year)){

      S4_data = await S4_picasso.findOne({qh_num_year: new_qh_num}).exec();

    } else {

      S4_data = await S4_picasso.findOne({qh_perioda: currentHour}).exec();

    }
    
    if (!S4_data)  {

      data_vystup = {};

      data_vystup.qh_num_year = new_qh_num;
      data_vystup.qh_perioda = currentHour;
      data_vystup.ceny_SEPS = [
        
        {"cas": "N/A"},
        {"cas": "N/A"}];

      console.log(data_vystup)

      res.render('PICASSO_4s', { dataJSON: data_vystup });
    }

    res.render('PICASSO_4s', { dataJSON: S4_data });

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