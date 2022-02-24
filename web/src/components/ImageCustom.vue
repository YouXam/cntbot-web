<template>
    <div>
        <label>{{ props.label }} {{ upload_state.length > 0 ? '(' + upload_state + ')' : '' }}</label>
        <input
            type="file"
            @change="upload($event)"
            accept="image/jpeg, image/png, image/gif"
        />
        <img
            :src="url"
            v-if="key"
            style="max-width: 100%; width: 500px;"
        />
        <label>{{ props.label2 }} {{ upload_state2.length > 0 ? '(' + upload_state2 + ')' : '' }}</label>
        <input
            type="file"
            @change="upload2($event)"
            accept="image/jpeg, image/png, image/gif"
        />
        <img
            :src="url2"
            v-if="key2"
            style="max-width: 100%; width: 500px;"
        />
    </div>
</template>
<script setup lang="ts">
import { defineProps, reactive, defineEmits, ref, computed, watch } from "vue"
import config from "../config"
import COS from "cos-js-sdk-v5"
import { useRouter } from 'vue-router'
const router = useRouter()

const props = defineProps(['label', 'label2', 'url', 'url2', 'Key', 'Key2'])
const emits = defineEmits(['update:url', 'update:url2', 'update:Key', 'update:Key2'])
let url = ref('')
let url2 = ref('')
let user_id = 0
let upload_state = ref('')
let upload_state2 = ref('')
let key = ref<any>(null)
let key2 = ref<any>(null)

watch(props, (nv, ov) => {
    url.value = nv.url
    url2.value = nv.url2
    key.value = nv.Key
    key2.value = nv.Key2
})

const token = localStorage.getItem('token')
if (!token) {
    router.push('/login')
} else {
    (async function () {
        const res = await fetch(config.apiurl + '/info', { headers: { 'Authorization': 'Bearer ' + token } })
        const data = await res.json()
        if (data.code) {
            router.push('/login')
        } else {
            user_id = data.user_id
        }
    })()
}
const cos = new COS({
    getAuthorization: async function (options, callback) {
        const res = await fetch(config.apiurl + '/credential', { headers: { 'Authorization': 'Bearer ' + token } })
        const data = await res.json()
        if (!data.code) {
            console.log('cos 初始化成功')
            callback({
                TmpSecretId: data.credential.credentials.tmpSecretId,
                TmpSecretKey: data.credential.credentials.tmpSecretKey,
                SecurityToken: data.credential.credentials.sessionToken,
                StartTime: data.credential.startTime,
                ExpiredTime: data.credential.expiredTime,
            });
        } else console.log('cos 初始化错误: ', data)
    }
});
function upload_file(file: File, filename: string) {
    return new Promise((res, rej) => {
        cos.putObject({
            Bucket: config.bucket,
            Region: config.region,
            Key: `/${user_id}/${filename}`,
            StorageClass: 'STANDARD',
            Body: file
        }, function (err, data) {
            if (err) rej(err)
            res(data)
            console.log('Uploaded file: ', err || data);
        });
    })
}
function delete_file(key: string) {
    cos.deleteObject({
        Bucket: config.bucket,
        Region: config.region,
        Key: key,
    }, function (err, data) {
        console.log('Deleted file: ', err || data);
    });
}
async function upload(e: any) {
    const filelist = e.target.files
    if (filelist.length == 0) return
    if (key.value && key.value.length > 0) {
        upload_state.value = '删除旧图片...'
        await delete_file(key.value)
        upload_state.value = '删除完成'
    }
    const file = filelist[0] as File
    const ext = file.name.split('.')[file.name.split('.').length - 1]
    const filename = (Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + '.' + ext)
    upload_state.value = '上传中...'
    const res: COS.PutObjectResult = (await upload_file(file, filename)) as COS.PutObjectResult
    url.value = 'https://' + decodeURI(res.Location)
    key.value = `/${user_id}/${filename}`
    upload_state.value = '上传完成'
    emits('update:url', url.value)
    emits('update:Key', key.value)
}
async function upload2(e: any) {
    const filelist = e.target.files
    if (filelist.length == 0) return
    if (key2.value && key2.value.length > 0) {
        upload_state2.value = '删除旧图片...'
        await delete_file(key2.value)
        upload_state2.value = '删除完成'
    }
    const file = filelist[0] as File
    const ext = file.name.split('.')[file.name.split('.').length - 1]
    const filename = (Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + '_custom.' + ext)
    upload_state2.value = '上传中...'
    const res: COS.PutObjectResult = (await upload_file(file, filename)) as COS.PutObjectResult
    url2.value = 'https://' + decodeURI(res.Location)
    key2.value = `/${user_id}/${filename}`
    upload_state2.value = '上传完成'
    emits('update:url2', url2.value)
    emits('update:Key2', key2.value)
}
</script>

<style>
input, select, button {
    display: block;
    width: 100%;
    max-width: 500px;
    padding: 10px;
    box-sizing: border-box;
    font-size: 18px;
    margin-bottom: 4px;
}
img:hover, img:focus, img:active {
    filter: blur(0px) !important;
}
div.label {
    display: block;
    margin: 10px 0px;
    font-size: 20px;
    font-weight: 500;
}
</style>