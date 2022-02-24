<template>
    <h1 style="text-align: center;">猜动漫 | 题目添加</h1>
    <h2 style="text-align: center;"><router-link :to="'/animeguess' + (route.query.admin ? '/admin' : '')">题目管理</router-link></h2>
    <hr style="margin: 20px 0px">
    <div style="max-width: 500px; margin: 0px auto;">
        <label for="title">标题</label>
        <input type="text" id="title" placeholder="仅您可见，用于助记" v-model="question.data.title">
        <label for="mode">图片模式</label>
        <select id="mode" v-model="question.data.mode">
            <option value="blur">高斯模糊</option>
            <option value="custom">自定义</option>
        </select>
        <Image v-show='question.data.mode === "blur"' label="图片" v-model:url="question.data.url" v-model:blur='question.data.blur' v-model:Key='question.data.key' />
        <ImageCustom v-show='question.data.mode === "custom"' label="题目图"  label2="答案图" v-model:url="question.data.url2" v-model:url2="question.data.url" v-model:Key='question.data.key2' v-model:Key2='question.data.key'/>
        <label for="from">人物出处</label>
        <input type="text" id="from" placeholder="动漫/游戏名称，系列/分集等" v-model="question.data.from">
        <label for="order">提示出现顺序</label>
        <select id="order" v-model="question.data.order">
            <option value="random">随机</option>
            <option value="order">顺序</option>
        </select>
        <List label="提示" v-model:list="question.data.tips"/>
        <List label="答案（任一匹配即可，忽略同音错别字）" v-model:list="question.data.answers"/>
        <hr style="width: 100%; max-width: 500px; margin: 20px 0px" align="left"/>
        <button @click="submit" :disabled="submitting">{{ submitting ? '提交中...' : '提交' }}</button>
    </div>
</template> 

<script setup lang="ts">
import List from "../../components/List.vue"
import Image from "../../components/Image.vue"
import ImageCustom from "../../components/ImageCustom.vue"
import { reactive, ref } from "vue";
import config from '../../config';
import { login } from '../../lib';
import { useRoute, useRouter } from 'vue-router';
const token = login();
const router = useRouter()
const route = useRoute()
const id = route.params.id;
let question = reactive<{ data: any }>({
    data: {}
});
(async function() {
    const question_res = await fetch(config.apiurl + '/animeguess/' + id, { headers: { 'Authorization': 'Bearer ' + token } });
    const question_data = (await question_res.json());
    if (question_data.code) {
        router.push('/404');
    } else {
        question.data = question_data.data
        document.title = question.data.title + ' | CNTBOT'
    }
})();
const submitting = ref(false)
function submit() {
    if (!question.data.title || !question.data.from || !question.data.tips.length || !question.data.answers.length) return alert("请填写完整")
    if (question.data.mode === 'blur') {
        if (!question.data.url || !question.data.key || !question.data.blur) return alert("请填写完整")
    } else if (!question.data.url || !question.data.key || !question.data.url2 || !question.data.key2) return alert("请填写完整")
    const res: any = {
        title: question.data.title,
        from: question.data.from,
        order: question.data.order,
        tips: question.data.tips,
        answers: question.data.answers,
        mode: question.data.mode,
    }
    if (question.data.mode === 'blur') {
        res.url = question.data.url
        res.blur = question.data.blur
        res.key = question.data.key
    } else {
        res.url = question.data.url
        res.url2 = question.data.url2
        res.key = question.data.key
        res.key2 = question.data.key2
    }
    submitting.value = true
    fetch(config.apiurl + "/animeguess/" + id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(res)
    }).then(data => data.json()).then(data => {
        if (!data.code) {
            router.push("/animeguess" + (route.query.admin ? "/admin" : ""))
        } else {
            alert("更新失败：" + data.msg + '，请稍后重试。')
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
