# Inline Agent Builder
This repository contains a DIY approach for replacing the default Google Vertex AI Search Agent Builder widget with a custom inline HTML solution. The default agent builder widget provides a Google-designed, Material-themed immersive search popup experience. It works great and covers most use cases for integrating search into an existing site. However, it has the following limitations:

1. The search experience occurs within a screen-filling popup rather than directly within the host page
2. The styling of the experience is Material Design rather than consistent with the host page
3. There is no option to augment the user's search input with additional context (e.g. additional information from the user session, or section of the site)
4. There is no option to use [Filters](https://cloud.google.com/generative-ai-app-builder/docs/filter-search-metadata) to limit the scope of documents searched

This repo contains a very basic node.js server allowing a more immersive, controllable search experience. The server handles calls to the search service and returns HTML-formatted results. The client can be any front-end solution that can consume this HTML-returning endpoint. The example in this repo uses [htmx](https://htmx.org/) to fetch and drop the search results into an existing page.

## Using

In short:
1. Replace or edit `public/index.html` to reflect the site to which you'd like to add search
2. Create the `.env` file with contents similar to `sample.env`. It must contain a few key details and supports the customization of how search results are returned
3. Login to your GCP project via `gcloud auth application-default login`
4. Locally, run `npm run serve` and head to http://localhost:3000

### Endpoints

#### `/search`
 - Accepts the following query params:
    - `q` the search query
    - `filter` optional filter string
    - `context` optional additional search context to append to the `q` string
 - Can return `json` or `html` responses.

### To deploy

#### Local Docker
Set the env var `GOOGLE_APPLICATION_CREDENTIALS` to the credentials file created on `gcloud auth application-default login` (usually somewhere in ~/.config/gcloud/...)

Set `$REPO` to your artifact registry path, e.g. `$REGION-docker.pkg.dev/PROJECT_ID/REPO_NAME`

```bash
# Build
docker build -t $REPO/$DEMO_NAME:latest .

# Run
docker run --rm -it -p 8080:8080 \
-e GOOGLE_APPLICATION_CREDENTIALS=/tmp/keys/google_auth.json \
-v $GOOGLE_APPLICATION_CREDENTIALS:/tmp/keys/google_auth.json:ro \
$REPO/$DEMO_NAME:latest
```

#### Cloud Run

```bash
gcloud run deploy $DEMO_NAME --image $REPO/$DEMO_NAME:latest
```


## Limitations
This is a **very** basic implementation with a ton of raw edges and missing capabilities. To name a few:
1. No ReCAPTCHA or other bot-prevention measures
2. Limited rendering of the results from the API (just a title, snippet, etc)
3. No support for handling citations in Cloud Storage (e.g. creating signed urls to access the content)
4. Fragile code handling the response - it'll probably break in many many cases

## Work Remaining
- Clean up
- Styling and use examples
- Docker auth + deploy via Cloud Run
