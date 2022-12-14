require('dotenv').config();

const PassRemapper = require('./remapper');

const fs = require('fs').promises;

const axios = require('axios');

const files = [
  './data/users.json',
  './data/journals.json',
  './data/publications.json',
  './data/repositories.json',
  './data/policies.json',
  './data/funders.json',
  './data/grants.json',
  './data/submissions.json'
];

/** Maps original entities to backend ID */
const passMapper = new PassRemapper();

async function readAsJson(filename) {
  try {
    console.log(`Reading file ${filename}`);
    const data = await fs.readFile(filename);
    return JSON.parse(data);
  } catch (error) {
    console.error(`Failed to read file (${filename}): [${error.message}]`);
  }
}

/**
 * We'll strip the original ID to let the backend auto increment.
 * Original IDs are meant for easier authoring of the sample data, so
 * they are fine to change at runtime, as long as the relationships are
 * maintained.
 * 
 * Here, a mapping is maintained in memory between original and backend
 * IDs to that relationships can be updated. Because ingests must be 
 * staged anyway, we will have all relevant relationship IDs in the mapping
 * before they are needed, so the relationships can be updated before the
 * data is POSTed
 */
function handleEntity(obj) {
  let copy = Object.assign({}, obj);
  const type = copy.type;

  copy = passMapper.updateRelationships(copy);

  delete copy.id;
  
  const path = process.env.LOADER_API_NAMESPACE;

  const req_opt = {
    host: process.env.LOADER_API_HOST,
    port: process.env.LOADER_API_PORT,
    path: `/${path}/${type}`,
    method: 'POST',
    headers: {  
      accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json'
    }
  };

  // const url = `${req_opt.method} '${req_opt.host}:${req_opt.port}${req_opt.path}'`;
  const url = `${req_opt.host}:${req_opt.port}${req_opt.path}`;
  console.log(`Request: [POST] (${url})`);

  return axios.post(
    url,
    { data: copy },
    {
      headers: {
        accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      },
    }
  ).then(async (data) => {
    if (data.data) {
      passMapper.add(obj, data.data);
      console.log(`   > Response (${url})`);
    } else {
      const error = data.error || data.errors;
      console.error(`  !! Error for request (${url}): ${JSON.stringify(error)}`);
    }
    
  }).catch((error) => {
    console.error(`  !! Error for request [POST] (${url}): ${JSON.stringify(error)}`);
  });
}

function handleArray(arr) {
  const reqs = [];
  
  for (let entity of arr) {
    reqs.push(handleEntity(entity));
  }

  return Promise
    .all(reqs)
    .catch((error) => {
      console.error(`  #### ${JSON.stringify(error)}`);
      process.exit(1);
    });
}

async function uploadData() {
  console.log(files);
  for (let file of files) {
    console.log(`### ${file}`);
    const data = await readAsJson(file);
    await handleArray(data);
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function pingBackend() {
  const url = `${process.env.LOADER_API_HOST}:${process.env.LOADER_API_PORT}/${process.env.LOADER_API_NAMESPACE}/user`;
  
  console.log(`  >> Trying pass-core (${url})`);

  const resp = await axios.get(url)
    .catch((e) => ({ status: 500 }));

  console.log(`    -- ${resp.status}`);

  return resp;
}

/**
 * Poll the backend until we get a 200 reponse AND
 * the response returns data.
 * 
 * @returns {boolean} TRUE if returned data is empty
 *                    FALSE if data already exists
 * @throws {Error} if waiting times out
 */
async function waitAndCheckForData() {
  let i = 0;
  let repeat = true;

  console.log(`## Loader :: Waiting for pass-core to be ready ##`);
  while (i < (process.env.LOADER_RETRIES || 100) && repeat) {
    i++;

    const response = await pingBackend();
    repeat = response.status < 200 || response.status > 299;

    if (!repeat) {
      return Array.isArray(response.data.data) && response.data.data.length === 0;
    }

    await sleep(5000);
  }

  process.exit('Backend failed to respond in time.');
}

async function main() {
  console.log(JSON.stringify(process.env));

  await waitAndCheckForData();
  uploadData();
}

main();
