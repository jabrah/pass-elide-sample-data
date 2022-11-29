# pass-elide-sample-data
Includes a small set of sample data plus a loader. This is meant only as a proof of concept for exercising out Elide demo.

For now, local testing of the data and loader was run against a standalone Elide using the in-memory DB (not the PostgreSQL backend). See https://github.com/jabrah/pass-elide-test/tree/update-some-columns for the demo

The data has its own set of IDs to make authoring a bit easier. The loading script ignores these IDs, loads them through the Elide API without the IDs to let that system generate its own set of IDs. The loading script then remaps the relationships in the data files to match the backend generated IDs on the fly. This does mean that it requires a strict data loading order so that the script knows about the backend IDs before they are needed.

## Prerequisites

* NodeJS 16.16.0 (lts/gallium)

## Building

`npm run build:docker`

This will build a Docker image for this service with a tag version to match the package version found in `package.json` (works for Bash).

If you need a new tag, you can run `docker tag <original_image:tag> <target_image:tag>`

## Running the loader

### Locally

This will require Java 11 and Maven 3.8.5+



* Clone the Elide demo repository (https://github.com/jabrah/pass-elide-test.git) and checkout the `update-some-columns` branch
* In the Elide demo directory, build the project and run the executable Jar: `mvn clean install && java -jar ./target/pass-elide-test.jar`
* In this project's directory, run `node ./src/index.js` to load the sample data.

You can now make requests against the Elide API.

### Docker Environment

Run the loader in the [`pass-docker`](https://github.com/eclipse-pass/pass-docker) demo environment:

*I recommend that the loader only be run against a fresh database to avoid "duplicated" data.*

* Run the local demo environment (from pass-docker): `./demo.sh pull && ./demo.sh up -d` Optionally use `./demo.sh logs -f` to tail the docker logs
* Build a new Docker image for the loader: `npm run build:docker`
* Remove the `@sha256...` hash for the loader image from the `demo.yml` file (and make sure that the newly built image tag matches the tag in the compose file)
* Bring the environment down and clear volumes: `./demo.sh down -v`
* Bring the environment back up with the commands in the first step

The loader will wait for `pass-core` to start up and respond to HTTP requests with a code `200`, then dump its data through `pass-core` into the Postgres database.

## Notes

* Can we nest entities based on relationships to streamline the data files?
* I have no intention of producionizing this code, since we have proper data loaders elsewhere
