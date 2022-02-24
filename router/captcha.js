const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken')
const config = require('../config')
function captcha(Router) {
    const captchaLiveTime = config.captchaLiveTime
    const captchaCheckTime = config.captchaCheckTime
    const captchaSendTime = config.captchaSendTime
    const secret = config.secret

    function getClientIP(req) {
        return req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
            req.connection.remoteAddress || // 判断 connection 的远程 IP
            req.socket.remoteAddress || // 判断后端的 socket 的 IP
            req.connection.socket.remoteAddress;
    }

    const captchas = new Map()
    const ip2captcha = new Map()

    setInterval(() => {
        const now = new Date().getTime()
        for (let [k, v] of captchas) {
            if (now - v.time > captchaLiveTime) {
                captchas.delete(k)
                ip2captcha.delete(v.ip)
            }
        }
    }, captchaCheckTime)

    const ws = new Router()
    const capcha_api = new Router()
    capcha_api.post('/api/login', ctx => {
        const data  = ctx.request.body
        const token = data.token
        const captcha = data.captcha
        if (!token || !captcha) {
            ctx.body = {
                code: -1,
                msg: '缺少参数'
            }
            return
        }
        const captcha_info = captchas.get(token)
        if (!captcha_info) {
            ctx.body = {
                code: -1,
                msg: '验证码已过期'
            }
            return
        }
        if (captcha_info.captcha.toString() !== captcha.toString() || captcha_info.ip !== getClientIP(ctx.req)) {
            ctx.body = {
                code: -1,
                msg: '验证码错误'
            }
            return
        }
        const jwttoken = jwt.sign({ user_id: captcha_info.user_id, nickname: captcha_info.nickname }, secret, { expiresIn: '20 days' })
        ctx.body = {
            code: 0,
            msg: '验证成功',
            jwttoken,
            user_id: captcha_info.user_id,
            nickname: captcha_info.nickname
        }
    })
    let botsocket = null
    ws.all('/ws/bot', ctx => {
        botsocket = ctx.websocket
        ctx.websocket.on("message", msg => {
            const data = JSON.parse(msg)
            if (data.type === 'captcha') {
                if (captchas.has(data.id)) {
                    const info = captchas.get(data.id)
                    info.socket.send(JSON.stringify({
                        type: 'captcha',
                        code: data.code,
                        msg: data.msg,
                        nickname: data.nickname
                    }))
                    if (data.code) {
                        captchas.delete(data.id)
                        ip2captcha.delete(info.ip)
                    } else {
                        info.nickname = data.nickname
                        captchas.set(data.id, info)
                    }
                }
            }
        })
    })
    ws.all('/ws/web', ctx => {
        const ip = getClientIP(ctx.req)
        socket = ctx.websocket
        ctx.websocket.on("message", msg => {
            const data = JSON.parse(msg)
            if (data.type === 'captcha') {
                if (!botsocket) return ctx.websocket.send(JSON.stringify({
                    type: 'captcha',
                    code: -1,
                    msg: 'websocket 未连接, 可能是由于机器人未启动'
                }))
                if (!/^\d+$/.test(data.user_id)) return ctx.websocket.send(JSON.stringify({
                    type: 'captcha',
                    code: -1,
                    msg: 'user_id 必须为数字'
                }))
                if (ip2captcha.has(ip)) {
                    const v = ip2captcha.get(ip)
                    const now = new Date().getTime()
                    const last = captchas.get(v).time
                    if (now - last <= captchaSendTime) 
                        return ctx.websocket.send(JSON.stringify({
                            type: 'captcha',
                            code: -2,
                            time: parseInt(((captchaSendTime - now + last) / 1000).toFixed()),
                            msg: '请求过于频繁, 请等待 ' + ((captchaSendTime - now + last) / 1000).toFixed() + ' 秒后再试。',
                        }))
                }
                const token = uuidv4()
                const captcha = parseInt(Math.random().toString().substring(2, 7))
                captchas.set(token, {
                    user_id: data.user_id,
                    socket: ctx.websocket,
                    time: (new Date()).getTime(),
                    ip,
                    captcha
                })
                ip2captcha.set(ip, token)
                botsocket.send(JSON.stringify({
                    type: 'captcha',
                    user_id: parseInt(data.user_id),
                    captcha,
                    token
                }))
                ctx.websocket.send(JSON.stringify({
                    type: 'set_captcha_token',
                    token
                }))
            }
        })
    })
    return [ws.routes(), capcha_api.routes()]
}
module.exports = captcha
