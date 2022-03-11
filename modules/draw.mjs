/// generic draw, loads functionality via dynamic import

import { select as d3_select } from './d3.mjs';

import { loadScript, findFunction, internals, extend, isNodeJs } from './core.mjs';

import { cleanup, drawRawText, compressSVG, loadJSDOM, getElementCanvPainter } from './painter.mjs';

import { BasePainter } from './base/BasePainter.mjs';

import { ObjectPainter } from './base/ObjectPainter.mjs';

import { TPadPainter } from './gpad/TPadPainter.mjs';

// list of registered draw functions
let drawFuncs = { lst: [
   { name: "TCanvas", icon: "img_canvas", class: () => import('./gpad/TCanvasPainter.mjs').then(h => h.TCanvasPainter), opt: ";grid;gridx;gridy;tick;tickx;ticky;log;logx;logy;logz", expand_item: "fPrimitives" },
   { name: "TPad", icon: "img_canvas", class: () => import('./gpad/TPadPainter.mjs').then(h => h.TPadPainter), opt: ";grid;gridx;gridy;tick;tickx;ticky;log;logx;logy;logz", expand_item: "fPrimitives" },
   { name: "TSlider", icon: "img_canvas", class: () => import('./gpad/TPadPainter.mjs').then(h => h.TPadPainter) },
   { name: "TFrame", icon: "img_frame", draw: () => import('./gpad/TCanvasPainter.mjs').then(h => h.drawTFrame) },
   { name: "TPave", icon: "img_pavetext", class: () => import('./hist/TPavePainter.mjs').then(h => h.TPavePainter) },
   { name: "TPaveText", sameas: "TPave" },
   { name: "TPavesText", sameas: "TPave" },
   { name: "TPaveStats", sameas: "TPave" },
   { name: "TPaveLabel", sameas: "TPave" },
   { name: "TDiamond", sameas: "TPave" },
   { name: "TLegend", icon: "img_pavelabel", sameas: "TPave" },
   { name: "TPaletteAxis", icon: "img_colz", sameas: "TPave" },
   { name: "TLatex", icon: "img_text", draw: () => import('./more.mjs').then(h => h.drawText), direct: true },
   { name: "TMathText", sameas: "TLatex" },
   { name: "TText", sameas: "TLatex" },
   { name: /^TH1/, icon: "img_histo1d", class: () => import('./hist/TH1Painter.mjs').then(h => h.TH1Painter), opt: ";hist;P;P0;E;E1;E2;E3;E4;E1X0;L;LF2;B;B1;A;TEXT;LEGO;same", ctrl: "l" },
   { name: "TProfile", icon: "img_profile", class: () => import('./hist/TH1Painter.mjs').then(h => h.TH1Painter), opt: ";E0;E1;E2;p;AH;hist" },
   { name: "TH2Poly", icon: "img_histo2d", class: () => import('./hist/TH2Painter.mjs').then(h => h.TH2Painter), opt: ";COL;COL0;COLZ;LCOL;LCOL0;LCOLZ;LEGO;TEXT;same", expand_item: "fBins", theonly: true },
   { name: "TProfile2Poly", sameas: "TH2Poly" },
   { name: "TH2PolyBin", icon: "img_histo2d", draw_field: "fPoly", draw_field_opt: "L" },
   { name: /^TH2/, icon: "img_histo2d", class: () => import('./hist/TH2Painter.mjs').then(h => h.TH2Painter), dflt: "col", opt: ";COL;COLZ;COL0;COL1;COL0Z;COL1Z;COLA;BOX;BOX1;PROJ;PROJX1;PROJX2;PROJX3;PROJY1;PROJY2;PROJY3;SCAT;TEXT;TEXTE;TEXTE0;CANDLE;CANDLE1;CANDLE2;CANDLE3;CANDLE4;CANDLE5;CANDLE6;CANDLEY1;CANDLEY2;CANDLEY3;CANDLEY4;CANDLEY5;CANDLEY6;VIOLIN;VIOLIN1;VIOLIN2;VIOLINY1;VIOLINY2;CONT;CONT1;CONT2;CONT3;CONT4;ARR;SURF;SURF1;SURF2;SURF4;SURF6;E;A;LEGO;LEGO0;LEGO1;LEGO2;LEGO3;LEGO4;same", ctrl: "lego" },
   { name: "TProfile2D", sameas: "TH2" },
   { name: /^TH3/, icon: 'img_histo3d', class: () => import('./hist3d/TH3Painter.mjs').then(h => h.TH3Painter), opt: ";SCAT;BOX;BOX2;BOX3;GLBOX1;GLBOX2;GLCOL" },
   { name: "THStack", icon: "img_histo1d", class: () => import('./hist/THStackPainter.mjs').then(h => h.THStackPainter), expand_item: "fHists", opt: "NOSTACK;HIST;E;PFC;PLC" },
   { name: "TPolyMarker3D", icon: 'img_histo3d', draw: () => import('./base3d.mjs').then(h => h.drawPolyMarker3D), direct: true, frame: "3d" },
   { name: "TPolyLine3D", icon: 'img_graph', draw: () => import('./base3d.mjs').then(h => h.drawPolyLine3D), direct: true, frame: "3d" },
   { name: "TGraphStruct" },
   { name: "TGraphNode" },
   { name: "TGraphEdge" },
   { name: "TGraphTime", icon: "img_graph", class: () => import('./more.mjs').then(h => h.TGraphTimePainter), opt: "once;repeat;first", theonly: true },
   { name: "TGraph2D", icon: "img_graph", class: () => import('./hist3d/TGraph2DPainter.mjs').then(h => h.TGraph2DPainter), opt: ";P;PCOL", theonly: true },
   { name: "TGraph2DErrors", sameas: "TGraph2D", opt: ";P;PCOL;ERR", theonly: true },
   { name: "TGraphPolargram", icon: "img_graph", class: () => import('./more.mjs').then(h => h.TGraphPolargramPainter), theonly: true },
   { name: "TGraphPolar", icon: "img_graph", class: () => import('./more.mjs').then(h => h.TGraphPolarPainter), opt: ";F;L;P;PE", theonly: true },
   { name: /^TGraph/, icon: "img_graph", class: () => import('./more.mjs').then(h => h.TGraphPainter), opt: ";L;P" },
   { name: "TEfficiency", icon: "img_graph", class: () => import('./more.mjs').then(h => h.TEfficiencyPainter), opt: ";AP" },
   { name: "TCutG", sameas: "TGraph" },
   { name: /^RooHist/, sameas: "TGraph" },
   { name: /^RooCurve/, sameas: "TGraph" },
   { name: "RooPlot", icon: "img_canvas", draw: () => import('./more.mjs').then(h => h.drawRooPlot) },
   { name: "TRatioPlot", icon: "img_mgraph", class: () => import('./more.mjs').then(h => h.TRatioPlotPainter), opt: "" },
   { name: "TMultiGraph", icon: "img_mgraph", class: () => import('./more.mjs').then(h => h.TMultiGraphPainter), opt: ";l;p;3d", expand_item: "fGraphs" },
   { name: "TStreamerInfoList", icon: "img_question", draw: () => import('./hierarchy.mjs').then(h => h.drawStreamerInfo) },
   { name: "TWebPainting", icon: "img_graph", class: () => import('./more.mjs').then(h => h.TWebPaintingPainter) },
   { name: "TCanvasWebSnapshot", icon: "img_canvas", draw: () => import('./gpad/TCanvasPainter.mjs').then(h => h.drawTPadSnapshot) },
   { name: "TPadWebSnapshot", sameas: "TCanvasWebSnapshot" },
   { name: "kind:Text", icon: "img_text", func: drawRawText },
   { name: "TObjString", icon: "img_text", func: drawRawText },
   { name: "TF1", icon: "img_tf1", class: () => import('./more.mjs').then(h => h.TF1Painter) },
   { name: "TF2", icon: "img_tf2", draw: () => import('./more.mjs').then(h => h.drawTF2) },
   { name: "TSpline3", icon: "img_tf1", class: () => import('./more.mjs').then(h => h.TSplinePainter) },
   { name: "TSpline5", sameas: 'TSpline3' },
   { name: "TEllipse", icon: 'img_graph', draw: () => import('./more.mjs').then(h => h.drawEllipse), direct: true },
   { name: "TArc", sameas: 'TEllipse' },
   { name: "TCrown", sameas: 'TEllipse' },
   { name: "TPie", icon: 'img_graph', draw: () => import('./more.mjs').then(h => h.drawPie), direct: true },
   { name: "TPieSlice", icon: 'img_graph', dummy: true },
   { name: "TExec", icon: "img_graph", dummy: true },
   { name: "TLine", icon: 'img_graph', draw: () => import('./more.mjs').then(h => h.drawLine), direct: true },
   { name: "TArrow", icon: 'img_graph', draw: () => import('./more.mjs').then(h => h.drawArrow), direct: true },
   { name: "TPolyLine", icon: 'img_graph', draw: () => import('./more.mjs').then(h => h.drawPolyLine), direct: true },
   { name: "TCurlyLine", sameas: 'TPolyLine' },
   { name: "TCurlyArc", sameas: 'TPolyLine' },
   { name: "TParallelCoord", icon: "img_graph", dummy: true },
   { name: "TGaxis", icon: "img_graph", draw: () => import('./gpad/TCanvasPainter.mjs').then(h => h.drawTGaxis) },
   { name: "TBox", icon: 'img_graph', draw: () => import('./more.mjs').then(h => h.drawBox), direct: true },
   { name: "TWbox", sameas: "TBox" },
   { name: "TSliderBox", sameas: "TBox" },
   { name: "TMarker", icon: 'img_graph', draw: () => import('./more.mjs').then(h => h.drawMarker), direct: true },
   { name: "TPolyMarker", icon: 'img_graph', draw: () => import('./more.mjs').then(h => h.drawPolyMarker), direct: true },
   { name: "TASImage", icon: 'img_mgraph', class: () => import('./more.mjs').then(h => h.TASImagePainter), opt: ";z" },
   { name: "TJSImage", icon: 'img_mgraph', draw: () => import('./more.mjs').then(h => h.drawJSImage), opt: ";scale;center" },
   { name: "TGeoVolume", icon: 'img_histo3d', class: () => import('./geom.mjs').then(h => h.TGeoPainter), get_expand: () => import('./geom.mjs').then(h => h.expandGeoObject), opt: ";more;all;count;projx;projz;wire;no_screen;dflt", ctrl: "dflt" },
   { name: "TEveGeoShapeExtract", sameas: "TGeoVolume", opt: ";more;all;count;projx;projz;wire;dflt" },
   { name: "ROOT::Experimental::REveGeoShapeExtract", sameas: "TGeoVolume", opt: ";more;all;count;projx;projz;wire;dflt" },
   { name: "TGeoOverlap", sameas: "TGeoVolume", opt: ";more;all;count;projx;projz;wire;dflt", dflt: "dflt", ctrl: "expand" },
   { name: "TGeoManager", sameas: "TGeoVolume", opt: ";more;all;count;projx;projz;wire;tracks;no_screen;dflt", dflt: "expand", ctrl: "dflt" },
   { name: /^TGeo/, sameas: "TGeoVolume", opt: ";more;all;axis;compa;count;projx;projz;wire;no_screen;dflt", dflt: "dflt", ctrl: "expand" },
   { name: "TAxis3D", icon: 'img_graph', draw: () => import('./geom.mjs').then(h => h.drawAxis3D), direct: true },
   // these are not draw functions, but provide extra info about correspondent classes
   { name: "kind:Command", icon: "img_execute", execute: true },
   { name: "TFolder", icon: "img_folder", icon2: "img_folderopen", noinspect: true, get_expand: () => import('./hierarchy.mjs').then(h => h.folderHierarchy) },
   { name: "TTask", icon: "img_task", get_expand: () => import('./hierarchy.mjs').then(h => h.taskHierarchy), for_derived: true },
   { name: "TTree", icon: "img_tree", get_expand: () => import('./tree.mjs').then(h => h.treeHierarchy), draw: () => import('./tree.mjs').then(h => h.drawTree), dflt: "expand", opt: "player;testio", shift: "inspect", direct: true },
   { name: "TNtuple", sameas: "TTree" },
   { name: "TNtupleD", sameas: "TTree" },
   { name: "TBranchFunc", icon: "img_leaf_method", draw: () => import('./tree.mjs').then(h => h.drawTree), opt: ";dump", noinspect: true, direct: true },
   { name: /^TBranch/, icon: "img_branch", draw: () => import('./tree.mjs').then(h => h.drawTree), dflt: "expand", opt: ";dump", ctrl: "dump", shift: "inspect", ignore_online: true, direct: true },
   { name: /^TLeaf/, icon: "img_leaf", noexpand: true, draw: () => import('./tree.mjs').then(h => h.drawTree), opt: ";dump", ctrl: "dump", ignore_online: true, direct: true },
   { name: "TList", icon: "img_list", draw: () => import('./hierarchy.mjs').then(h => h.drawList), get_expand: () => import('./hierarchy.mjs').then(h => h.listHierarchy), dflt: "expand" },
   { name: "THashList", sameas: "TList" },
   { name: "TObjArray", sameas: "TList" },
   { name: "TClonesArray", sameas: "TList" },
   { name: "TMap", sameas: "TList" },
   { name: "TColor", icon: "img_color" },
   { name: "TFile", icon: "img_file", noinspect: true },
   { name: "TMemFile", icon: "img_file", noinspect: true },
   { name: "TStyle", icon: "img_question", noexpand: true },
   { name: "Session", icon: "img_globe" },
   { name: "kind:TopFolder", icon: "img_base" },
   { name: "kind:Folder", icon: "img_folder", icon2: "img_folderopen", noinspect: true },
   { name: "ROOT::Experimental::RCanvas", icon: "img_canvas", class: () => import('./v7gpad.mjs').then(h => h.RCanvasPainter), opt: "", expand_item: "fPrimitives" },
   { name: "ROOT::Experimental::RCanvasDisplayItem", icon: "img_canvas", draw: () => import('./v7gpad.mjs').then(h => h.drawRPadSnapshot), opt: "", expand_item: "fPrimitives" },
   { name: "ROOT::Experimental::RHist1Drawable", icon: "img_histo1d", class: () => import('./v7hist.mjs').then(h => h.RH1Painter), opt: "" },
   { name: "ROOT::Experimental::RHist2Drawable", icon: "img_histo2d", class: () => import('./v7hist.mjs').then(h => h.RH2Painter), opt: "" },
   { name: "ROOT::Experimental::RHist3Drawable", icon: "img_histo3d", class: () => import('./v7hist3d.mjs').then(h => h.RH3Painter), opt: "" },
   { name: "ROOT::Experimental::RHistDisplayItem", icon: "img_histo1d", draw: () => import('./v7hist.mjs').then(h => h.drawHistDisplayItem), opt: "" },
   { name: "ROOT::Experimental::RText", icon: "img_text", draw: () => import('./v7more.mjs').then(h => h.drawText), opt: "", direct: "v7", csstype: "text" },
   { name: "ROOT::Experimental::RFrameTitle", icon: "img_text", draw: () => import('./v7gpad.mjs').then(h => h.drawRFrameTitle), opt: "", direct: "v7", csstype: "title" },
   { name: "ROOT::Experimental::RPaletteDrawable", icon: "img_text", class: () => import('./v7gpad.mjs').then(h => h.RPalettePainter), opt: "" },
   { name: "ROOT::Experimental::RDisplayHistStat", icon: "img_pavetext", class: () => import('./v7hist.mjs').then(h => h.RHistStatsPainter), opt: "" },
   { name: "ROOT::Experimental::RLine", icon: "img_graph", draw: () => import('./v7more.mjs').then(h => h.drawLine), opt: "", direct: "v7", csstype: "line" },
   { name: "ROOT::Experimental::RBox", icon: "img_graph", draw: () => import('./v7more.mjs').then(h => h.drawBox), opt: "", direct: "v7", csstype: "box" },
   { name: "ROOT::Experimental::RMarker", icon: "img_graph", draw: () => import('./v7more.mjs').then(h => h.drawMarker), opt: "", direct: "v7", csstype: "marker" },
   { name: "ROOT::Experimental::RPave", icon: "img_pavetext", class: () => import('./v7gpad.mjs').then(h => h.RPavePainter), opt: "" },
   { name: "ROOT::Experimental::RLegend", icon: "img_graph", class: () => import('./v7more.mjs').then(h => h.RLegendPainter), opt: "" },
   { name: "ROOT::Experimental::RPaveText", icon: "img_pavetext", class: () => import('./v7more.mjs').then(h => h.RPaveTextPainter), opt: "" },
   { name: "ROOT::Experimental::RFrame", icon: "img_frame", class: () => import('./v7gpad.mjs').then(h => h.RFramePainter), opt: "" },
   { name: "ROOT::Experimental::RFont", icon: "img_text", draw: () => import('./v7gpad.mjs').then(h => h.drawRFont), opt: "", direct: "v7", csstype: "font" },
   { name: "ROOT::Experimental::RAxisDrawable", icon: "img_frame", class: () => import('./v7gpad.mjs').then(h => h.RAxisPainter), opt: "" }
], cache: {} };


/** @summary Register draw function for the class
  * @desc List of supported draw options could be provided, separated  with ';'
  * @param {object} args - arguments
  * @param {string|regexp} args.name - class name or regexp pattern
  * @param {function} [args.func] - draw function
  * @param {function} [args.draw] - async function to load draw function
  * @param {function} [args.class] - async function to load painter class with static draw function
  * @param {boolean} [args.direct] - if true, function is just Redraw() method of ObjectPainter
  * @param {string} [args.opt] - list of supported draw options (separated with semicolon) like "col;scat;"
  * @param {string} [args.icon] - icon name shown for the class in hierarchy browser
  * @param {string} [args.draw_field] - draw only data member from object, like fHistogram
  * @protected */
function addDrawFunc(args) {
   drawFuncs.lst.push(args);
   return args;
}

/** @summary return draw handle for specified item kind
  * @desc kind could be ROOT.TH1I for ROOT classes or just
  * kind string like "Command" or "Text"
  * selector can be used to search for draw handle with specified option (string)
  * or just sequence id
  * @private */
function getDrawHandle(kind, selector) {

   if (typeof kind != 'string') return null;
   if (selector === "") selector = null;

   let first = null;

   if ((selector === null) && (kind in drawFuncs.cache))
      return drawFuncs.cache[kind];

   let search = (kind.indexOf("ROOT.") == 0) ? kind.substr(5) : "kind:" + kind, counter = 0;
   for (let i = 0; i < drawFuncs.lst.length; ++i) {
      let h = drawFuncs.lst[i];
      if (typeof h.name == "string") {
         if (h.name != search) continue;
      } else {
         if (!search.match(h.name)) continue;
      }

      if (h.sameas !== undefined) {
         let hs = getDrawHandle("ROOT." + h.sameas, selector);
         if (hs) {
            for (let key in hs)
               if (h[key] === undefined)
                  h[key] = hs[key];
            delete h.sameas;
         }
         return h;
      }

      if ((selector === null) || (selector === undefined)) {
         // store found handle in cache, can reuse later
         if (!(kind in drawFuncs.cache)) drawFuncs.cache[kind] = h;
         return h;
      } else if (typeof selector == 'string') {
         if (!first) first = h;
         // if drawoption specified, check it present in the list

         if (selector == "::expand") {
            if (('expand' in h) || ('expand_item' in h)) return h;
         } else
            if ('opt' in h) {
               let opts = h.opt.split(';');
               for (let j = 0; j < opts.length; ++j) opts[j] = opts[j].toLowerCase();
               if (opts.indexOf(selector.toLowerCase()) >= 0) return h;
            }
      } else if (selector === counter) {
         return h;
      }
      ++counter;
   }

   return first;
}

/** @summary Returns true if handle can be potentially drawn
  * @private */
function canDrawHandle(h)
{
   if (typeof h == 'string')
      h = getDrawHandle(h);
   if (!h || (typeof h !== 'object')) return false;
   return h.func || h.class || h.draw || h.draw_field ? true : false;
}

/** @summary Provide draw settings for specified class or kind
  * @private */
function getDrawSettings(kind, selector) {
   let res = { opts: null, inspect: false, expand: false, draw: false, handle: null };
   if (typeof kind != 'string') return res;
   let isany = false, noinspect = false, canexpand = false;
   if (typeof selector !== 'string') selector = "";

   for (let cnt = 0; cnt < 1000; ++cnt) {
      let h = getDrawHandle(kind, cnt);
      if (!h) break;
      if (!res.handle) res.handle = h;
      if (h.noinspect) noinspect = true;
      if (h.expand || h.expand_item || h.can_expand) canexpand = true;
      if (!h.func && !h.class && !h.draw) break;
      isany = true;
      if (!('opt' in h)) continue;
      let opts = h.opt.split(';');
      for (let i = 0; i < opts.length; ++i) {
         opts[i] = opts[i].toLowerCase();
         if ((selector.indexOf('nosame') >= 0) && (opts[i].indexOf('same') == 0)) continue;

         if (res.opts === null) res.opts = [];
         if (res.opts.indexOf(opts[i]) < 0) res.opts.push(opts[i]);
      }
      if (h.theonly) break;
   }

   if (selector.indexOf('noinspect') >= 0) noinspect = true;

   if (isany && (res.opts === null)) res.opts = [""];

   // if no any handle found, let inspect ROOT-based objects
   if (!isany && (kind.indexOf("ROOT.") == 0) && !noinspect) res.opts = [];

   if (!noinspect && res.opts)
      res.opts.push("inspect");

   res.inspect = !noinspect;
   res.expand = canexpand;
   res.draw = res.opts && (res.opts.length > 0);

   return res;
}

/** @summary Set default draw option for provided class */
function setDefaultDrawOpt(classname, opt) {
   let handle = getDrawHandle("ROOT." + classname, 0);
   if (handle)
      handle.dflt = opt;
}

/** @summary Draw object in specified HTML element with given draw options.
  * @param {string|object} dom - id of div element to draw or directly DOMElement
  * @param {object} obj - object to draw, object type should be registered before with {@link addDrawFunc}
  * @param {string} opt - draw options separated by space, comma or semicolon
  * @returns {Promise} with painter object
  * @requires painter
  * @desc An extensive list of support draw options can be found on [examples page]{@link https://root.cern/js/latest/examples.htm}
  * @example
  * let file = await openFile("https://root.cern/js/files/hsimple.root");
  * let obj = await file.readObject("hpxpy;1");
  * await draw("drawing", obj, "colz;logx;gridx;gridy"); */
async function draw(dom, obj, opt) {
   if (!obj || (typeof obj !== 'object'))
      throw Error('not an object in draw call');

   if (opt == 'inspect')
      return import('./hierarchy.mjs').then(h => h.drawInspector(dom, obj));

   let handle, type_info;
   if ('_typename' in obj) {
      type_info = "type " + obj._typename;
      handle = getDrawHandle("ROOT." + obj._typename, opt);
   } else if ('_kind' in obj) {
      type_info = "kind " + obj._kind;
      handle = getDrawHandle(obj._kind, opt);
   } else
      return import("./hierarchy.mjs").then(h => h.drawInspector(dom, obj));

   // this is case of unsupported class, close it normally
   if (!handle)
      throw Error(`Object of ${type_info} cannot be shown with draw`);

   if (handle.dummy)
      return null;

   if (handle.draw_field && obj[handle.draw_field])
      return draw(dom, obj[handle.draw_field], opt || handle.draw_field_opt);

   if (!canDrawHandle(handle)) {
      if (opt && (opt.indexOf("same") >= 0)) {

         let main_painter = getElementMainPainter(dom);

         if (main_painter && (typeof main_painter.performDrop === 'function'))
            return main_painter.performDrop(obj, "", null, opt);
      }

      throw Error(`Function not specified to draw object ${type_info}`);
   }

   async function performDraw() {
      let painter;
      if (handle.direct == "v7") {
         let v7h = await import('./v7gpad.mjs');
         painter = new v7h.RObjectPainter(dom, obj, opt, handle.csstype);
         await v7h.ensureRCanvas(painter, handle.frame || false);
         painter.redraw = handle.func;
         await painter.redraw();
      } else if (handle.direct) {
         painter = new ObjectPainter(dom, obj, opt);
         let v6h = await import('./gpad/TCanvasPainter.mjs');
         await v6h.ensureTCanvas(painter, handle.frame || false);
         painter.redraw = handle.func;
         await painter.redraw();
      } else {
         painter = await handle.func(dom, obj, opt);
      }

      if (!painter)
          throw Error(`Fail to draw object ${type_info}`);

      if ((typeof painter == 'object') && !painter.options)
         painter.options = { original: opt || "" }; // keep original draw options

       return painter;
   }

   if (typeof handle.func == 'function')
      return performDraw();

   if (handle.class && (typeof handle.class == 'function')) {
      // class coded as async function which returns class handle
      // simple extract class and access class.draw method
      let cl = await handle.class();
      handle.func = cl.draw;
   } else if (handle.draw && (typeof handle.draw == 'function')) {
      // draw function without special class
      handle.func = await handle.draw();
   } else if (!handle.func || typeof handle.func !== 'string') {
      throw Error(`Draw function or class not specified to draw ${type_info}`);
   } else if (!handle.prereq && !handle.script) {
      throw Error(`Prerequicities to load ${handle.func} are not specified`);
   } else {
      let v6 = await import('./v6.mjs');
      v6.ensureJSROOT();
      if (handle.prereq)
         await v6.require(handle.prereq);
      if (handle.script)
         await loadScript(handle.script);
      await v6.complete_loading();
      let func = findFunction(handle.func);

      if (!func || (typeof func != 'function'))
         throw Error(`Fail to find function ${handle.func} after loading ${handle.prereq || handle.script}`);

      handle.func = func;
   }

   return performDraw();
}

/** @summary Redraw object in specified HTML element with given draw options.
  * @param {string|object} dom - id of div element to draw or directly DOMElement
  * @param {object} obj - object to draw, object type should be registered before with {@link addDrawFunc}
  * @param {string} opt - draw options
  * @returns {Promise} with painter object
  * @requires painter
  * @desc If drawing was not done before, it will be performed with {@link draw}.
  * Otherwise drawing content will be updated */
function redraw(dom, obj, opt) {

   if (!obj || (typeof obj !== 'object'))
      return Promise.reject(Error('not an object in redraw'));

   let can_painter = getElementCanvPainter(dom), handle, res_painter = null, redraw_res;
   if (obj._typename)
      handle = getDrawHandle("ROOT." + obj._typename);
   if (handle && handle.draw_field && obj[handle.draw_field])
      obj = obj[handle.draw_field];

   if (can_painter) {
      if (can_painter.matchObjectType(obj._typename)) {
         redraw_res = can_painter.redrawObject(obj, opt);
         if (redraw_res) res_painter = can_painter;
      } else {
         for (let i = 0; i < can_painter.painters.length; ++i) {
            let painter = can_painter.painters[i];
            if (painter.matchObjectType(obj._typename)) {
               redraw_res = painter.redrawObject(obj, opt);
               if (redraw_res) {
                  res_painter = painter;
                  break;
               }
            }
         }
      }
   } else {
      let top = new BasePainter(dom).getTopPainter();
      // base painter do not have this method, if it there use it
      // it can be object painter here or can be specially introduce method to handling redraw!
      if (top && typeof top.redrawObject == 'function') {
         redraw_res = top.redrawObject(obj, opt);
         if (redraw_res) res_painter = top;
      }
   }

   if (res_painter) {
      if (!redraw_res || (typeof redraw_res != 'object') || !redraw_res.then)
         redraw_res = Promise.resolve(true);
      return redraw_res.then(() => res_painter);
   }

   cleanup(dom);

   return draw(dom, obj, opt);
}

/** @summary Scan streamer infos for derived classes
  * @desc Assign draw functions for such derived classes
  * @private */
function addStreamerInfosForPainter(lst) {
   if (!lst) return;

   function CheckBaseClasses(si, lvl) {
      if (!si.fElements) return null;
      if (lvl > 10) return null; // protect against recursion

      for (let j = 0; j < si.fElements.arr.length; ++j) {
         // extract streamer info for each class member
         let element = si.fElements.arr[j];
         if (element.fTypeName !== 'BASE') continue;

         let handle = getDrawHandle("ROOT." + element.fName);
         if (handle && !handle.for_derived) handle = null;

         // now try find that base class of base in the list
         if (handle === null)
            for (let k = 0; k < lst.arr.length; ++k)
               if (lst.arr[k].fName === element.fName) {
                  handle = CheckBaseClasses(lst.arr[k], lvl + 1);
                  break;
               }

         if (handle && handle.for_derived) return handle;
      }
      return null;
   }

   for (let n = 0; n < lst.arr.length; ++n) {
      let si = lst.arr[n];
      if (getDrawHandle("ROOT." + si.fName) !== null) continue;

      let handle = CheckBaseClasses(si, 0);

      if (!handle) continue;

      let newhandle = extend({}, handle);
      // delete newhandle.for_derived; // should we disable?
      newhandle.name = si.fName;
      addDrawFunc(newhandle);
   }
}


/** @summary Create SVG image for provided object.
  * @desc Function especially useful in Node.js environment to generate images for
  * supported ROOT classes
  * @param {object} args - contains different settings
  * @param {object} args.object - object for the drawing
  * @param {string} [args.option] - draw options
  * @param {number} [args.width = 1200] - image width
  * @param {number} [args.height = 800] - image height
  * @returns {Promise} with svg code */
function makeSVG(args) {

   if (!args) args = {};
   if (!args.object) return Promise.reject(Error("No object specified to generate SVG"));
   if (!args.width) args.width = 1200;
   if (!args.height) args.height = 800;

   function build(main) {

      main.attr("width", args.width).attr("height", args.height)
          .style("width", args.width + "px").style("height", args.height + "px");

      internals.svg_3ds = undefined;

      return draw(main.node(), args.object, args.option || "").then(() => {

         let has_workarounds = internals.svg_3ds && internals.processSvgWorkarounds;

         main.select('svg')
             .attr("xmlns", "http://www.w3.org/2000/svg")
             .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
             .attr("width", args.width)
             .attr("height", args.height)
             .attr("style", null).attr("class", null).attr("x", null).attr("y", null);

         function clear_element() {
            const elem = d3_select(this);
            if (elem.style('display')=="none") elem.remove();
         };

         // remove containers with display: none
         if (has_workarounds)
            main.selectAll('g.root_frame').each(clear_element);

         main.selectAll('svg').each(clear_element);

         let svg = main.html();

         if (has_workarounds)
            svg = internals.processSvgWorkarounds(svg);

         svg = compressSVG(svg);

         cleanup(main.node());

         main.remove();

         return svg;
      });
   }

   if (!isNodeJs())
      return build(d3_select('body').append("div").style("visible", "hidden"));

   return loadJSDOM().then(handle => build(handle.body.append('div')));
}


// only now one can draw primitives in the canvas
TPadPainter.prototype.drawObject = draw;
TPadPainter.prototype.getObjectDrawSettings = getDrawSettings;

// to avoid cross-dependnecy between io.mjs and draw.mjs
internals.addStreamerInfosForPainter = addStreamerInfosForPainter;


export { addDrawFunc, getDrawHandle, canDrawHandle, getDrawSettings, setDefaultDrawOpt, draw, redraw, cleanup, makeSVG };
