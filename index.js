const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');
const static = require('koa-static')
const websocket = require('koa-websocket');
const app = websocket(new Koa());
const jwt = require('jsonwebtoken')
const config = require("./config")
const port = config.port
const fsp = require("fs/promises")
app.use(bodyParser())
// app.use(static("./web/build"))

// 验证码交互
const [captcha_ws_routes, captcha_routes] = require('./router/captcha.js')(Router)
app.use(async (ctx, next) => {
    try {
        await next()
    } catch (err) {
        ctx.body = {
            code: -10,
            msg: err.toString()
        }
    }
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.set('Access-Control-Allow-Headers', 'content-type,authorization')
    ctx.set('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS,PUT')
})
app.ws.use(captcha_ws_routes)
app.use(captcha_routes)
app.use(async (ctx, next) => {
    if (!ctx.path.startsWith('/api')) {
        if (ctx.path.endsWith('.js')) {
            try {
                const data = await fsp.readFile(`./web/dist${ctx.path}`)
                ctx.set('Content-Type', 'application/javascript')
                ctx.body = data
            } catch {
                ctx.status = 404
                ctx.body = '404'
            }
        } else if (ctx.path.endsWith('.css')) {
            try {
                const data = await fsp.readFile(`./web/dist${ctx.path}`)
                ctx.set('Content-Type', 'text/css')
                ctx.body = data
            } catch {
                ctx.status = 404
                ctx.body = '404'
            }
        } else if (ctx.path.endsWith('.png')) {
            try {
                const data = await fsp.readFile(`./web/dist${ctx.path}`)
                ctx.set('Content-Type', 'image.png')
                ctx.body = data
            } catch {
                ctx.status = 404
                ctx.body = '404'
            }
        } else {
            const data = await fsp.readFile('./web/dist/index.html')
            ctx.set('Content-Type', 'text/html')
            ctx.body = data
        }
    } else await next()
})
app.use(async (ctx, next) => {
    const token = ctx.headers.authorization
    if (!token) return ctx.body = { code: -1, msg: '缺少token' }
    try {
        const payload = jwt.verify(token.split(' ')[1], config.secret)
        ctx.user_id = parseInt(payload.user_id)
        ctx.nickname = payload.nickname
        await next()
    } catch (e) {
        if (e.name === 'JsonWebTokenError') ctx.body = { code: -1, msg: '认证错误: ' + e.toString() }
        else throw e
    }
})
const get_private_routes = require('./router/private.js')
get_private_routes(Router).then(private_routes => {
    app.use(private_routes)
    app.listen(port, () => {
        console.log(`Listening on port ${port}.`)
    })
})
