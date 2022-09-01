# pass-elide-sample-data
Includes a small set of sample data plus a loader. This is meant only as a proof of concept for exercising out Elide demo.

For now, local testing of the data and loader was run against a standalone Elide using the in-memory DB (not the PostgreSQL backend). See https://github.com/jabrah/pass-elide-test/tree/update-some-columns for the demo

The data has its own set of IDs to make authoring a bit easier. The loading script ignores these IDs, loads them through the Elide API without the IDs to let that system generate its own set of IDs. The loading script then remaps the relationships in the data files to match the backend generated IDs on the fly. This does mean that it requires a strict data loading order so that the script knows about the backend IDs before they are needed.

## Prerequisites

* Java 11
* Maven 3.8.5+
* NodeJS 16.16.0 (lts/gallium)

## Running the loader

* Clone the Elide demo repository (https://github.com/jabrah/pass-elide-test/tree/update-some-columns)
* In the Elide demo directory, build the project and run the executable Jar: `mvn clean install && java -jar ./target/pass-elide-test.jar`
* In this project's directory, run `node ./src/index.js` to load the sample data.

You can now make requests against the Elide API.

## Notes

* Can we nest entities based on relationships to streamline the data files?
* I have no intention of producionizing this code, since we have proper data loaders elsewhere
* Does the loader work when the Elide demo is using the PostgreSQL backend?
