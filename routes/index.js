const router = require('express').Router(),
  apiRoutes = require('./api');

let usedApiRoutes = apiRoutes;

delete usedApiRoutes.webhooksRoutes;

router.use('/', usedApiRoutes);

module.exports = router;
