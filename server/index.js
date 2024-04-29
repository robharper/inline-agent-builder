const express = require('express');
const {buildSearch, searchResultsToHtml}= require('./search');

const app = express();
require('dotenv').config();

// Configuration
const env = {
  port: process.env.PORT || 3000,
  projectId: process.env.PROJECT_ID,
  dataStoreId: process.env.DATASTORE_ID,
  servingConfigId: process.env.SERVING_CONFIG_ID,
  location: process.env.LOCATION,
  searchConfig: process.env.SEARCH_CONFIG ? JSON.parse(process.env.SEARCH_CONFIG) : {},
};

// Validate
if (!env.projectId || !env.dataStoreId) {
  console.error('Missing required environment variables PROJECT_ID or DATASTORE_ID');
  process.exit(-1);
}

// Search endpoint
const searchFn = buildSearch({
  projectId,
  dataStoreId,
  servingConfigId,
  searchConfig
} = env);

app.get('/search', (req, res) => {
  const query = req.query.q;
  const filters = req.query.filters;
  const context = req.query.context;

  if (query) {
    searchFn({
      query,
      context,
      filters
    }).then(jsonResult => {
      if (req.accepts('html')) {
        const html = searchResultsToHtml(jsonResult);
        res.send(html);
      } else if (req.accepts('json')) {
        res.json(jsonResult);
      } else {
        res.statusCode = 406;
        res.send('Invalid request type');
      }
    }).catch(e => {
      res.statusCode = 500;
      console.error(e);
      res.send('Error');
    });
  } else {
    res.statusCode = 400;
    res.send('Missing query string');
  }
});

// Serve all client-side built artifacts
app.use(express.static('public'));

app.listen(env.port, () => {
  console.log(`Search server started on port ${env.port}`)
})