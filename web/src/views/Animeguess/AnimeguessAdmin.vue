<template>
    <h1 style="text-align: center;">猜动漫 | 全站题目管理</h1>
    <h2 style="text-align: center;">
        <router-link to="/">首页</router-link> | 
        <span ><router-link to="/animeguess">我的题目</router-link> | </span>
        <router-link to="/animeguess/add?admin=true">添加题目</router-link>
    </h2>
    <h3 style="text-align: center;">
        全站共 {{ local.questions.length }} 个题目
    </h3>
    <hr />
    <div class="row" v-if="local.questions.length > 0">
        <div class="col-md-12">
            <table class="table table-striped" style="margin: 0px auto;">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>标题</th>
                        <th>出处</th>
                        <th>顺序</th>
                        <th>模式</th>
                        <th>答案</th>
                        <th>图片</th>
                        <th>出题人</th>
                        <th>难度</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(question, index) in local.questions" :key="question.id">
                        <td>{{ question._id.slice(question._id.length - 6) }}</td>
                        <td><router-link style="margin-right: 5px" :to="'/animeguess/' + question._id + '?admin=true'">{{ question.title }}</router-link></td>
                        <td>{{ question.from }}</td>
                        <td>{{ question.order === 'random' ? "随机" : '顺序' }}</td>
                        <td>{{ question.mode === 'blur' ? "高斯模糊" : '自定义'}}</td>
                        <td>{{ question.answers.join(', ').length < 20 ? question.answers.join(', ') : question.answers.join(', ').substring(0, 20) + '...'}}</td>
                        <td>
                            <template v-if="question.mode === 'blur'">
                                <a target="_blank" :href="question.url + '?' + Math.random()">原图</a> <a target="_blank" :href="question.blur_url + '?' + Math.random()">模糊图</a>
                            </template>
                            <template v-else>
                                <a target="_blank" :href="question.url2 + '?' + Math.random()">题目图</a> <a target="_blank" :href="question.url + '?' + Math.random()">答案图</a>
                            </template>
                        </td>
                        <td>{{ question.nickname || question.user_id }}</td>
                        <td>{{ question.cnt ? `${(question.succeed || 0)}/${question.cnt}:${(1 - (question.succeed || 0) / question.cnt).toFixed(2)}` : '空' }}</td>
                        <td>
                            <a href="#" @click="del(index)">删除</a>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    <p v-else-if="loading">正在加载...</p>
    <p v-else>暂无数据</p>
    <hr />
</template>

<script setup lang="ts">
import { ref, reactive, onUpdated } from 'vue'
import config from '../../config';
import { useRouter } from "vue-router"
const router = useRouter()
const token = localStorage.getItem('token')
const total = ref(0)
const loading = ref(false)
let local = reactive<any>({
    questions: []
})
let initing = 0
const iscrollY = localStorage.getItem(location.href.replace(location.origin, ''))
onUpdated(() => {
    const scrollY = initing <= 1 ? iscrollY : localStorage.getItem(location.href.replace(location.origin, ''))
    if (scrollY && scrollY.length > 0) {
        const mscrollY = parseInt(scrollY)
        window.scrollTo(0, mscrollY)
        if (initing == 1) initing = 2
    }
})
if (!token) {
    router.push('/login')
} else {
    (async function () {
        loading.value = true
        let thistotal = 99999999999
        let page = 1
        while (local.questions.length < thistotal) {
            const res = await fetch(config.apiurl + '/animeguess?admin=true&size=50&page=' + page, { headers: { 'Authorization': 'Bearer ' + token } })
            const data = await res.json()
            if (data.code && data.code !== -10) {
                router.push('/login')
                break
            }
            local.questions = local.questions.concat(data.questions)
            thistotal = data.thistotal
            total.value = data.total
            document.title = "全站题目管理 | CNTBOT"
            page += 1
        }
        loading.value = false
        initing = 1
    })()
}
async function del(id: number) {
    if (confirm("确认删除 " + local.questions[id].title + "?")) {
        const res = await fetch(config.apiurl + '/animeguess/' + local.questions[id]._id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token } 
        })
        const data = await res.json()
        if (data.code) {
            alert('删除失败：' + data.msg)
        } else {
            local.questions.splice(id, 1)
        }
    }
}
</script>

<style>
table {
    font-family: verdana, arial, sans-serif;
    color: #333333;
    border-width: 1px;
    border-color: #666666;
    border-collapse: collapse;
}
table th {
    border-width: 1px;
    padding: 8px;
    border-style: solid;
    border-color: #666666;
    background-color: #dedede;
}
table td {
    border-width: 1px;
    padding: 8px;
    border-style: solid;
    border-color: #666666;
    background-color: #ffffff;
    text-align: center;
}
</style>