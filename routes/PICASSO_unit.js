const express = require('express')
const router = express.Router()



const QH_picasso_lmol = require('../models/4s_data'); 


//   - Start of the router --HOME -- 

router.get('/',checkAuthenticated, async(req, res) => {


  try{

    const today = new Date();

    const formattedDate = today.toISOString().split('T')[0];
    let den_query = formattedDate.replace(/-/g,'_') // Format: YYYY-MM-DD

    const aggregationPipeline = [
        { 
          $match: {
            qh_perioda: { $regex: `^${den_query}` },
            aFRR_POS: { $exists: true }  // Ensure the field exists
          }
        },
        { $unwind: "$aFRR_POS" },
        {$group: {
          _id: "$aFRR_POS.UNIT", // Group by UNIT 
        }},
        { $sort: { _id: 1 } }, // Sort the results alphabetically 
        { $project: { _id: 0, UNIT: "$_id" } } // Rename _id to UNIT
    ];


    const uniqueUnits = await QH_picasso_lmol.aggregate(aggregationPipeline);
    const unitList = uniqueUnits.map(item => item.UNIT);

    let unit_id = unitList[0]; // Default to the first unit in the list

    const query = { "aFRR_POS": { $elemMatch: { "UNIT": unit_id} } };
    query["qh_perioda"] = { $regex: `^${ den_query }` } 

    const data = await QH_picasso_lmol.find(query,
      {
        cas_zaciatok: 1,
        aFRR_POS: 1,
      }
    );

    
    const result = data.flatMap(entry => {
      // Filter the aFRR_POS array to only include the matching UNIT
      return entry.aFRR_POS
          .filter(item => item.UNIT === unit_id) // Filter by UNIT and stav === true   && item.stav === true
          .map(item => ({
              cas: entry.cas_zaciatok,
              UNIT: item.UNIT,
              quantity: item.quantity,
              price: item.price
          }));
  });


res.render('PICASSO_unit', { currentDay: formattedDate, smer: "POS", unitList: unitList, unitFinder: unit_id, dataJSON: result }); // Render PICASSO_unit.ejs and pass the data


} catch (err) {

  console.error('Error fetching data:', err);
  res.status(500).send('Internal Server Error');
}
  
})


//----------------------------------------------------------------------------------------------------------------------------- POST


router.post('/',checkAuthenticated, async(req,res) => {

  const { direction, smer, currentDay, unitFinder} = req.body;

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

  if (smer == "POS") {

    try{

  
      const aggregationPipeline = [
        { 
          $match: {
            qh_perioda: { $regex: `^${den_query}` },
            aFRR_POS: { $exists: true }  // Ensure the field exists
          }
        },
        { $unwind: "$aFRR_POS" },
        {$group: {
          _id: "$aFRR_POS.UNIT", // Group by UNIT 
        }},
        { $sort: { _id: 1 } }, // Sort the results alphabetically 
        { $project: { _id: 0, UNIT: "$_id" } } // Rename _id to UNIT
      ];

      const uniqueUnits = await QH_picasso_lmol.aggregate(aggregationPipeline);
      const unitList = uniqueUnits.map(item => item.UNIT);  

      let unit_id = unitList[0]; // Use the selected unit from the form

      const query = { "aFRR_POS": { $elemMatch: { "UNIT": unitFinder} } };
      query["qh_perioda"] = { $regex: `^${ den_query }` } 
  
      const data = await QH_picasso_lmol.find(query,
        { 
          cas_zaciatok: 1,
          aFRR_POS: 1
        }
      );
  
      const result = data.flatMap(entry => {
        // Filter the aFRR_POS array to only include the matching UNIT
        return entry.aFRR_POS
            .filter(item => item.UNIT === unitFinder) // Filter by UNIT and stav === true   && item.stav === true
            .map(item => ({
                cas: entry.cas_zaciatok,
                UNIT: item.UNIT,
                quantity: item.quantity,
                price: item.price
            }));
    });
  
  
  
      res.render('PICASSO_unit', { currentDay: formattedDate, smer: smer, unitList: unitList, unitFinder: unitFinder, dataJSON: result }); // Render index.ejs and pass the data
      
    } catch (err) {
      
        console.error('Error fetching data:', err);
        res.status(500).send('Internal Server Error');
    }

  } else {

    try{


        const aggregationPipeline = [
          { 
            $match: {
              qh_perioda: { $regex: `^${den_query}` },
              aFRR_NEG: { $exists: true }  // Ensure the field exists
            }
          },
          { $unwind: "$aFRR_NEG" },
          {$group: {
            _id: "$aFRR_NEG.UNIT", // Group by UNIT 
          }},
          { $sort: { _id: 1 } }, // Sort the results alphabetically 
          { $project: { _id: 0, UNIT: "$_id" } } // Rename _id to UNIT
        ];

      const uniqueUnits = await QH_picasso_lmol.aggregate(aggregationPipeline);
      const unitList = uniqueUnits.map(item => item.UNIT);

      let unit_id = unitList[0]; // Use the selected unit from the form

      const query = { "aFRR_NEG": { $elemMatch: { "UNIT": unit_id} } };
      query["qh_perioda"] = { $regex: `^${ den_query }` } 
  
      const data = await QH_picasso_lmol.find(query,
        { cas_zaciatok: 1,
          aFRR_NEG: 1 
        }
      );
  
      const result = data.flatMap(entry => {
        // Filter the aFRR_POS array to only include the matching UNIT
        return entry.aFRR_NEG
            .filter(item => item.UNIT === unitFinder) // Filter by UNIT and stav === true   && item.stav === true
            .map(item => ({
                cas: entry.cas_zaciatok,
                UNIT: item.UNIT,
                quantity: item.quantity,
                price: item.price
            }));
        });
  
  
    res.render('PICASSO_unit', { currentDay: formattedDate, smer: smer, unitList: unitList, unitFinder: unitFinder, dataJSON: result }); // Render index.ejs and pass the data
  
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