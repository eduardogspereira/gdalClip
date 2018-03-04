const gdalclip = require('./src/index.js');
const gdal = require('gdal');

const getFeatures = shapefile => gdal.open(shapefile).layers.get(0);

const solos = getFeatures('/home/majortom/Data/solos_clealco_wgs84.shp');
const talhoes = getFeatures('/home/majortom/Data/talhao_clealco.shp');

const data = gdalclip.processData(talhoes, solos);

console.log(data);
