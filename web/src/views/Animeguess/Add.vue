<template>
    <h1 style="text-align: center;">猜动漫 | 题目添加</h1>
    <h2 style="text-align: center;"><router-link :to="'/animeguess' + (route.query.admin ? '/admin' : '')">题目管理</router-link></h2>
    <hr style="margin: 20px 0px">
    <div style="max-width: 500px; margin: 0px auto;">
        <label for="title">标题</label>
        <input type="text" id="title" placeholder="仅您可见，用于助记" v-model="title">
        <label for="mode">图片模式</label>
        <select id="mode" v-model="mode">
            <option value="blur">高斯模糊</option>
            <option value="custom">自定义</option>
        </select>
        <Image label="图片" v-model:url="url" v-model:blur='blur' v-model:Key='key' v-show="mode == 'blur'"/>
        <ImageCustom label="题目图"  label2="答案图" v-model:url="url2" v-model:url2="url" v-model:Key='key2' v-model:Key2='key' v-show="mode == 'custom'"/>
        <label for="from">人物出处</label>
        <input type="text" id="from" placeholder="动漫/游戏名称，系列/分集等" v-model="from">
        <label for="order">提示出现顺序</label>
        <select id="order" v-model="order">
            <option value="random">随机</option>
            <option value="order">顺序</option>
        </select>
        <List label="提示" v-model:list="tips.data"/>
        <List label="答案（任一匹配即可，忽略同音错别字）" v-model:list="answers.data"/>
        <hr style="width: 100%; max-width: 500px; margin: 20px 0px" align="left"/>
        <button @click="submit" :disabled="submitting">{{ submitting ? '提交中...' : '提交' }}</button>
    </div>
</template> 

<script setup lang="ts">
import List from "../../components/List.vue"
import Image from "../../components/Image.vue"
import ImageCustom from "../../components/ImageCustom.vue"
import { reactive, ref } from "vue";
import config from '../../config'
import { login } from '../../lib'
import { useRouter, useRoute } from "vue-router"
document.title = "添加题目 | CNTBOT"
const router = useRouter()
const route = useRoute()
const title = ref("")
const from = ref("")
const order = ref("order")
const url = ref("")
const url2 = ref("")
const key = ref("")
const key2 = ref("")
const blur = ref(0)
const tips = reactive({ data: [] })
const answers = reactive({ data: [] })
const token = login()
const mode = ref('blur')
const submitting = ref(false)
const nickname = localStorage.getItem('nickname')
function submit() {
    if (!title.value || !from.value || !tips.data.length || !answers.data.length) return alert("请填写完整")
    if (mode.value === 'blur') {
        if (!url.value || !key.value || !blur.value) return alert("请填写完整")
    } else if (!url.value || !key.value || !url2.value || !key2.value) return alert("请填写完整")
    const res: any = {
        title: title.value,
        from: from.value,
        order: order.value,
        tips: tips.data,
        answers: answers.data,
        mode: mode.value,
        nickname
    }
    if (res.mode === 'blur') {
        res.url = url.value
        res.blur = blur.value
        res.key = key.value
    } else {
        res.url = url.value
        res.url2 = url2.value
        res.key = key.value
        res.key2 = key2.value
    }
    submitting.value = true
    fetch(config.apiurl + "/animeguess/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(res)
    }).then(data => data.json()).then(data => {
        if (!data.code) {
            router.push("/animeguess" + (route.query.admin ? "/admin" : ""))
        } else {
            alert("添加失败：" + data.msg + '，请稍后重试。')
        }
    }).finally(() => {
        submitting.value = false
    })
}
</script>

<style scoped>
input, select, button {
    display: block;
    width: 100%;
    max-width: 500px;
    padding: 10px;
    box-sizing: border-box;
    font-size: 18px;
    margin-bottom: 4px;
}
label {
    display: block;
    margin: 10px 0px;
    font-size: 20px;
    font-weight: 500;
}
</style>
