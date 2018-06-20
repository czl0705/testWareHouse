<template>
    <div>
        <div v-if="showPage">
            <!-- 头部 -->
            <header-top></header-top>
            <!-- /头部 -->

            <!-- 侧边菜单 -->
            <side-menu></side-menu>
            <!-- /侧边菜单 -->

            <main class="container">

                <router-view></router-view>

            </main>
        </div>
        <div class="mask" v-if="!showPage">
            <i class="icon-loading"></i>
        </div>
    </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import headerTop from "../../components/header";
import sideMenu from "../../components/sideMenu";
import { getUserInfo } from "../../service/index";
export default {
    data() {
        return {
            showPage: false
        };
    },
    mounted() {
        getUserInfo()
            .then((res) => {
                let datas = res.data || JSON.parse(res.request.responseText);
                if (!datas.errorcode) {
                    this.SET_USER_INFO(datas.data);
                    this.showPage = true;
                } else {
                    this.$message({
                        message: datas.msg,
                        type: "warning",
                        duration: "1000",
                        onClose: () => {
                            this.$router.push({
                                path: "/login"
                            });
                        }
                    });
                }
            })
            .catch((err) => {
                console.log(err);
            });
    },
    components: {
        headerTop,
        sideMenu
    },
    computed: {
        ...mapState(["userInfo"])
    },
    methods: {
        ...mapMutations(["SET_USER_INFO"])
    }
};
</script>

<style lang="scss">
.page-wrap,
.main-wrap {
    height: 100%;
}
.mask {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: #181b22;
    .icon-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 45px;
        height: 45px;
        margin: -23px;
        background: url("../../assets/images/loading.png");
        animation: rotating 1s linear infinite;
    }
}
</style>