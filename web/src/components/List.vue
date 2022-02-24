<template>
    <label>{{ props.label }}</label>
    <div style="padding-left: 20px">
        <template v-for="e, id in list.data">
            <input class="item" type="text" :placeholder="'第 ' + (id + 1) + ' 条'" @keyup="change(id)" v-model="list.data[id]">
        </template>
    </div>
</template>

<script setup lang="ts">
import { defineProps, reactive, defineEmits, watch } from "vue"
const props = defineProps(['label', 'list'])
const emits = defineEmits(['update:list'])
const list = reactive<{ data: any}>({
    data: [""]
})
watch(props, nv => {
    if (!nv.list) return
    const cp = [...nv.list, ""]
    list.data = cp
})
function change(id: number) {
    list.data[id] = list.data[id].trim()
    if (id === list.data.length - 1 && list.data[id] !== "") {
        list.data.push("")
    }
    if (list.data[id] === '' && id !== list.data.length - 1) {
        list.data.splice(id, 1)
    }
    const res = list.data.slice(0, list.data.length - 1)
    emits('update:list', res)
}
</script>

<style>
.item {
    display: block;
    width: calc(100% - 20px);
    max-width: 480px;
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