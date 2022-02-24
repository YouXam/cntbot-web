<template>
    <div>
        <label>{{ props.label }} {{ upload_state.length > 0 ? '(' + upload_state + ')' : '' }}</label>
        <input
            type="file"
            id="file"
            @change="upload($event)"
            accept="image/jpeg, image/png, image/gif"
        />
        <img
            :src="url"
            v-if="Key"
            style="max-width: 100%; width: 500px;"
            :style='{ "filter" : `blur(${check ? blur : 0}px)`}'
            ref="img"
        />
        <div v-if="url && url.length > 0">
            <div class="label">
                高斯模糊
                <input style="display: inline; width: 100px" type="text" v-model="realBlur" /> px
            </div>
            <div class="label">
                预览
                <input type="checkbox" style="display: inline; width: 20px" id="check" v-model="check"/>
            </div>
            <input v-if="url && url.length > 0" type="range" max="50" v-model="blur" step="0.1" id="blur" />
        </div>
    </div>
</template>
<script setup lang="ts">
import { defineProps, reactive, defineEmits, ref, computed, watch } from "vue"
import config from "../config"
import COS from "cos-js-sdk-v5"
import { useRouter } from 'vue-router'
const router = useRouter()

const props = defineProps(['label', 'url', 'blur', 'Key'])
const emits = defineEmits(['update:url', 'update:blur', 'update:Key'])
let url = ref(props.url || '')
let blur = ref(props.blur || 0)
const img = ref<any>(null)
const check = ref(true)
let user_id = 0
let upload_state = ref('')
let Key = ref<any>(props.Key || '')
let flag = true

const realBlur = computed({
    get() {
        if (img.value) {
            const r = parseFloat((img.value.naturalWidth * blur.value / img.value.width).toFixed(2))
            emits('update:blur', r)
            return r.toString()
        }
        return '0'
    },
    set(v: string) {
        if (img.value && img.value.naturalWidth && img.value.width) {
            blur.value = v ? parseFloat(v) * img.value.width / img.value.naturalWidth : 0
            emits('update:blur', parseFloat(v))
        } else {
            watch(img, () => {
                if (img.value && img.value.naturalWidth && img.value.width) {
                    blur.value = v ? parseFloat(v) * img.value.width / img.value.naturalWidth : 0
                } else {
                    const tid = setInterval(() => {
                        if (img.value && img.value.naturalWidth && img.value.width) {
                            blur.value = v ? parseFloat(v) * img.value.width / img.value.naturalWidth : 0
                            clearInterval(tid)
                        }
                    }, 100)
                }
            })
        }
    }
})

watch(props, (nv, ov) => {
    if (flag) {
        flag = false
        url.value = nv.url
        realBlur.value = nv.blur
        Key.value = nv.Key
    }
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
    if (Key.value && Key.value.length > 0) {
        upload_state.value = '删除旧图片...'
        await delete_file(Key.value)
        upload_state.value = '删除完成'
    }
    const file = filelist[0] as File
    const ext = file.name.split('.')[file.name.split('.').length - 1]
    const filename = (Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) + '.' + ext)
    upload_state.value = '上传中...'
    const res: COS.PutObjectResult = (await upload_file(file, filename)) as COS.PutObjectResult
    url.value = 'https://' + decodeURI(res.Location)
    Key.value = `/${user_id}/${filename}`
    upload_state.value = '上传完成'
    emits('update:url', url.value)
    emits('update:Key', Key.value)
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