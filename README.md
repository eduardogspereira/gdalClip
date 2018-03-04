# gdalClip

Clip geometries between two datasets while maintain the attributes from both.

## Dependencies

* [gdal](https://www.npmjs.com/package/gdal)

## Setup

```bash
npm install gdalclip
```

## Usage

```bash
const data = gdalclip.processData(<clipFeature>, <inputFeature>, <outputName>, <outputFormat>);
```

## Sample Usage

```bash
const gdalclip = require('gdalclip');
const gdal = require('gdal');

const getFeatures = shapefile => gdal.open(shapefile).layers.get(0);

const baseData = getFeatures('path/to/baseData.shp');
const clipData = getFeatures('path/to/clipData.shp');

gdalclip.processData(talhoes, solos, 'path/to/outputData.shp', 'ESRI Shapefile');
```

## Ilustration

![](static/illustration.png)

---

=^]
