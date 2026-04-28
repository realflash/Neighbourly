var commonStyles = { 'color': '#111111', 'weight': 1, 'opacity': 0.65, 'fillOpacity': 0.5 }
var claimStyles = {
  firstQuartile: Object.assign({}, commonStyles, { 'fillColor': '#ffffcc' }),
  secondQuartile: Object.assign({}, commonStyles, { 'fillColor': '#c2e699' }),
  thirdQuartile: Object.assign({}, commonStyles, { 'fillColor': '#78c679' }),
  fourthQuartile: Object.assign({}, commonStyles, { 'fillColor': '#238443' }),
}

function normalise(val, min, max) { return (val - min) / (max - min) }

function priorityStyles(feature) {
  var propensity = normalise(feature.properties.avg_swing_propensity, 0.2, 0.45) 
  var doors_knocked = feature.properties.outcomes_recorded || 0
  var total_doors = feature.properties.total_addresses_on_block || 1
  var priority = propensity * (1 - doors_knocked / total_doors)
  if (priority <= 0.25) return claimStyles.firstQuartile
  if (priority <= 0.50) return claimStyles.secondQuartile
  if (priority <= 0.75) return claimStyles.thirdQuartile
  return claimStyles.fourthQuartile
}

console.log("No propensity (undefined):", priorityStyles({properties: {}}));
console.log("Null propensity:", priorityStyles({properties: {avg_swing_propensity: null}}));
