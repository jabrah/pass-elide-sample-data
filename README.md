# pass-elide-sample-data
Includes a small set of sample data plus a loader

For now, local testing of the data and loader was run against a standalone Elide using the in-memory DB (not the PostgreSQL backend). See https://github.com/markpatton/pass-elide-test for the demo

The data has its own set of IDs to make authoring a bit easier. The loading script ignores these IDs, loads them through the Elide API without the IDs to let that system generate its own set of IDs. The loading script then remaps the relationships in the data files to match the backend generated IDs on the fly. This does mean that it requires a strict data loading order so that the script knows about the backend IDs before they are needed.
