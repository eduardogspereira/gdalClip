const gdalFuncs = require('./gdalFuncs');
const uuid = require('uuid');

const processData = (
  datasetCut,
  datasetBase,
  outputName = `tmp/output_${uuid().replace(/-/g, '')}.shp`,
  outputFormat = 'ESRI Shapefile',
) => {
  try {
    if (datasetCut.constructor.name !== 'Layer' || datasetBase.constructor.name !== 'Layer') {
      throw new Error('The input must be an Layer object from GDAL');
    }

    gdalFuncs.validateEPSG(datasetCut, datasetBase);
    const { newLayer, layersColumns } = gdalFuncs.createLayer(datasetCut, datasetBase);
    const clippedData = gdalFuncs.clipFeatures(newLayer, layersColumns, datasetCut, datasetBase);
    const exportData = gdalFuncs.exportLayer(clippedData, outputName, outputFormat);

    return exportData;
  } catch (error) {
    throw Error(error);
  }
};

exports.processData = processData;
