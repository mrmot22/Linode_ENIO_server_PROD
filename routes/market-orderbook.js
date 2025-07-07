const express = require('express')
const router = express.Router()

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

router.get('/', checkAuthenticated, async (req, res) => {
    const today = new Date();
    const tomorrow = new Date(today);
    let currentHours = today.getHours();

    // Set the date to tomorrow if it's past the typical market data release time
    if (currentHours >= 11) {
        tomorrow.setDate(today.getDate() + 1);
    }

    const formattedDate = tomorrow.toISOString().split('T')[0];

    // The dataJSON part is a leftover from the copy, but we'll pass an empty array
    // to prevent errors in the EJS template that still loops over it for the table.
    // The chart itself will be populated by WebSockets.
    res.render('market-orderbook', { currentHour: formattedDate, dataJSON: [] });
});

module.exports = router; 