<template>
    <h1 style="text-align: center;">CNTBOT 管理</h1>
    <h2 style="text-align: center;">当前账号：{{ nickname }}({{ user_id }}) <a href="#" @click="logout">退出登录</a></h2>
    <hr/>
    <router-link to="/animeguess">猜动漫 | 题目管理</router-link>
</template>

<script setup lang="ts">
import { login } from '../lib'
import { useRouter } from "vue-router"
document.title = "首页 | CNTBOT"
const router = useRouter()
const token = login()
const nickname = localStorage.getItem('nickname')
const user_id = localStorage.getItem('user_id')
function logout() {
    if (confirm('是否退出登录？')) {
        localStorage.clear()
        router.push('/login')
    }
}
</script>