const Koa = require('koa');
const serve = require('koa-static-plus');
const koaBody = require('koa-body');
const helmet = require("koa-helmet");
const session = require('koa-session');
const favicon = require('koa-favicon');
const path = require('path');
const _ = require('lodash');
const requireJS = require('nobita-require');
const init = require('nobita-init');
const Router = require('nobita-router');
const Controllers = require('nobita-controllers');
const myRouter = requireJS('./app/router.js');
const nobitaHelper = require('nobita-helper');
const service = require('nobita-service');
const curl = require('nobita-curl');
const xss = require('nobita-xss');
const catchError = require('nobita-catch');

class Nobita extends Koa {
  constructor() {
    super();
    require('nobita-config')(this);
    this.context = this._context;
    require('nobita-nunjucks')(this);
    require('nobita-logger')(this);
    require('nobita-mongo')(this);
    require('nobita-mysql')(this);
    require('nobita-session-redis')(this);
    require('nobita-schedule')(this);
    const compose = require('nobita-middleware')(this);
    myRouter && myRouter(this);

    /** 静态资源路径 */
    if (this.config.static && this.config.static.path) {
      const main = serve(this.config.static.path, this.config.static);
      this.use(main);
    }

    const server = this.listen(this.config.listen.port, this.config.listen.callback);
    if (this.config.socket) {
      const WebSocket = require('ws');
      this.wss = new WebSocket.Server({ server });
    }

    this
      .use(favicon(path.join(__dirname, './favicon.ico')))
      .use(catchError)
      .use(session(this.config.session, this))
      .use(helmet())
      .use(koaBody(this.config.koaBody))
      .use(xss)
      .use(init)
      .use(nobitaHelper)
      .use(service)
      .use(compose)
      .use(Router.routes());
    console.log(`env:${this.config.env}`);
  };

  get controllers() {
    return Controllers;
  };

  get router() {
    return Router;
  };

  get _context() {
    let _context = requireJS('./app/extend/context.js') || {};
    _context.helper = requireJS('./app/extend/helper.js');
    _context.cache = require('nobita-cache')(this.config.cache);
    this.curl = _context.curl = curl;
    _context.app = this;

    return _.merge(this.context, _context);
  }
 
}

module.exports = Nobita;