require('dotenv').config();

const PassRemapper = require('./remapper');

const fs = require('fs').promises;
const request = require('http').request;

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
  
  const jsonapiObj = JSON.stringify({ data: copy });
  const path = process.env.API_PATH || 'api/v1';

  const req_opt = {
    host: process.env.API_HOST || 'localhost',
    port: process.env.API_PORT || '8080',
    path: `/${path}/${type}`,
    method: 'POST',
    headers: {  
      accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json'
    },
    timeout: process.env.API_TIMEOUT || 10000
  };

  const url = `${req_opt.method} '${req_opt.host}:${req_opt.port}${req_opt.path}'`;
  console.log(`Request: (${url})`);

  const promise = new Promise((resolve, reject) => {
    const post = request(req_opt, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        const data = JSON.parse(chunk);

        if (data.data) {
          passMapper.add(obj, data);
  
          console.log(`   > Response (${url})`);
          resolve();
        } else {
          const error = data.error || data.errors;
          console.error(`  !! Error for request (${url}): ${JSON.stringify(error)}`);
          // console.error(`  ## Originalobj: ${JSON.stringify(obj, null, 2)}`)
          console.error(`  ## Backend obj: ${JSON.stringify(copy, null, 2)}`);
          reject();
        }
      });
    });

    post.on('error', (error) => {
      console.error(`  !! Error for request (${url}): ${error.message}`);
      reject();
    });

    post.on('timeout', () => post.destroy());

    post.write(jsonapiObj);
    post.end();
  });
  
  return promise;
}

function handleArray(arr) {
  const reqs = [];
  
  for (let entity of arr) {
    reqs.push(handleEntity(entity));
  }

  return Promise
    .all(reqs)
    .catch((error) => {
      console.error(`  #### ${JSON.stringify(error)}`)
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

uploadData();
