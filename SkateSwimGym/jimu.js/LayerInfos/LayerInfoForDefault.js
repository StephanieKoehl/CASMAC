///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/_base/lang',
  'esri/graphicsUtils',
  'dojo/aspect',
  './LayerInfo',
  'dojox/gfx',
  'dojo/dom-construct',
  'dojo/dom-attr',
  'dojo/Deferred',
  'esri/geometry/webMercatorUtils',
  'esri/symbols/jsonUtils'
], function(declare, array, lang, graphicsUtils, aspect, LayerInfo, gfx, domConstruct,
domAttr, Deferred, webMercatorUtils, jsonUtils) {
  var clazz = declare(LayerInfo, {
    _legendsNode: null,
    // operLayer = {
    //    layerObject: layer,
    //    title: layer.label || layer.title || layer.name || layer.id || " ",
    //    id: layerId || " ",
    //    subLayers: [operLayer, ... ],
    //    mapService: {layerInfo: , subId: },
    //    collection: {layerInfo: }
    // };
    constructor: function( operLayer, map ) {

      this.layerLoadedDef = new Deferred();

      /*
      if(this.layerObject) {
        this.layerObject.on('load', lang.hitch(this, function(){
          this.layerLoadedDef.resolve();
        }));
      }
      */

      /*jshint unused: false*/

      // about popupMenu
      if (operLayer.selfType) {
        this.popupMenuInfo.menuItems = [{
          key: 'table',
          label: this.nls.itemToAttributeTable
        }, {
          key: null,
          label: ''
        },{
          key: 'description',
          label: '<a class="menu-item-description" target="_blank" href=' +
                 ((this.layerObject && this.layerObject.url) ? this.layerObject.url : '') +
                 '>' + this.nls.itemDesc + '</a>'
        }];

        
      } else if (this.layerObject.declaredClass === 'esri.layers.FeatureLayer' ||
                 this.layerObject.declaredClass === 'esri.layers.CSVLayer'
                 /*this.layerObject.declaredClass === 'esri.layers.StreamLayer'*/) {
        var index = -1;
        var i     = 0;
        for(i = 0; i < this.popupMenuInfo.menuItems.length; i++) {
          if (this.popupMenuInfo.menuItems[i].key === 'movedown') {
            index = i;
            break;
          }
        }

        this.popupMenuInfo.menuItems
        .splice(index + 1, 0, '', {key: "table", label: this.nls.itemToAttributeTable});
      }
    },

    getExtent: function() {
      return this._convertGeometryToMapSpatialRef(this.originOperLayer.layerObject.fullExtent) ||
        this._convertGeometryToMapSpatialRef(this.originOperLayer.layerObject.initialExtent);
    },

    initVisible: function() {
      /*jshint unused: false*/
      var visible = false;
      visible = this.originOperLayer.layerObject.visible;
      this._visible = visible;
    },

    _setTopLayerVisible: function(visible) {
      if(this.originOperLayer.collection){
        //collection
        //click directly
        if(this.originOperLayer.collection.layerInfo._visible) {
          if(visible) {
            this.layerObject.show();
            this._visible = true;
          } else {
            this.layerObject.hide();
            this._visible = false;
          }
        } else {
          if(visible) {
            this.layerObject.hide();
            this._visible = true;
          } else {
            this.layerObject.hide();
            this._visible = false;
          }
        }
      } else {
        if (visible) {
          this.layerObject.show();
        } else {
          this.layerObject.hide();
        }
        this._visible = visible;
      }
    },

    setLayerVisiblefromTopLayer: function() {
      //click from top collecton
      if(this.originOperLayer.collection.layerInfo._visible) {
        if(this._visible) {
          this.layerObject.show();
        }
      } else {
        this.layerObject.hide();
      }
    },

    //---------------new section-----------------------------------------

    // obtainLegendsNode: function() {
    //   var layer = this.originOperLayer.layerObject;
    //   var legendsNode = domConstruct.create("div", {
    //     "class": "legends-div"
    //   });

    //   if (layer && layer.renderer) {
    //     this.initLegendsNode(legendsNode);
    //   } else {
    //     this.layerLoadedDef.then(lang.hitch(this, function(){
    //       this.initLegendsNode(legendsNode);
    //     }));
    //   }
    //   return legendsNode;
    // },

    createLegendsNode: function() {
      var legendsNode = domConstruct.create("div", {
        "class": "legends-div jimu-leading-margin1"
      }, document.body);
      domConstruct.create("img", {
        "class": "legends-loading-img",
        "src":  require.toUrl('jimu') + '/images/loading.gif'
      }, legendsNode);
      return legendsNode;
    },

    drawLegends: function(legendsNode) {
      this.initLegendsNode(legendsNode);
    },

    initLegendsNode: function(legendsNode) {
      var legendInfos = [];
      var layer = this.layerObject;

      if( this.layerObject &&
          !this.layerObject.empty &&
          (!this.originOperLayer.subLayer || this.originOperLayer.subLayers.length === 0)) {
        // delete loading image, this condition means the layer already loaded.
        domConstruct.empty(legendsNode);
        // layer has renderer that means the layer has loadded.
        if (layer.renderer) {
          if (layer.renderer.infos) {
            legendInfos = lang.clone(layer.renderer.infos); // todo
          } else {
            legendInfos.push({
              label: layer.renderer.label,
              symbol: layer.renderer.symbol
            });
          }

          array.forEach(legendInfos, function(legendInfo) {
            legendInfo.legendDiv = domConstruct.create("div", {
              "class": "legend-div"
            }, legendsNode);

            legendInfo.symbolDiv= domConstruct.create("div", {
              "class": "legend-symbol jimu-float-leading"
            }, legendInfo.legendDiv);
            legendInfo.labelDiv= domConstruct.create("div", {
              "class": "legend-label jimu-float-leading",
              "innerHTML": legendInfo.label || " "
            }, legendInfo.legendDiv);

            if(legendInfo.symbol.type === "textsymbol") {
              domAttr.set(legendInfo.symbolDiv, "innerHTML", legendInfo.symbol.text);
            } else {
              var mySurface = gfx.createSurface(legendInfo.symbolDiv, 50, 50);
              var descriptors = jsonUtils.getShapeDescriptors(legendInfo.symbol);
              var shape = mySurface.createShape(descriptors.defaultShape)
                          .setFill(descriptors.fill).setStroke(descriptors.stroke);
              shape.setTransform(gfx.matrix.translate(25, 25));
            }
          }, this);
        }
      }
    },

    obtainNewSubLayers: function() {
      var newSubLayers = [];
      /*
      if(!this.originOperLayer.subLayers || this.originOperLayer.subLayers.length === 0) {
        //***
      } else {
      */
      if(this.originOperLayer.subLayers && this.originOperLayer.subLayers.length !== 0) {
        array.forEach(this.originOperLayer.subLayers, function(subOperLayer){
          var subLayerInfo = new clazz(subOperLayer, this.map);
          newSubLayers.push(subLayerInfo);

          subLayerInfo.init();
        }, this);
      }
      return newSubLayers;
    },

    getOpacity: function() {
      if (this.layerObject.opacity) {
        return this.layerObject.opacity;
      } else {
        return 1;
      }
    },

    setOpacity: function(opacity) {
      if (this.layerObject.setOpacity) {
        this.layerObject.setOpacity(opacity);
      }
    }

    // isShowInMap: function() {
    //   var visible = false;
    //   if(this.originOperLayer.collection){
    //     visible = this.originOperLayer.collection.layerInfo._visible && this.layerObject.visible;
    //   } else {
    //     visible = this.layerObject.visible;
    //   }
    //   return visible;
    // }

  });
  return clazz;
});
