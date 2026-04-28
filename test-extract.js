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

console.log(extractAddressParts('Brock House, 34A Macdonald Road', ''));
