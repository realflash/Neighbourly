'use strict';

var Printer = require('pdfmake'),
    _ = require('lodash'),
    path = require('path');

function fontPath(file) {
    return path.resolve('roboto', file);
}

function extractAddressParts(originalStreet, originalNumber) {
    var numberStr = (originalNumber || '').toString().trim();
    var streetStr = (originalStreet || '').trim();
    var nameStr = '';

    if (!numberStr) {
        var parts = streetStr.split(',').map(function(s) { return s.trim(); });
        if (parts.length > 1) {
            var lastPart = parts.pop();
            var match = lastPart.match(/^(\d+[a-zA-Z]*)\s+(.*)$/);
            if (match) {
                numberStr = match[1];
                streetStr = match[2];
                nameStr = parts.join(', ');
            } else {
                streetStr = lastPart;
                nameStr = parts.join(', ');
            }
        } else {
            var match = streetStr.match(/^(\d+[a-zA-Z]*)\s+(.*)$/);
            if (match) {
                numberStr = match[1];
                streetStr = match[2];
            }
        }
    } else {
        var parts = streetStr.split(',').map(function(s) { return s.trim(); });
        if (parts.length > 1) {
            streetStr = parts.pop();
            nameStr = parts.join(', ');
        }
    }

    var isNumbered = false;
    var num = 0;
    var suffix = '';
    if (numberStr) {
        var nMatch = numberStr.match(/^(\d+)([a-zA-Z]*)$/);
        if (nMatch) {
            isNumbered = true;
            num = parseInt(nMatch[1], 10);
            suffix = nMatch[2] || '';
        } else {
            nameStr = nameStr ? nameStr + ', ' + numberStr : numberStr;
            numberStr = '';
        }
    }

    return {
        isNumbered: isNumbered,
        num: num,
        suffix: suffix,
        display: numberStr,
        name: nameStr,
        street: streetStr
    };
}

function processAddresses(addresses, splitOddEven) {
    var parsedAddresses = [];
    _.forEach(addresses, function(adr) {
        var parsed = extractAddressParts(adr.street, adr.street_number);
        adr.street = parsed.street;
        adr.street_number = parsed.display;
        if (!parsed.isNumbered && parsed.name) {
            adr.street_number = parsed.name;
        }
        parsed.original = adr;
        parsedAddresses.push(parsed);
    });

    var groups = _.groupBy(parsedAddresses, 'street');
    var streetNames = Object.keys(groups).sort();
    var processed = [];

    _.forEach(streetNames, function(street) {
        var streetAdrs = groups[street];
        var numbered = [];
        var named = [];
        
        var seenGnaf = {};
        var uniqueAdrs = [];
        _.forEach(streetAdrs, function(parsed) {
            var adr = parsed.original;
            if (adr.gnaf_pid && seenGnaf[adr.gnaf_pid]) {
                uniqueAdrs.push(adr);
            } else {
                seenGnaf[adr.gnaf_pid] = true;
                uniqueAdrs.push(adr);
            }
        });

        var leafletingProps = _.uniqBy(streetAdrs, function(p) { return p.original.gnaf_pid; });
        
        _.forEach(leafletingProps, function(parsed) {
            if (parsed.isNumbered) {
                numbered.push(parsed);
            } else {
                named.push(parsed);
            }
        });

        numbered.sort(function(a, b) {
            if (a.num === b.num) return a.suffix.localeCompare(b.suffix);
            return a.num - b.num;
        });

        named.sort(function(a, b) {
            return (a.name || '').localeCompare(b.name || '');
        });

        processed.push({
            street: street,
            numbered: numbered,
            named: named,
            allCanvassing: uniqueAdrs
        });
    });

    return processed;
}

function formatCoalesced(ranges, suffix) {
    var out = [];
    _.forEach(ranges, function(r) {
        if (r.length === 1) {
            out.push(r[0].display);
        } else {
            out.push(r[0].display + '-' + r[r.length-1].display);
        }
    });
    if (out.length === 0) return '';
    return out.join(', ') + suffix;
}

function coalesceGroups(list, splitOddEven) {
    if (!list || list.length === 0) return [];
    
    var coalesceGroup = function(sublist, suffix) {
        if (sublist.length === 0) return '';
        var ranges = [];
        var currentRange = [];
        
        _.forEach(sublist, function(adr) {
            if (currentRange.length === 0) {
                currentRange.push(adr);
            } else {
                var last = currentRange[currentRange.length - 1];
                var diff = splitOddEven ? 2 : 1;
                if (adr.num === last.num + diff && adr.suffix === last.suffix) {
                    currentRange.push(adr);
                } else {
                    ranges.push(currentRange);
                    currentRange = [adr];
                }
            }
        });
        if (currentRange.length > 0) ranges.push(currentRange);
        return formatCoalesced(ranges, suffix);
    };

    if (splitOddEven) {
        var odds = list.filter(function(a) { return a.num % 2 !== 0; });
        var evens = list.filter(function(a) { return a.num % 2 === 0; });
        var out = [];
        var oStr = coalesceGroup(odds, ' (odd)');
        var eStr = coalesceGroup(evens, ' (even)');
        if (oStr) out.push(oStr);
        if (eStr) out.push(eStr);
        return out;
    } else {
        var str = coalesceGroup(list, '');
        return str ? [str] : [];
    }
}

module.exports = {
    create: function(image, addresses, slug, campaignType, campaignName, assigneeName) {
        var docContent = [];
        campaignType = campaignType || 'leafleting';
        var splitOddEven = process.env.SPLIT_ODD_EVEN === 'true';

        var processed = processAddresses(addresses, splitOddEven);
        
        // Build Header
        var streetList = processed.map(function(p) { return p.street; });
        var streetSummary = '';
        if (streetList.length > 1) {
            var last = streetList.pop();
            streetSummary = "Covering " + streetList.join(', ') + ", and " + last + ".";
        } else if (streetList.length === 1) {
            streetSummary = "Covering " + streetList[0] + ".";
        }

        var docHeader = [];
        docHeader.push({ text: (campaignName || 'Campaign') + ' - ' + (assigneeName || 'Assignee'), style: 'pageHeader' });
        docHeader.push({ text: 'Area Code: ' + slug, margin: [0, 0, 0, 5], bold: true });
        docHeader.push({ text: streetSummary, margin: [0, 0, 0, 15] });

        if (campaignType === 'leafleting') {
            _.forEach(processed, function(group) {
                var table = [];
                table.push([
                    {text: group.street, style:'streetLocalityHR1', colSpan: 2},
                    {}
                ]);
                
                var coalescedNumbered = coalesceGroups(group.numbered, splitOddEven);
                var namedProps = group.named.map(function(n) { return n.name; });
                
                var maxRows = Math.max(coalescedNumbered.length, namedProps.length);
                for (var i = 0; i < maxRows; i++) {
                    var leftText = coalescedNumbered[i] || '';
                    var rightText = namedProps[i] || '';
                    table.push([
                        {text: leftText, bold: true, fontSize: 10, alignment: 'left'},
                        {text: rightText, fontSize: 10, alignment: 'right'}
                    ]);
                }
                
                if (table.length > 1) {
                    docContent.push({
                        style: 'table',
                        margin: [0, 0, 0, 15],
                        table: {
                            headerRows: 1,
                            dontBreakRows: true,
                            widths: ['50%', '50%'],
                            body: table
                        }
                    });
                }
            });
        } else {
            // Canvassing layout
            _.forEach(processed, function(group) {
                var table = [];
                table.push([
                    {text: group.street, style:'streetLocalityHR1'},
                    {text: 'Postcode', style:['streetLocalityHR1','streetLocalityHR2']},
                    {text: 'Elector name', style:['streetLocalityHR1','streetLocalityHR2']},
                    {text: 'Unsuccessful', style:['streetLocalityHR1','streetLocalityHR2']},
                    {text: 'Refused', style:['streetLocalityHR1','streetLocalityHR2']},
                    {text: 'Postal vote', style:['streetLocalityHR1','streetLocalityHR2']},
                    {text: 'Response code', style:['streetLocalityHR1','streetLocalityHR2']},
                ]);
                
                var lastAdr = null;
                _.forEach(group.allCanvassing, function(adr) {
                    var isSame = lastAdr && ((adr.gnaf_pid && lastAdr.gnaf_pid === adr.gnaf_pid) || (adr.street_number && lastAdr.street_number === adr.street_number));
                    lastAdr = adr;
                    
                    table.push([
                        isSame ? {text: '(same property)', fontSize: 8, italics: true} : [{text: adr.street_number, bold: true, fontSize: 10},{text: ' ' + (adr.gnaf_pid || ''), fontSize: 6}],
                        {text: isSame ? '' : (adr.postcode || ''), fontSize: 8},
                        {text: (function() {
                            var details = [];
                            if (adr.gender) details.push(adr.gender.charAt(0).toUpperCase());
                            if (adr.age) details.push(adr.age);
                            var suffix = details.length > 0 ? ' (' + details.join(', ') + ')' : '';
                            return (adr.elector_name || '') + suffix;
                        })(), fontSize: 8},
                        {text: ''},
                        {text: ''},
                        {text: ''},
                        {text: ''}
                    ]);
                });
                
                if (table.length > 1) {
                    docContent.push({
                        style: 'table',
                        margin: [0, 0, 0, 15],
                        table: {
                            headerRows: 1,
                            dontBreakRows: true,
                            widths: [ '18%', '12%', '25%', '10%', '10%', '10%', '15%'],
                            body: table
                        }
                    });
                }
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
            content: docHeader.concat([
                {
                    image: image,
                    fit: [595, 250],
                    margin: [0, 0, 0, 15]
                }
            ]).concat(docContent),
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
