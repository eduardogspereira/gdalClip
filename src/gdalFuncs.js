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
  const datasetCutColumns = getColumns(datasetCut);
  const datasetBaseColumns = getColumns(datasetBase).map(value => {
    if (datasetCutColumns.map(cutColumn => cutColumn.toUpperCase()).includes(value.toUpperCase())) {
      return `${value}|${value.slice(0, -1)}1`;
    }
    return value;
  });
  const layersColumns = {
    datasetCut: datasetCutColumns,
    datasetBase: datasetBaseColumns,
  };

  const addColumns = (columns, dataset, newdataset) => {
    for (const column of columns) {
      if (!column.includes('|')) {
        const fieldDefinition = dataset.fields.get(column);
        newdataset.fields.add(fieldDefinition);
      } else {
        const fieldDefinition = dataset.fields.get(column.split('|')[0]);
        fieldDefinition.name = column.split('|')[1].toString();
        newdataset.fields.add(fieldDefinition);
      }
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

      if (!clipFeature.isEmpty()) {
        const feature = new gdal.Feature(newLayer);
        feature.setGeometry(clipFeature);
        for (const column of layersColumns.datasetCut) {
          feature.fields.set(column, cutFeature.fields.get(column));
        }
        for (const column of layersColumns.datasetBase) {
          if (!column.includes('|')) {
            feature.fields.set(column, baseFeature.fields.get(column));
          } else {
            const columnName = column.split('|')[1];
            const columnValue = baseFeature.fields.get(column.split('|')[0]);
            feature.fields.set(columnName, columnValue);
          }
        }
        newLayer.features.add(feature);
      }
    });
  });
  newLayer.flush();
  return newLayer;
};

const exportLayer = (clippedData, outputName, outputFormat) => {
  const srid = clippedData.srs;
  const layerName = outputName
    .substring(0, outputName.lastIndexOf('.'))
    .split('/')
    .pop();

  const outputFile = gdal.open(outputName, 'w', outputFormat);
  const outputLayer = outputFile.layers.create(layerName, srid, 6);
  for (const columnName of clippedData.fields.getNames()) {
    outputLayer.fields.add(clippedData.fields.get(columnName));
  }

  clippedData.features.first();
  let clippedFeature = clippedData.features.next();
  while (clippedFeature) {
    const outputFeature = new gdal.Feature(outputLayer);
    outputFeature.setGeometry(clippedFeature.getGeometry());
    for (const columnName of clippedData.fields.getNames()) {
      outputFeature.fields.set(columnName, clippedFeature.fields.get(columnName));
    }
    outputLayer.features.add(outputFeature);
    clippedFeature = clippedData.features.next();
  }

  outputLayer.flush();
  outputFile.close();

  return outputName;
};

exports.validateEPSG = validateEPSG;
exports.createLayer = createLayer;
exports.clipFeatures = clipFeatures;
exports.exportLayer = exportLayer;
