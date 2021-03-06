'use strict';

var path = require('path');
var Devebot = require('devebot');
var Promise = Devebot.require('bluebird');
var loader = Devebot.require('loader');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('debug')('appSidemenu:service');

var Service = function(params) {
  debugx.enabled && debugx(', constructor begin ...');

  params = params || {};

  var self = this;
  var logger = params.loggingFactory.getLogger();
  var pluginCfg = params.sandboxConfig;
  var contextPath = pluginCfg.contextPath || '/sidemenu';
  var express = params.webweaverService.express;

  var interceptUrls = pluginCfg.interceptUrls || [contextPath + '/(.*).html'];
  var menuData = pluginCfg.menuData || [];

  var menuType = pluginCfg.menuType;
  if (['pushmenu', 'flypanels'].indexOf(menuType) < 0) {
    menuType = 'pushmenu';
  }

  var menuTemplate = {};
  menuTemplate[menuType] = loader(path.join(__dirname, '../trailers', 'sidemenu-' + menuType))({
    contextPath: contextPath,
    interceptUrls: interceptUrls,
    menuData: menuData
  });

  params.webinjectService.enqueue(menuTemplate[menuType]);

  self.getStaticFilesLayer = function() {
    return {
      name: 'app-sidemenu-public',
      path: contextPath,
      middleware: express.static(path.join(__dirname, '../../public'))
    };
  }

  var router = new express();
  router.set('views', __dirname + '/../../views');
  router.set('view engine', 'ejs');
  router.route('/assets/sidemenu/js/loader.js').get(function(req, res, next) {
    res.render('loader_js', {
      menuType: menuType
    });
  });
  router.route('/assets/sidemenu/js/menudata.js').get(function(req, res, next) {
    res.render('menudata_js', {
      menuData: menuData
    });
  });

  self.getJavascriptLayer = function() {
    return {
      name: 'app-sidemenu-router',
      path: contextPath,
      middleware: router
    };
  }

  if (pluginCfg.autowired !== false) {
    params.webinjectService.inject([
      self.getJavascriptLayer(),
      self.getStaticFilesLayer()
    ], pluginCfg.priority);
  }

  debugx.enabled && debugx(' - constructor end!');
};

Service.argumentSchema = {
  "id": "sidemenuService",
  "type": "object",
  "properties": {
    "webinjectService": {
      "type": "object"
    },
    "webweaverService": {
      "type": "object"
    }
  }
};

module.exports = Service;
