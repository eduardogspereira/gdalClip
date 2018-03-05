const gdalFuncs = require('./gdalFuncs');
const gdalMultiToSingle = require('gdalmultitosingle');
const uuid = require('uuid');

const processData = (
  datasetClip,
  datasetBase,
  outputName = `output_${uuid().replace(/-/g, '')}.shp`,
  outputFormat = 'ESRI Shapefile',
) => {
  try {
    gdalFuncs.validateEPSG(datasetClip, datasetBase);
    const datasetClipSingle = gdalFuncs.getLayer(
      gdalMultiToSingle.processData(datasetClip, '/vsimem/datasetCut.shp', 'ESRI Shapefile'),
    );
    const datasetBaseSingle = gdalFuncs.getLayer(
      gdalMultiToSingle.processData(datasetBase, '/vsimem/datasetClip.shp', 'ESRI Shapefile'),
    );

    const geomType = datasetBaseSingle.features.first().getGeometry().name;
    let typeCode;
    let typeName;
    switch (geomType.toLowerCase()) {
      case 'multipolygon':
      case 'polygon': {
        typeCode = 3;
        typeName = 'polygon';
        break;
      }
      case 'point':
      case 'multipoint':
        typeCode = 1;
        typeName = 'point';
        break;
      case 'linestring':
      case 'multilinestring':
        typeCode = 2;
        typeName = 'linestring';
        break;
      default:
        throw new Error('Invalid geometry type.');
    }

    const { newLayer, layersColumns } = gdalFuncs.createLayer(
      datasetClipSingle,
      datasetBaseSingle,
      typeCode,
    );

    const clippedData = gdalFuncs.clipFeatures(
      newLayer,
      layersColumns,
      datasetClipSingle,
      datasetBaseSingle,
      typeName,
    );

    return gdalFuncs.exportLayer(clippedData, outputName, outputFormat, typeCode);
  } catch (error) {
    throw Error(error);
  }
};

exports.processData = processData;
