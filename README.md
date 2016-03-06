# hobbes-network-format
Hobbes network filesystem format (HNFF) validator and tools

## README Overview

- [File Types](#file-types)
- [Folder Structure](#folder-structure)
- [Referencing Data Files](#referencing-data-files)
- [Command Line Tool](#command-line-tool)

## File Types

The Hobbes network filesystem as four file types:
[nodes](#nodes), [links](#links), [regions](#regions) and [config](#config).
Please see sections below for details on each.

#### Config

At the root of your data directory should be a conf.json.  This file contains
the following information:

```json
{
  "id" : "prmname",
  "region" : "region.geojson",
  "node" : "node.geojson",
  "link" : "link.geojson"
}
```

Parameters
 - id: Unique id variable for the node.  Defaults to **id**.
 - region: Name of region geojson files. Defaults to **region.geojson**.
 - node: Name of node geojson files. Defaults to **node.geojson**.
 - link: Name of link geojson files. Defaults to **link.geojson**.

This file is optional.  All defaults will be used if file is not provided.

#### Nodes

Nodes should be geojson formatted with type 'Feature' and geometry type 'Point'.
Nodes should provide a unique identifier.  The default property for this identifier
is node.properties.id, but an alternative property can be specified in the conf.json
file.

```json
{
  "type" : "Feature",
  "geometry" : {
    "type" : "Point",
    "coordinates" : [0, 0]
  },
  "properties" : {
    "id" : "12345",
    "other" : "prop"
    ....
  }
}
```

Additional information will be added by the Hobbes Network Filesystem Crawler in
under node.properties.hobbes.

#### Links

Links should be geojson formatted with type 'Feature'.  Links should NOT provide
a geometry.  However, the link MUST provide an 'origin' and 'terminus' property instead.
The 'origin' and 'terminus' property values should be the unique identifier of the links
origin and terminus nodes respectively.  The Hobbes Network Filesystem Crawler
will lookup the origin and terminus nodes when crawling the network and set the
appropriate 'LineString' geometry based on the geometry of the two nodes.

The link should provide a default property for this identifier as well.  Like the
node, the default id attribute is node.properties.id, but an alternative property
can be specified in the conf.json file.

```json
{
  "type" : "Feature",
  "properties" : {
    "id" : "12345-67890",
    "origin" : "12345",
    "terminus" : "67890",
    "other" : "prop"
    ....
  }
}
```

Additional information will be added by the Hobbes Network Filesystem Crawler in
under node.properties.hobbes.

#### Regions

Regions should be geojson formatted with type 'Polygon' or 'MultiPolygon'.  


```json
{
  "type" : "Feature",
  "geometry" : {
    "type" : "Polygon",
    "coordinates" : [[[], [], ....]]
  },
  "properties" : {
    "other" : "prop"
    ....
  }
}
```

Additional information will be added by the Hobbes Network Filesystem Crawler in
under node.properties.hobbes.

## Folder Structure

Your nodes and links should be organized by Region.  While this is not a requirement
(the Hobbes Network Filesystem Crawler will run just fine w/o region.geojson files),
Regions give you a nice way to break out your nodes/links into multiple folders,
providing easier lookups when editing and avoids giant folders with an unwieldy
number of nodes.

In each region folder, you should provide folders for nodes/links within that
region.  Each region folder can also contain other region folders, so regions can
have sub-regions.

Finally, each node/link should have it's own folder containing a node.geojson or
link.geojson file.  The node/link folder can then contain any number of resource
files referenced via the $ref property.  More about the $ref property below below.

**File System Structure**
- Root
  - Region1
    - Node1
      - node.geojson
      - data.csv
    - Node2
      - node.geojson
      - data.csv
    - Link1
      - link.geojson
    - Region1a
      - Node1a
        - node.geojson
        - data.csv
  - Region2
    - Node3
      - node.geojson
    - Link2
      - link.geojson

You can see a real world example of the calvin network [here](https://github.com/ucd-cws/calvin-network-data/tree/master/data).

## Referencing Data Files

The Hobbes Network Filesystem Format is designed to help you develop network
data using the power of source control systems like GIT.  In order to help track
changes within your data it is helpful to break out your node data into several
files.

Let's use the example of timeseries data.  Say for a node you want to have timeseries
data for 100 years at a 1 month interval.  You may want to update this dataset
frequently, but the node never moves.  Or, conversely, you may move the node, but
timeseries data doesn't change.  Having two separate files, one for the data
and one for the geojson, helps track when only one component changes and the other
does not.  Also, separating the data from the geojson keeps the geojson file
'human-readable' (hopefully).

#### $ref

In order to link external data files to a geojson file, we have introduced? (well
it may be a not well used standard...) a $ref notation.  The $ref contains a
relative path to the file that should be read.

Let's say we have a fully formed node that looks like:
```json
{
  "type" : "Feature",
  "geometry" : {
    "type" : "Point",
    "coordinates" : [0, 0]
  },
  "properties" : {
    "id" : "12345",
    "timeseries" : [
      ["Date", "KAF"],
      ["1901-10", 1.23],
      ["1901-11", 1.56]
      .....
    ]
  }
}
```

We can split out the timeseries data into it's own data.csv file.  So now the
node would look like:

```json
{
  "type" : "Feature",
  "geometry" : {
    "type" : "Point",
    "coordinates" : [0, 0]
  },
  "properties" : {
    "id" : "12345",
    "timeseries" : {
      "$ref" : "data.csv"
    }
  }
}
```

Were the $ref is the relative path to the data file.

#### $ref file parsing

Currently .json and .csv files have advanced parsing support.  JSON files will
be parsed as json and replace the $ref with the newly parsed object.  CSV files
will be parsed and replace the $ref with a multi dimensional array.

Other formats will be read, but there contents will be inserted as a String value.

## Command Line Tool

This repo can be used as a dependency in your project, exposing the directory crawler.
Optionally, you can install this tool via npm globally and add the hnf command
line tool:

```bash
npm install -g hobbes-network-format
```

You can then use the 'hnf' command to access various parts of the network as well
as verify all parts of the network are working.

Use --help for all options
```bash
hnf --help
```

#### Examples:

Print all node, links and regions.

```bash
hnf -d /path/to/you/data/repo
```

Verify the final result of all nodes and regions are valid geojson.

```bash
hnf -d /path/to/you/data/repo -e
```
