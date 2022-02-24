import { createRouter, createWebHistory } from "vue-router";

const routes = [
    { path: "/", name: "Home", component: () => import("./views/Home.vue") },
    { path: "/login", name: "Login", component: () => import("./views/Login.vue") },
    { path: "/animeguess/add", name: "AnimeguessAdd", component: () => import("./views/Animeguess/Add.vue") },
    { path: "/animeguess/admin", name: "AnimeguessAdmin", component: () => import("./views/Animeguess/AnimeguessAdmin.vue") },
    { path: "/animeguess/:id", name: "AnimeguessEdit", component: () => import("./views/Animeguess/AnimeguessEdit.vue") },
    { path: "/animeguess", name: "Animeguess", component: () => import("./views/Animeguess/Animeguess.vue") },
    { path: "/:pathMatch(.*)", name: "NotFound", component: () => import("./views/NotFound.vue") }
];

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from) => {
    localStorage.setItem(from.fullPath, window.scrollY.toString())
    return true
})

export default router;
