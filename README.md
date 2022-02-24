# cntbot-web

[cntbot](https://github.com/YouXam/cntbot) 的 猜动漫功能网站。

## 配置

```javascript
// config.js 后端配置
module.exports = {
    port: 80, // 网站端口
    captchaLiveTime: 60 * 1000 * 5, // 验证码有效时间
    captchaCheckTime: 60 * 1000 * 1, // 验证码检测时间
    captchaSendTime: 100 * 1000, // 验证码发送间隔时间
    secret: 'jsonwebtoken', // jsonwebtoken 秘钥
    database: "mongodb://***", // mongodb url
    cos: { // 腾讯云对象存储配置
        bucket: "cos bucket", // cos bucket
        region: 'cos region', // cos region
        secretId: "cos secretId", // cos secretId
        secretKey: "cos secretKey", // cos secretKey
    },
    blur_api: "blur api", // 高斯模糊 api， 详见 https://github.com/YouXam/cntbot-services
    admin: { // 管理员账号
        213456789: true
    },
    cdn: { // cdn 配置
        enabled: true,
        domain: 'https://cdn.example.com/' // cdn 域名
    }
}
```

```typescript
// web/src/config.ts 前端配置
export default {
    apiurl: "http://网站域名/api", // 后端接口地址
    wsurl: "ws://网站域名/ws/web", // 后端 ws 地址
    bucket: "name-appid", // 腾讯云存储桶名
    region: "ap-area" // 腾讯云存储桶地区
}
```

## 运行

```sh
yarn build # 编译前端
yarn start # 运行后端
```
