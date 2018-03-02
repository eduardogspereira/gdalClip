const gdalFuncs = require('./gdalFuncs');

const processData = (datasetCut, datasetBase) => {
  try {
    if (datasetCut.constructor.name !== 'Layer' || datasetBase.constructor.name !== 'Layer') {
      throw new Error('The input must be an Layer object from GDAL');
    }

    gdalFuncs.validateEPSG(datasetCut, datasetBase);
    const { newLayer, layersColumns } = gdalFuncs.createLayer(datasetCut, datasetBase);
    const clippedData = gdalFuncs.clipFeatures(newLayer, layersColumns, datasetCut, datasetBase);

    return clippedData;
  } catch (error) {
    throw Error(error);
  }
};

exports.processData = processData;
