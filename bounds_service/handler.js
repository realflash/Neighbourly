'use strict';
var pg = require('pg'),
  async = require('async'),
  https = require('https'),
  URL = require('url'),
  b64Stream = require('base64-stream'),
  Client = require('pg').Client;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-requested-with',
  'Access-Control-Allow-Methods': 'GET,OPTIONS'
}

const getAddresses = function(client, slug,cb) {
  let queryStr = "";
  if (process.env.COUNTRY === 'UK') {
    queryStr = "select k.gnaf_pid, k.locality_name, k.postcode, k.street_name AS street, k.number_first AS street_number, k.elector_name, k.gender, k.age, NULL as subpremise_sort, CASE WHEN k.number_first IS NOT NULL AND k.number_first ~ '^[0-9]+' THEN regexp_replace(k.number_first, '[^0-9]+', '', 'g')::integer ELSE NULL END as premise_sort from gnaf_201702.addresses k where k.mb_2011_code = $1 AND alias_principal = 'P' order by street, premise_sort, street_number";
  } else {
    queryStr = "select k.gnaf_pid, k.street_locality_pid, k.address, k.locality_name, k.postcode, CONCAT(k.street_name,' ',k.street_type) AS street, CASE WHEN k.flat_number IS NULL THEN CASE WHEN k.number_last IS NULL THEN k.number_first ELSE CONCAT(k.number_first,'-',k.number_last) END ELSE CONCAT(k.flat_number,'/',CASE WHEN k.number_last IS NULL THEN k.number_first ELSE CONCAT(k.number_first,'-',k.number_last) END) END AS street_number, CASE WHEN k.flat_number IS NOT NULL AND k.flat_number LIKE '[0-9]+' THEN regexp_replace(k.flat_number, '[^0-9]+', '', 'g')::integer ELSE NULL END as subpremise_sort, k.number_first as premise_sort from public.addresses k where k.mb_2011_code = $1 AND(primary_secondary IS NULL OR primary_secondary = 'S') AND alias_principal = 'P' order by 2,9,8";
  }
  client.query(queryStr, [slug], (err, res) => {
    if (err) {
      console.error("Error fetching addresses, returning empty list:", err.message);
      return cb(null, []);
    }
    var data = res.rows;
    cb(null, data);
  });
}

const getImage = function(client, slug,cb) {
  if (process.env.GOOGLE_MAPS_KEY && process.env.GOOGLE_MAPS_KEY.includes('dummy')) {
    console.log("Dummy GOOGLE_MAPS_KEY provided, using transparent fallback image.");
    return cb(null, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
  }

  let queryStr = "";
  if (process.env.COUNTRY === 'UK') {
    queryStr = "SELECT ST_AsEncodedPolyline(st_exteriorring(ST_GeometryN(k.geom,1))) as googleencodeline from admin_bdys_201702.abs_2011_mb as k WHERE k.mb_11code = $1";
  } else {
    queryStr = "SELECT googleencodeline(st_exteriorring(ST_GeometryN(k.geom,1))) from admin_bdys_201702.abs_2011_mb as k WHERE k.mb_11code = $1";
  }

  client.query(queryStr, [slug], (err, res) => {
    if (err) {
      console.error("Error fetching image geom, returning dummy image:", err.message);
      return cb(null, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
    }
    if (!res.rows || res.rows.length === 0) {
      console.warn("No geometry found for slug:", slug);
      return cb(null, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
    }

    var sURL = 'https://maps.googleapis.com/maps/api/staticmap?size=950x200&scale=2&path=fillcolor:0x00000060%7Ccolor:0xFFFFFF00%7Cenc:' + res.rows[0].googleencodeline + '&key=' + process.env.GOOGLE_MAPS_KEY,
    oURL = URL.parse(sURL);

    const req = https.request(oURL, (res) => {
      var type = res.headers["content-type"],
      prefix = "data:" + type + ";base64,",
      body = "";

      res.setEncoding('binary');
      res.on('end', () => {
        var base64 = new Buffer(body, 'binary').toString('base64'),
        data = prefix + base64;
        cb(null, data);
      });
      res.on('data', (chunk) => {
          if (res.statusCode == 200) body += chunk;
      });
      res.on('error', (err) => {
        cb(err);
      });
    });

    req.on('error', (err) => {
      cb(err);
    });
    req.end();
  });

}

module.exports.getForBounds = (event, context, callback) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL  })
  
  client.on('error', err => {
    console.error('pg client error', err.message);
  });

  client.connect(err => {
    if (err) {
      return callback(err);
    }
    
    const query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(k.geom,7)::json As geometry, row_to_json((SELECT l FROM (SELECT mb_11code As slug, avg_swing_propensity, outcomes_recorded, total_addresses_on_block) As l)) As properties from admin_bdys_201702.abs_2011_mb as k WHERE ST_Intersects(ST_MakeEnvelope($1,$2,$3,$4,4326),k.geom) AND k.mb_category = 'RESIDENTIAL') As f ) As fc";
    const params = [event.queryStringParameters.sex,event.queryStringParameters.sey,event.queryStringParameters.nwx,event.queryStringParameters.nwy];
    console.log("Executing query:", query, "with params:", params);
    client.query(query, params, (err, res) => {
      client.end()
      if (err) {
        console.error("Error in getForBounds, returning empty feature collection:", err.message);
        return callback(null, {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({type: "FeatureCollection", features: []})
        });
      }

      const response = {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(res.rows[0].row_to_json || {type: "FeatureCollection", features: []})
      };
      callback(null, response);
    });
  });
};

module.exports.generateMap = (event, context, callback) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL  })
  
  client.on('error', err => {
    console.error('pg client error', err.message);
  });

  client.connect(err => {
    if (err) {
      return callback(err);
    }

    async.parallel({
      image: cb => getImage(client, event.queryStringParameters.slug, cb),
      addresses: cb => getAddresses(client, event.queryStringParameters.slug, cb)
    }, function(err, results) {
      client.end()
      if (err) return callback(err)

      console.log("generateMap success. slug:", event.queryStringParameters.slug, "addresses:", results.addresses ? results.addresses.length : 0);
      if (!results.addresses) {
        results.addresses = [];
      }

      var pdf = require('./build-pdf').create(results.image, results.addresses, event.queryStringParameters.slug, event.queryStringParameters.campaign_type, event.queryStringParameters.campaign_name, event.queryStringParameters.assignee_name),
      stream = pdf.pipe(b64Stream.encode()),
      // Uncomment to preview the pdf locally
      //  stream = pdf.pipe(require('fs').createWriteStream('output.pdf')),
      data = '';
      pdf.end();

      stream.on('data', function(chunk) {
        data += chunk;
      });

      stream.on('end', function() {
        const response = {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({base64: data})
        };
        callback(null,response);
      });
    });
  });
};
