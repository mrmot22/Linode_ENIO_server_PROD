const express = require('express')
const router = express.Router()

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

router.get('/:period?', checkAuthenticated, async (req, res) => {
    const today = new Date()
    const tomorrow = new Date(today)
    let currentHours = today.getHours()

    // Set the date to tomorrow if it's past the typical market data release time
    if (currentHours >= 14) {
        tomorrow.setDate(today.getDate() + 1)
    }

    const formattedDate = tomorrow.toISOString().split('T')[0]

    // Validate period parameter - must be either 'period-15' or 'period-60'
    let period = req.params.period
    if (!period || (period !== 'period-15' && period !== 'period-60')) {
        period = 'period-15' // Default to period-15 if invalid or missing
    }

    res.render('market-orderbook', { currentHour: formattedDate, dataJSON: [], period: period })
})
module.exports = router;
