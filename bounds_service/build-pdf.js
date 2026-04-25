'use strict';

var Printer = require('pdfmake'),
    _ = require('lodash'),
    path = require('path');

function fontPath(file) {
    return path.resolve('roboto', file);
}

module.exports = {
    create: function(image,addresses,slug, campaignType) {
        var table = [];
        campaignType = campaignType || 'leafleting';

        if (campaignType === 'leafleting') {
            _.forEach(_.groupBy(addresses,'street'), function(value, key) {
                table.push([
                    {text: key, style:'streetLocalityHR1', colSpan: 2},
                    {}
                ]);
                
                // Group numbers on the same street
                var numbers = [];
                var lastAdr = null;
                _.forEach(value, function(adr) {
                    // if elector_name exists, we might have duplicates per house, so we unique them
                    if (lastAdr && lastAdr.gnaf_pid === adr.gnaf_pid) return;
                    numbers.push(adr.street_number);
                    lastAdr = adr;
                });
                
                // create ranges: e.g. 1,2,3 -> 1-3
                var numberStr = numbers.reduce((acc, curr, i) => {
                    if (i === 0) return [curr];
                    var last = acc[acc.length - 1];
                    var lastNum = parseInt(last.split('-').pop(), 10);
                    var currNum = parseInt(curr, 10);
                    if (!isNaN(lastNum) && !isNaN(currNum) && currNum === lastNum + 1) {
                        var base = last.split('-')[0];
                        acc[acc.length - 1] = base + '-' + curr;
                    } else {
                        acc.push(curr);
                    }
                    return acc;
                }, []).join(', ');
                
                table.push([
                    {text: numberStr, bold: true, fontSize: 10, alignment: 'left'},
                    {text: lastAdr ? lastAdr.postcode : '', fontSize: 10, alignment: 'right'}
                ]);
            });
        } else {
            // Canvassing layout
            _.forEach(_.groupBy(addresses,'street'), function(value, key) {
                table.push([
                    {text: key, style:'streetLocalityHR1'},
                    {text: 'Postcode', style:['streetLocalityHR1','streetLocalityHR2']},
                    {text: 'Elector name', style:['streetLocalityHR1','streetLocalityHR2']},
                    {text: 'Unsuccessful', style:['streetLocalityHR1','streetLocalityHR2']},
                    {text: 'Refused', style:['streetLocalityHR1','streetLocalityHR2']},
                    {text: 'Postal vote', style:['streetLocalityHR1','streetLocalityHR2']},
                    {text: 'Response code', style:['streetLocalityHR1','streetLocalityHR2']},
                ]);
                _.forEach(value, function(adr) {
                    table.push([
                        [{text: adr.street_number, bold: true, fontSize: 10},{text: ' ' + (adr.gnaf_pid || ''), fontSize: 6}],
                        {text: adr.postcode || '', fontSize: 8},
                        {text: (function() {
                            var details = [];
                            if (adr.gender) details.push(adr.gender.charAt(0).toUpperCase());
                            if (adr.age) details.push(adr.age);
                            var suffix = details.length > 0 ? ' (' + details.join(', ') + ')' : '';
                            return (adr.elector_name || '') + suffix;
                        })(), fontSize: 8},
                        {text: ''}, // Unsuccessful (blank cell)
                        {text: ''}, // Refused (blank cell)
                        {text: ''}, // Postal vote
                        {text: ''}  // Response code (blank cell)
                    ])
                })
            });
        }

        var docDefinition = {
            pageSize: 'A4',
            pageOrientation: 'portrait',
            /*
            background: function(currentPage) {
                console.log(currentPage);
                var image = '';
                if (currentPage > 2) { image = 'baselayer.png' }
                return { image: image }
            },
            */
            // [left, top, right, bottom] or [horizontal, vertical] or just a number for equal margins
            pageMargins: [ 30, 75, 30, 30 ],
            watermark: {text: slug, color: '#000000', opacity: 0.1, bold: true, italics: false},
            content: [
                {
                    image: image,
                    fit: [595, 250]
                },
              {
                style: 'table',
                table: {
                  headerRows: 0,
                  dontBreakRows: true,
                  widths: campaignType === 'leafleting' ? ['50%', '50%'] : [ '18%', '12%', '25%', '10%', '10%', '10%', '15%'],
                  body: table
                }
              }
            ],
            styles: {
                streetLocalityHR1: {
                    fontSize: 10,
                    bold: true,
                    // color: '#fff',
                    // fillColor: '#555',
                    alignment: 'center'
                },
                streetLocalityHR2: {
                    fontSize: 7
                },
                pageHeader: {
                    alignment: 'left',
                    fontSize: 22,
                    margin: [0, 5, 0, 15]
                },
                table: {
                    margin: [0, 0, 0, 0]
                }
            },
            defaultStyle: {
                alignment: 'center',
                fontSize: 11
            }
          };

          var fontDescriptors = {
            Roboto: {
              normal: fontPath('RobotoCondensed-Regular.ttf'),
              bold: fontPath('RobotoCondensed-Bold.ttf'),
              italics: fontPath('RobotoCondensed-Italic.ttf'),
              bolditalics: fontPath('RobotoCondensed-Italic.ttf')
            }
          };
          var printer = new Printer(fontDescriptors);

          var pdfDoc = printer.createPdfKitDocument(docDefinition);

          return pdfDoc;

    }
};
