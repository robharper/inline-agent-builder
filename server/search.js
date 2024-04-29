const path = require('path');
const fs = require('fs');
const {SearchServiceClient} = require('@google-cloud/discoveryengine').v1beta;
const ejs = require('ejs');
const showdown  = require('showdown');

// Rendering helpers:
const converter = new showdown.Converter();
const resultsTemplate = fs.readFileSync(path.join(__dirname, 'results.ejs')).toString();

// Citation regex
const regex = /\[(\d+)\]/g;

/**
 * Translates a search API response to HTML
 * @param results: Return value from client.search()[2]
 * @returns
 */
const renderSearchResults = function(data) {
  // Map results to cleaner struct
  const refs = data.results?.map(r => {
    const refData = r.document?.derivedStructData?.fields;
    const extract = refData?.extractive_answers?.listValue?.values?.[0]?.structValue?.fields;
    const snippet = refData?.snippet?.listValue?.values?.[0]?.structValue?.fields;
    return {
      title: refData?.title?.stringValue ?? refData?.link?.stringValue,
      link: refData?.link?.stringValue,
      snippet: extract?.content?.stringValue ?? snippet?.snippet?.stringValue,
      page: extract?.pageNumber?.stringValue,
    };
  });

  let answer = null;
  if (data.summary?.summaryText) {
    // Replace citations in summary text with hyperlinks
    const replaceFunction = (match, citationNumber) => {
      const url = refs[citationNumber]?.link;
      return url ? `[[${citationNumber}]](${url})` : `[${citationNumber}]`;
    };

    markdown = data.summary.summaryText.replace(regex, replaceFunction);

    // Markdown to HTML
    answer = converter.makeHtml(markdown);
  }

  return ejs.render(resultsTemplate, {
    answer,
    refs
  });
}

/**
 * Creates and returns a search async function
 */
module.exports = function(config) {
  const {
    projectId,                              // Project id, required
    dataStoreId,                            // Datastore id, required
    location = 'global',                    // Options: 'global', 'us', 'eu'
    collectionId = 'default_collection',    // Options: 'default_collection'
    servingConfigId = 'default_config',     // Options: 'default_config'
    searchConfig
  } = config;

  // For more information, refer to:
  // https://cloud.google.com/generative-ai-app-builder/docs/locations#specify_a_multi-region_for_your_data_store
  const apiEndpoint =
    location === 'global'
      ? 'discoveryengine.googleapis.com'
      : `${location}-discoveryengine.googleapis.com`;

  // Instantiates a client
  const client = new SearchServiceClient({apiEndpoint: apiEndpoint});

  // The full resource name of the search engine serving configuration.
  // Example: projects/{projectId}/locations/{location}/collections/{collectionId}/dataStores/{dataStoreId}/servingConfigs/{servingConfigId}
  const name = client.projectLocationCollectionDataStoreServingConfigPath(
    projectId,
    location,
    collectionId,
    dataStoreId,
    servingConfigId
  );

  /**
   * The search function to be returned
   * @param {*} query The user query to submit
   * @param {*} context (optional) Additional context to append to query (e.g. directive to LLM)
   * @param {*} filter (optional) Filter string, e.g. 'siteSearch:"https://example.com/subset_path"'
   * @returns HTML text string
   */
  const searchFunction = async function({
    context,
    query,
    filters,
  }) {
    if (context) {
      query += '\n' + context;
    }
    const request = Object.assign({
        query,
        filters,
        servingConfig: name,
      }, searchConfig
    );

    const IResponseParams = {
      ISearchResult: 0,
      ISearchRequest: 1,
      ISearchResponse: 2,
    };

    // Perform search request
    const response = await client.search(request, {
      autoPaginate: false,
    });
    return renderSearchResults(response[IResponseParams.ISearchResponse]);
  };

  return searchFunction;
};
