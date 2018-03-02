const gdal = require('gdal');

const validateEPSG = (datasetCut, datasetBase) => {
  const datasetCutEPSG = datasetCut.srs.toProj4();
  const datasetBaseEPSG = datasetBase.srs.toProj4();
  if (datasetCutEPSG !== datasetBaseEPSG) throw Error('Data must be in the same projection.');
};

const getColumns = dataset =>
  dataset.fields.getNames().filter(value => !['objectid'].includes(value.toLowerCase()));

const createLayer = (datasetCut, datasetBase) => {
  const srid = datasetCut.srs;
  const shapePath = `/vsimem/${datasetCut.name}_clip.shp`;
  const newDataset = gdal.open(shapePath, 'w', 'ESRI Shapefile');
  const newLayer = newDataset.layers.create(`${datasetCut.name}_clip`, srid, 6);
  const layersColumns = {
    datasetCut: getColumns(datasetCut),
    datasetBase: getColumns(datasetBase),
  };

  const addColumns = (columns, dataset, newdataset) => {
    for (const column of columns) {
      const fieldDefinition = dataset.fields.get(column);
      newdataset.fields.add(fieldDefinition);
    }
  };

  addColumns(layersColumns.datasetCut, datasetCut, newLayer);
  addColumns(layersColumns.datasetBase, datasetBase, newLayer);

  return { newLayer, layersColumns };
};

const clipFeatures = (newLayer, layersColumns, datasetCut, datasetBase) => {
  const cutFeatures = datasetCut.features;
  cutFeatures.forEach(cutFeature => {
    const envelope = cutFeature
      .getGeometry()
      .getEnvelope()
      .toPolygon();
    datasetBase.setSpatialFilter(envelope);

    const baseFeatures = datasetBase.features;
    baseFeatures.forEach(baseFeature => {
      const clipFeature = cutFeature.getGeometry().intersection(baseFeature.getGeometry());

      const feature = new gdal.Feature(newLayer);
      feature.setGeometry(clipFeature);
      for (const column of layersColumns.datasetCut) {
        feature.fields.set(column, cutFeature.fields.get(column));
      }
      for (const column of layersColumns.datasetBase) {
        feature.fields.set(column, baseFeature.fields.get(column));
      }
      newLayer.features.add(feature);
    });
  });
  newLayer.flush();
  return newLayer;
};

exports.validateEPSG = validateEPSG;
exports.createLayer = createLayer;
exports.clipFeatures = clipFeatures;
