import config from "../config"
import { useRouter } from "vue-router"
export function login() {
    const router = useRouter()
    const token = localStorage.getItem('token')
    if (!token) {
        router.push('/login')
    } else {
        (async function(){
            const res = await fetch(config.apiurl + '/info', { headers: { 'Authorization': 'Bearer ' + token } })
            const data = await res.json()
            console.log(data)
            localStorage.setItem('user_id', data.user_id)
            localStorage.setItem('nickname', data.nickname)
            localStorage.setItem('admin', data.admin)
            if (data.code) {
                router.push('/login')
            }
        })()
    }
    return token
}

