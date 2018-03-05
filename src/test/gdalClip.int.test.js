const gdalClip = require('../index.js');
const gdal = require('gdal');

const getFeatures = data => gdal.open(data).layers.get(0);
const lines = getFeatures('./src/test/data/base_lines.shp');
const point = getFeatures('./src/test/data/base_points.shp');
const polygons = getFeatures('./src/test/data/base_polygons.shp');
const clipPolygons = getFeatures('./src/test/data/cut_polygons.shp');

describe('gdalMultiToSingle', () => {
  it('should output the correct number of features', () => {
    const clippedLines = gdalClip.processData(
      clipPolygons,
      lines,
      '/vsimem/clippedlines.shp',
      'ESRI Shapefile',
    );
    expect(getFeatures(clippedLines).features.count()).toBe(9);

    const clippedPoints = gdalClip.processData(
      clipPolygons,
      point,
      '/vsimem/clippedpoints.shp',
      'ESRI Shapefile',
    );
    expect(getFeatures(clippedPoints).features.count()).toBe(16);

    const clippedPolygons = gdalClip.processData(
      clipPolygons,
      polygons,
      '/vsimem/clippedpolygons.shp',
      'ESRI Shapefile',
    );
    expect(getFeatures(clippedPolygons).features.count()).toBe(82);
  });

  it(`should fail if the input geometry isn't a polygon|multipolygons`, () => {
    expect(() =>
      gdalClip.processData(point, lines, '/vsimem/clippedpolygons.shp', 'ESRI Shapefile'),
    ).toThrowError();
  });
});
