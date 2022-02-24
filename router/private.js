const { MongoClient, ObjectId } = require('mongodb')
const config = require('../config')
const STS = require("qcloud-cos-sts")
const axios = require('axios')
const COS = require('cos-nodejs-sdk-v5');
const cos = new COS({
    SecretId: config.cos.secretId,
    SecretKey: config.cos.secretKey
});
async function private(Router) {
    const router = new Router();
    const client = new MongoClient(config.database)
    await client.connect()
    const db = client.db('cntbot')
    async function change(event, id) {
        const tag = await db.collection('anime_tag').findOne()
        if (tag) {
            tag[event].push(id)
            await db.collection('anime_tag').updateOne({ _id: tag._id }, { $set: tag })
        } else {
            const data = { tag: true, add: [], delete: [] }
            data[event].push(id)
            await db.collection('anime_tag').insertOne(data)
        }
    }
    function delete_file(key) {
        return new Promise((res, rej) => {
            cos.deleteObject({
                Bucket: config.cos.bucket,
                Region: config.cos.region,
                Key: key,
            }, function (err, data) {
                if (err) rej(err)
                res(data)
            });
        })
    }
    function rstrip(s, c) {
        let t = s.length
        while(t > 0 && s[t - 1] === c) t--
        return s.substring(0, t)
    }
    function ensureCdn(s) {
        return (config.cdn.enabled ? rstrip(config.cdn.domain, '/') : `https://${config.cos.bucket}.cos.${config.cos.region}.myqcloud.com`) + s
    }
    router.get('/api/info', ctx => {
        ctx.body = JSON.stringify({
            code: 0,
            user_id: ctx.user_id,
            nickname: ctx.nickname,
            admin: !!config.admin[ctx.user_id]
        })
    })
    router.get('/api/credential', async ctx => {
        const [shortBucketName, appId] = config.cos.bucket.split('-');
        const policy = {
            'version': '2.0',
            'statement': [{
                'action': [
                    'name/cos:PutObject',
                    'name/cos:PostObject',
                    "name/cos:DeleteObject"
                ],
                'effect': 'allow',
                'principal': { 'qcs': ['*'] },
                'resource': [
                    'qcs::cos:' + config.cos.region + ':uid/' + appId + ':prefix//' + appId + '/' + shortBucketName + '/' + ctx.user_id.toString() + '/*',
                ],
            }],
        };
        function getCredential() {
            return new Promise((res, rej) => {
                STS.getCredential({
                    secretId: config.cos.secretId,
                    secretKey: config.cos.secretKey,
                    durationSeconds: 20,
                    region: config.cos.region,
                    policy: policy,
                }, function (err, credential) {
                    if (err) rej(err)
                    res(credential)
                });
            })
        }
        try {
            const credential = await getCredential()
            ctx.body = {
                code: 0,
                user_id: ctx.user_id,
                credential
            }
        } catch (err) {
            ctx.body = {
                code: -1,
                msg: err.toString()
            }
        }
    })
    router.get('/api/animeguess', async ctx => {
        const total = await db.collection('anime').countDocuments()
        const query = ((ctx.query.admin && config.admin[ctx.user_id]) ? {} : { user_id: ctx.user_id })
        const thistotal = await db.collection('anime').countDocuments(query)
        const size = ctx.query.size || 50
        const page = ctx.query.page || 1
        const res = await db.collection('anime').find(query).skip((parseInt(page) - 1) * parseInt(size)).limit(parseInt(size))
            .project({ 
                title: 1,
                answers: 1,
                mode: 1,
                url: 1,
                url2: 1,
                _id: 1,
                order: 1, 
                blur_url: 1,
                user_id: 1,
                nickname: 1,
                cnt: 1,
                succeed: 1,
                from: 1
            }).toArray()
        ctx.body = {
            code: 0,
            user_id: ctx.user_id,
            nickname: ctx.nickname,
            questions: res,
            total,
            thistotal
        }
    })
    router.post('/api/animeguess/add', async ctx => {
        const data = ctx.request.body
        data.user_id = ctx.user_id
        try {
            if (data.mode === 'blur') {
                const blur_res = await axios(config.blur_api, {
                    method: 'POST',
                    data: {
                        url: data.url,
                        blur: data.blur
                    }
                })
                if (blur_res.data.code) throw new Error(blur_res.data.msg)
                data.blur_key = blur_res.data.key
                data.blur_url = ensureCdn(data.blur_key)
            } else data.url2 = ensureCdn(data.key2)
            data.url = ensureCdn(data.key)
            const res = await db.collection('anime').insertOne(data)
            await change('add', res.insertedId)
            ctx.body = {
                code: 0,
                res
            }
        } catch (e) {
            ctx.body = {
                code: -1,
                msg: e.toString()
            }
        }
    })
    router.get('/api/animeguess/:id', async ctx => {
        const id = ObjectId(ctx.params.id)
        const res = await db.collection('anime').findOne({ _id: id })
        if (!res || (res.user_id !== ctx.user_id && !config.admin[ctx.user_id])) return ctx.body = {
            code: -1,
            msg: '未找到此题目'
        }
        ctx.body = {
            code: 0,
            data: res
        }
    })
    router.delete('/api/animeguess/:id', async ctx => {
        const id = ObjectId(ctx.params.id)
        try {
            const res = await db.collection('anime').findOne({ _id: id })
            if (!res || (res.user_id !== ctx.user_id && !config.admin[ctx.user_id])) throw new Error('未找到此题目')
            await delete_file(res.key)
            if (res.mode === 'blur') await delete_file(res.blur_key)
            else await delete_file(res.key2)
            await db.collection('anime').deleteOne({ _id: id })
            await change('delete', id)
            ctx.body = { code: 0 }
        } catch (e) {
            ctx.body = {
                code: -1,
                msg: e.toString()
            }
        }
    })
    router.put('/api/animeguess/:id', async ctx => {
        const id = ObjectId(ctx.params.id)
        const data = ctx.request.body
        try {
            const res = await db.collection('anime').findOne({ _id: id })
            if (!res) throw new Error('未找到此题目')
            if (res.user_id !== ctx.user_id && !config.admin[ctx.user_id]) throw new Error('未找到此题目')
            if (res.key !== data.key) await delete_file(res.key)
            if (res.mode === 'blur') {
                if (res.key !== data.key || res.blur !== data.blur) {
                    await delete_file(res.blur_key)
                    const blur_res = await axios(config.blur_api, {
                        method: 'POST',
                        data: {
                            url: data.url,
                            blur: data.blur
                        }
                    })
                    if (blur_res.data.code) throw new Error(blur_res.data.msg)
                    data.blur_url = blur_res.data.url
                    data.blur_key = blur_res.data.key
                }
            } else if (res.key2 !== data.key2) await delete_file(res.key2)
            await db.collection('anime').updateOne({ _id: id }, { $set: data })
            ctx.body = { code: 0 }
        } catch (e) {
            ctx.body = {
                code: -1,
                msg: e.toString()
            }
        }
    })
    return router.routes()
}
module.exports = private
