<template>
    <div style="max-width: 300px; margin: auto">
        <h1 style="text-align: center;">登录<span v-if="nickname.length > 0">:{{ nickname }}</span></h1>
        <p v-if="errMsg.length > 0" style="color: red">{{ errMsg }}</p>
        <template v-if="step === 'send'">
            <p>请确保添加机器人 (QQ: 2725005108) 为好友，然后点击“发送验证码”，并在 QQ 私聊中查看验证码。</p>
            <p>请输入 QQ 号：</p>
            <input type="text" class="input" v-model="user_id" @keyup.enter="sendCaptcha"/>
            <button class="input" @click="sendCaptcha" :disabled="captcha.disabled">发送验证码</button>
        </template>
        <template v-else>
            <p>{{ captcha.msg }}</p>
            <p>请输入验证码：</p>
            <input type="text" class="input" v-model="captcha_value" @keyup.enter="login"/>
            <button class="input" @click="login">登录</button>
        </template>

    </div>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import config from '../config'
import { useRouter } from "vue-router"
document.title = "登录 | CNTBOT"
const router = useRouter()
let captcha_token = ''
let user_id = ref('')
let captcha: any = reactive({ finished: false, disabled: false, countdown: -1, time: 100 })
let captcha_value = ref('')
let step = ref('send')
let errMsg = ref('')
let nickname = ref('')
let socket: WebSocket = new WebSocket(config.wsurl)
socket.onerror = (e) => {
    console.log(e)
    if (confirm('与服务器断开链接， 是否刷新？')) location.href = location.href 
}
socket.onmessage = e => {
    const data = JSON.parse(e.data)
    if (data.type === 'set_captcha_token') {
        captcha_token = data.token
    } else if (data.type === 'captcha') {
        if (data.code) errMsg.value = data.msg
        else step.value = 'next', errMsg.value = ''
        if (data.nickname) {
            nickname.value = data.nickname
        }
        if (data.code === -2) {
            captcha.disabled = true
            captcha.time = data.time
            captcha.countdown = setInterval(() => {
                errMsg.value = '请求过于频繁, 请等待 ' + (--captcha.time) + ' 秒后再试。'
                if (captcha.time <= 0) {
                    clearInterval(captcha.countdown)
                    captcha.finished = false
                    captcha.disabled = false
                    captcha.time = 100
                    errMsg.value = ''
                }
            }, 1000)
        }
    }
}
async function login() {
    if (captcha_value.value.length === 0) {
        alert('请输入验证码')
        return
    }
    if (!/^\d+$/.test(captcha_value.value)) {
        alert('验证码格式错误')
        return
    }
    const res = await fetch(config.apiurl + '/login', {
        method: 'POST',
        headers: {
            "content-type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
            captcha: captcha_value.value,
            token: captcha_token
        })
    })
    const data = await res.json()
    if (data.code) {
        errMsg.value = data.msg
    } else {
        localStorage.setItem('token', data.jwttoken)
        localStorage.setItem('user_id', user_id.value)
        localStorage.setItem('nickname', nickname.value)
        router.push('/')
    }
}
function sendCaptcha() {
    if (user_id.value.length === 0) {
        alert('请输入 QQ 号')
        return
    }
    if (!/^\d+$/.test(user_id.value)) {
        alert('请输入正确的 QQ 号')
        return
    }
    socket.send(JSON.stringify({
        type: 'captcha',
        user_id: user_id.value
    }))
}
</script>

<style>
.input {
    display: block;
    width: 100%;
    padding: 10px;
    box-sizing: border-box;
    font-size: 18px;
    margin-bottom: 4px;
}
</style>