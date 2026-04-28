function makeMap() {
  var commonStyles = { 'color': '#111111', 'weight': 1, 'opacity': 0.65, 'fillOpacity': 0.5 }
  var claimStyles = {
    claimed_by_you: $.extend({}, commonStyles, { 'fillColor': '#9d5fa7', 'fillOpacity': 0.8 }),
    claimed: $.extend({}, commonStyles, { 'fillColor': '#d5545a', 'fillOpacity': 0.8 }),
    complete: $.extend({}, commonStyles, { 'fillColor': '#2171b5', 'fillOpacity': 0.8 }),
    firstQuartile: $.extend({}, commonStyles, { 'fillColor': '#ffffcc' }),
    secondQuartile: $.extend({}, commonStyles, { 'fillColor': '#c2e699' }),
    thirdQuartile: $.extend({}, commonStyles, { 'fillColor': '#78c679' }),
    fourthQuartile: $.extend({}, commonStyles, { 'fillColor': '#238443' }),
  }

  var map = L.map('map')
  window.leafletMap = map

  var country = $('#map').data('country') || 'AU'
  var regionName = $('#map').data('region-name') || 'Mesh block'
  var regionNamePlural = regionName + 's'
  
  var selectedCampaignId = null;

  var APP_BASE_URL = $('#map').data('app-base-url') || '';
  APP_BASE_URL = APP_BASE_URL.replace(/\/$/, "");

  window.allUsers = [];
  var initAdminAttr = $('#map').data('is-admin');
  if (initAdminAttr === true || initAdminAttr === 'true') {
    $.getJSON(APP_BASE_URL + '/api/users', function(users) {
      window.allUsers = users;
    }).fail(function() {
      console.error("Failed to fetch users");
    });
  }
  
  // Fetch active campaigns and populate the dropdown
  $.getJSON(APP_BASE_URL + '/api/campaigns', function(campaigns) {
    var select = $('#campaign');
    select.empty();
    select.append($('<option></option>').val('').text('-- Select a Campaign --'));
    campaigns.forEach(function(c) {
      select.append($('<option></option>').val(c.id).text(c.name).attr('data-type', c.type));
    });
    
    // Restore previous selection if any
    var saved = localStorage.getItem('selectedCampaignId');
    if (saved && select.find('option[value="' + saved + '"]').length > 0) {
      select.val(saved);
      selectedCampaignId = saved;
    } else {
      select.val('');
      selectedCampaignId = '';
    }
    window.selectedCampaignId = selectedCampaignId;
    if (selectedCampaignId) {
      updateMap(true);
    }
    
    select.on('change', function() {
      selectedCampaignId = $(this).val();
      window.selectedCampaignId = selectedCampaignId;
      if (selectedCampaignId) {
        localStorage.setItem('selectedCampaignId', selectedCampaignId);
      } else {
        localStorage.removeItem('selectedCampaignId');
      }
      
      if (selectedCampaignId && map.getZoom() <= 14) {
        map.setZoom(15);
      } else {
        updateMap(true);
      }
    });
  }).fail(function(jqXHR, textStatus, errorThrown) {
    console.error('CLIENT: Failed to load campaigns:', textStatus, errorThrown, jqXHR.status);
  });

  var mesh_layer //Rendered map
  var last_update_bounds
  var last_update_centroid

  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map)

  $('#address_search_form').submit(function (event) {
    event.preventDefault()
    FitPcode($('#address_search').val())
  })

  var FitPcode = function (pcode) {
    $.getJSON(APP_BASE_URL + '/pcode_get_bounds?pcode=' + pcode, function (json) {
      if (json) {
        map.fitBounds([[json.swlat, json.swlng], [json.nelat, json.nelng]])
      }
      else { alert('Postcode not found') }
    })
  }

  var FindLocation = function () {
    var lat = Cookies.get('lat')
    var lng = Cookies.get('lng')
    var pcode = Cookies.get('postcode') || $('#map').data('postcode')
    if (lat && lng) {
      var zoom = Cookies.get('zoom')
      if (zoom) {
        map.setView([lat, lng], zoom)
      }
      else {
        map.setView([lat, lng], 15)
      }
    }
    else if (pcode) {
      FitPcode(pcode)
    }
    else {
      if (country === 'UK' || country === 'GB') {
        map.setView([54.5, -4.0], 6)
      } else {
        map.setView([-29.8650, 131.2094], 5)
      }
    }
  }

  FindLocation()

  function normalise(val, min, max) { return (val - min) / (max - min) }

  function priorityStyles(feature) {
    var propensity = normalise(feature.properties.avg_swing_propensity, 0.2, 0.45) // observed range
    var doors_knocked = feature.properties.outcomes_recorded || 0
    var total_doors = feature.properties.total_addresses_on_block || 1
    var priority = propensity * (1 - doors_knocked / total_doors)
    if (priority <= 0.25) return claimStyles.firstQuartile
    if (priority <= 0.50) return claimStyles.secondQuartile
    if (priority <= 0.75) return claimStyles.thirdQuartile
    return claimStyles.fourthQuartile
  }

  function addGeoJsonProperties(json) {
    var adminAttr = $('#map').data('is-admin');
    var admin = adminAttr === true || adminAttr === 'true';
    var statsContainer = $('.block-stats-hover')
    var template = $('#template').val()

    function getFeatureStyle(feature) {
      var adminAttr = $('#map').data('is-admin');
      var admin = adminAttr === true || adminAttr === 'true';
      var s;
      var status = feature.properties.claim_status;
      var priority = feature.properties.claim_priority;
      
      switch (status) {
      case 'claimed_by_you': s = claimStyles.claimed_by_you; break;
      case 'claimed': s = claimStyles.claimed; break;
      case 'complete': s = claimStyles.complete; break;
      case 'complete': s = claimStyles.complete; break;
      default: 
        if (priority === 'high') s = claimStyles.fourthQuartile;
        else if (priority === 'low') s = claimStyles.firstQuartile;
        else {
          if (feature.properties.avg_swing_propensity == null) {
            s = claimStyles.fourthQuartile;
          } else {
            s = priorityStyles(feature);
          }
        }
      }
      
      window.meshblockColors = window.meshblockColors || {};
      window.meshblockColors[feature.properties.slug] = s.fillColor;
      return s;
    }

    var layer = L.geoJson(json, {
      style: function (feature) {
        return getFeatureStyle(feature);
      },
      onEachFeature: function (feature, featureLayer) {
        featureLayer._leaflet_id = feature.properties.slug;

        function bindPopupContent() {
          var self = this;
          function downloadmesh(mesh_id) {
            var selectedOption = $('#campaign option:selected');
            var campaignType = selectedOption.attr('data-type') || 'leafleting';
            var options = {
              slug: mesh_id,
              campaign: $('#campaign').val(),
              template: $('#template').val(),
              campaign_type: campaignType
            }
            var url = LAMBDA_BASE_URL + '/map'
            $.get(url, options, function (base64str) {
              if (base64str.message == 'Internal server error') {
                return alert('This area cannot be downloaded due to a pdf rendering error, please try another area.')
              }
              var binary = atob(base64str.base64.replace(/\s/g, ''))
              var len = binary.length
              var buffer = new ArrayBuffer(len)
              var view = new Uint8Array(buffer)
              for (var i = 0; i < len; i++) {
                view[i] = binary.charCodeAt(i)
              }
              var blob = new Blob([view], { type: 'application/pdf' })
              var url = window.URL.createObjectURL(blob)
              var a = document.createElement('a')
              a.href = url
              a.download = mesh_id + '.pdf'
              a.click()
              $('#load').addClass('hidden')
            })
          }

          this.btnClaim = function () {
            if (!selectedCampaignId) {
              return alert('Please select a campaign from the dropdown first.');
            }
            var leaflet_id = this._leaflet_id
            $.post(APP_BASE_URL + '/claim_meshblock/' + leaflet_id + '?campaign_id=' + selectedCampaignId, function() {
              updateMap(true);
            })
            feature.properties.claim_status = 'claimed_by_you'
            this.setStyle(getFeatureStyle(feature))
            $('#load').removeClass('hidden')
            downloadmesh(leaflet_id)
            // Re-bind popup to update buttons
            bindPopupContent.call(this);
            this.openPopup();
          }

          this.btnUnclaim = function () {
            $.post(APP_BASE_URL + '/unclaim_meshblock/' + this._leaflet_id + '?campaign_id=' + selectedCampaignId, function() {
              updateMap(true);
            })
            feature.properties.claim_status = 'unclaimed'
            feature.properties.claim_owner_name = null
            this.setStyle(getFeatureStyle(feature))
            bindPopupContent.call(this);
            this.openPopup();
          }

          this.btnDownload = function () {
            $('#load').removeClass('hidden')
            downloadmesh(this._leaflet_id)
          }

          this.btnMarkComplete = function() {
            var leaflet_id = this._leaflet_id
            $.post(APP_BASE_URL + '/claims/' + leaflet_id + '/status', { campaign_id: selectedCampaignId, status: 'complete' }, function() {
              updateMap(true)
            })
            feature.properties.claim_status = 'complete'
            this.setStyle(getFeatureStyle(feature))
            bindPopupContent.call(this);
            this.openPopup();
          }

          function create_popup_btn(container, div_class, btn_text_inner, faq_text_inner) {
            var grpdiv = L.DomUtil.create('div', 'popupgrp hidden ' + div_class, container)
            var txtdiv = L.DomUtil.create('div', 'popuptxt txt' + div_class, grpdiv)
            txtdiv.innerHTML = faq_text_inner
            var btndiv = L.DomUtil.create('div', 'popupbutton btn' + div_class, grpdiv)
            var btn = L.DomUtil.create('button', '', btndiv)
            btn.setAttribute('type', 'button')
            btn.setAttribute('name', div_class)
            btn.innerHTML = btn_text_inner
            L.DomEvent.addListener(btn, 'click', L.DomEvent.stopPropagation)
            L.DomEvent.addListener(btn, 'click', L.DomEvent.preventDefault)
            return {
              grpdiv: grpdiv,
              btn: btn
            }
          }

          var container = L.DomUtil.create('div')
          L.DomUtil.create('div', 'popuptxt normal-size', container).innerHTML = 'Code: ' + feature.properties.slug
          L.DomUtil.create('hr', 'smaller-margin', container)

          var claimout = create_popup_btn(container, 'claim', 'Claim + Download', 'Click to claim area and download PDF of addresses to doorknock.<br>')
          L.DomEvent.addListener(claimout.btn, 'click', this.btnClaim, this)

          var markCompleteOut = create_popup_btn(container, 'mark-complete-toggle', 'Mark Complete', 'Click to mark this area as completely door-knocked.<br>')
          L.DomEvent.addListener(markCompleteOut.btn, 'click', this.btnMarkComplete, this)

          var unclaimout = create_popup_btn(container, 'unclaim', 'Unclaim', 'Click to remove your claim on this area.<br>')
          L.DomEvent.addListener(unclaimout.btn, 'click', this.btnUnclaim, this)

          var downloadout = create_popup_btn(container, 'download', 'Download', 'Click to download your claimed area.<br>')
          L.DomEvent.addListener(downloadout.btn, 'click', this.btnDownload, this)

          var adminUnclaim = create_popup_btn(container, 'admin-unclaim', 'Admin Unclaim', 'Click to remove the claim on this area.<br>')
          L.DomEvent.addListener(adminUnclaim.btn, 'click', this.btnUnclaim, this)

          var adminDownload = create_popup_btn(container, 'admin-download', 'Download', 'Click to download the claimed area.<br>')
          L.DomEvent.addListener(adminDownload.btn, 'click', this.btnDownload, this)

          var ownerName = feature.properties.claim_owner_name;
          if (admin || ownerName) {
             var ownerContainer = L.DomUtil.create('div', 'popuptxt normal-size', container)
             if (admin) {
                var userSelectHtml = '<select class="form-control user-select" data-slug="' + feature.properties.slug + '">';
                userSelectHtml += '<option value="">-- Unassigned --</option>';
                (window.allUsers || []).forEach(function(u) {
                   var selected = (ownerName && (ownerName === u.name || ownerName === u.email)) ? 'selected' : '';
                   userSelectHtml += '<option value="' + u.email + '" ' + selected + '>' + u.name + '</option>';
                });
                userSelectHtml += '</select>';
                ownerContainer.innerHTML = 'Claimed by: ' + userSelectHtml;
                
                $(ownerContainer).find('select').on('change', function() {
                   var newEmail = $(this).val();
                   $.post(APP_BASE_URL + '/claims/' + feature.properties.slug + '/user', { campaign_id: selectedCampaignId, user_email: newEmail }, function() {
                      updateMap(true); 
                   });
                });
             } else {
                ownerContainer.innerHTML = 'Claimed by: ' + ownerName;
             }
          }

          var priorityContainer = L.DomUtil.create('div', 'popuptxt normal-size', container)
          var currentPriority = feature.properties.claim_priority;
          var priorityHtml = 'Priority: ' + (admin ? 
              ('<select class="form-control priority-select half-width" data-slug="' + feature.properties.slug + '">' + 
               '<option value="" ' + (!currentPriority ? 'selected' : '') + '>Not set</option>' +
               '<option value="high" ' + (currentPriority === 'high' ? 'selected' : '') + '>High</option>' +
               '<option value="low" ' + (currentPriority === 'low' ? 'selected' : '') + '>Low</option>' +
               '</select>') : (currentPriority === 'low' ? 'Low' : (currentPriority === 'high' ? 'High' : 'Not set')));
          priorityContainer.innerHTML = priorityHtml;

          if (admin) {
             $(priorityContainer).find('select').on('change', function() {
                var newPrio = $(this).val();
                $.post(APP_BASE_URL + '/claims/' + feature.properties.slug + '/priority', { campaign_id: selectedCampaignId, priority: newPrio }, function() {
                   updateMap(true); 
                });
             });
          }

          var otherstxtcontainer = L.DomUtil.create('div', 'popuptxt hidden otherstext', container)
          otherstxtcontainer.innerHTML = 'This area is claimed by someone else and is unable to be claimed.'

          if (feature.properties.claim_status === 'claimed_by_you') {
            L.DomUtil.removeClass(unclaimout.grpdiv, 'hidden')
            L.DomUtil.removeClass(downloadout.grpdiv, 'hidden')
            L.DomUtil.removeClass(markCompleteOut.grpdiv, 'hidden')
          }
          else if (feature.properties.claim_status === 'claimed') {
            if (admin) {
              L.DomUtil.removeClass(markCompleteOut.grpdiv, 'hidden')
              L.DomUtil.removeClass(adminUnclaim.grpdiv, 'hidden')
              L.DomUtil.removeClass(adminDownload.grpdiv, 'hidden')
            } else {
              L.DomUtil.removeClass(otherstxtcontainer, 'hidden')
            }
          }
          else if (feature.properties.claim_status === 'complete') {
            if (admin) {
              L.DomUtil.removeClass(adminUnclaim.grpdiv, 'hidden')
              L.DomUtil.removeClass(adminDownload.grpdiv, 'hidden')
            } else if (ownerName && feature.properties.claim_status === 'complete') {
               L.DomUtil.removeClass(unclaimout.grpdiv, 'hidden')
               L.DomUtil.removeClass(downloadout.grpdiv, 'hidden')
            }
          }
          else {
            L.DomUtil.removeClass(claimout.grpdiv, 'hidden')
          }
          
          this.bindPopup(container, { autoPan: false });
        }

        bindPopupContent.call(featureLayer);

        featureLayer.on('mouseover', function () {
          var total_addresses = feature.properties.total_addresses_on_block
          var outcomes = feature.properties.outcomes_recorded || 0
          var meta = ['No data']
          if (total_addresses > 0) {
            var doors_remaining = total_addresses - outcomes
            var percent = Math.round(doors_remaining * 100.0 / total_addresses)
            meta[0] = '# of doors remaining to knock: ' + doors_remaining + ' (' + percent + '%)'
          }
          $('.block-stats-hover').html(meta.join('<br>'))
        })

        featureLayer.on('click', function (e) {
          bindPopupContent.call(this);
        })
      }
    })

    return layer
  }

  function getMeshblockCallback(json) {
    last_update_bounds = map.getBounds()
    last_update_centroid = map.getCenter()
    if (mesh_layer) { map.removeLayer(mesh_layer) }
    mesh_layer = addGeoJsonProperties(json)
    mesh_layer.addTo(map)
    $('#load').addClass('hidden')
    var currentCount = parseInt($('body').attr('data-update-count') || '0');
    $('body').attr('data-update-count', currentCount + 1);
  }

  var instruct = L.control()
  instruct.onAdd = function () {
    this._div = L.DomUtil.create('div', 'instruct')
    this._div.innerHTML = 'Zoom in further to load doorknockable areas.'
    this.update()
    return this._div
  }

  instruct.update = function () {
    $('.instruct').toggleClass('hidden', map.getZoom() > 14)
  }

  instruct.addTo(map)

  function updateMap(force) {
    if (map.getZoom() === undefined) {
      return;
    }
    var distance_moved, reload_dist
    var lat_lng_bnd = map.getBounds()
    var lat_lng_centroid = map.getCenter()
    Cookies.set('lat', lat_lng_centroid.lat)
    Cookies.set('lng', lat_lng_centroid.lng)
    if (last_update_centroid) {
      distance_moved = lat_lng_centroid.distanceTo(last_update_centroid)
    } else {
      distance_moved = 201
    }
    var zoom = map.getZoom()
    if (zoom > 14) {
      reload_dist = 1000 / (zoom - 14)
    } else {
      reload_dist = 0
    }
    Cookies.set('zoom', zoom)

    //Reload map if zoom not too high
    //Distance moved is not short
    //and
    //there is no last_update or the current map bounds are not within the last update's
    var moveTrigger = zoom > 14
      && (!last_update_bounds || distance_moved > reload_dist)
      && (!last_update_bounds || !last_update_bounds.contains(lat_lng_bnd))

    var forceAllowed = force && zoom > 14

    if (moveTrigger || forceAllowed) {
      if (!selectedCampaignId) {
        if (mesh_layer) { map.removeLayer(mesh_layer) }
        return;
      }
      $('#load').removeClass('hidden')

      var data = {
        sey: lat_lng_bnd.getSouthWest().lat,
        sex: lat_lng_bnd.getSouthWest().lng,
        nwy: lat_lng_bnd.getNorthEast().lat,
        nwx: lat_lng_bnd.getNorthEast().lng,
        campaign_id: selectedCampaignId
      }

      $.getJSON(APP_BASE_URL + '/meshblocks_bounds', data, getMeshblockCallback)
        .fail(function () {
          $('#load').addClass('hidden')
          alert('Error loading ' + regionNamePlural.toLowerCase() + '. Please reload the page.')
        })
    }
    instruct.update()
  }

  map.on('moveend', function () {
    updateMap()
  })

  var legend = L.control({ position: 'bottomright' })

  legend.onAdd = function () {
    var div = L.DomUtil.create('div', 'legend')
    div.innerHTML = [
      '<i style="opacity:0.8;background:', claimStyles.fourthQuartile.fillColor, '"></i><div>Higher Priority</div>',
      '<i style="opacity:0.8;background:', claimStyles.firstQuartile.fillColor, '"></i><div>Lower Priority</div>',
      '<i style="opacity:0.8;background:', claimStyles.claimed_by_you.fillColor, '"></i><div>My area</div>',
      '<i style="opacity:0.8;background:', claimStyles.claimed.fillColor, '"></i><div>Claimed</div>',
      '<i style="opacity:0.8;background:', claimStyles.complete.fillColor, '"></i><div>Complete</div>',
    ].join('')
    return div
  }

  legend.addTo(map)
  map.whenReady(updateMap)
  return updateMap
}



function windowHeight() {
  if (window.innerHeight != undefined) return window.innerHeight
  var B = document.body, D = document.documentElement
  return Math.max(B.clientHeight, D.clientHeight)
}
var headerHeight = $('.header').height()

var LAMBDA_BASE_URL = $('#map').data('lambda-base-url')
$('#map').height(windowHeight() - headerHeight)
$('#map').width('100%')
var updateLeafletMap = makeMap()


function openHelp() {
  $('#dialog').dialog({
    minWidth: 800,
    width: 800,
    height: Math.min(windowHeight() - headerHeight - 200, 800),
    beforeClose: function () { $('#dialog').addClass('hidden') }
  })
  $('#dialog').dialog({ position: { my: 'center top', at: 'center top+15%', of: window } })
  $('#dialog').removeClass('hidden')
  try { window.localStorage.setItem('helpSeen', 'true') } catch (_) { }
}
$('#faqlink').click(openHelp)

var helpSeen = 'false'
try { helpSeen = window.localStorage.getItem('helpSeen') } catch (_) { }
if (helpSeen !== 'true') $(window).load(openHelp)


// Removed hardcoded campaign handling

$('#template').change(function () {
  var template = $('#template').val()
  try { window.localStorage.setItem('template', template) } catch (_) { }
  updateLeafletMap(true)
})
var template
try { template = window.localStorage.getItem('template') } catch (_) { }
$('#template').val(template || 'hidden')
