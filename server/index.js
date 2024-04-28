const express = require('express');
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

// Search endpoint
const searchFn = require('./search')({
  projectId,
  dataStoreId,
  servingConfigId,
  searchConfig
} = env);

app.get('/search', (req, res) => {
  const query = req.query.q;
  if (query) {
    searchFn(req.query.q).then(result => {
      res.send(result);
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