<script>
import lowerFirst from 'lodash/lowerFirst'
import camelCase from 'lodash/camelCase'
import find from 'lodash/find'
import isEqual from 'lodash/isEqual'
import Settings from '@/components/widgets/Settings.vue'

const widgetsComponents = require.context(
  '@/widgets',
  false,
  /.vue$/,
)

const widgetsConfig = 'widgets_config'

export default {
  name: 'SideBar',
  components: {
    Settings,
  },
  data() {
    return {
      isLoading: true,
      comps: [],
      apps: [],
      widgetsSettings: [],
    }
  },
  computed: {
    activeApps() {
      const showWidgets = this.widgetsSettings.filter((item) => {
        return item.show
      })
      const newArray = showWidgets.map((item) => {
        const obj = find(this.apps, (o) => {
          return o.app.name === item.name
        })
        return obj
      })
      return newArray
    },
    sidebarOpen() {
      return this.$store.state.sidebarOpen
    },
    showWidgets() {
      return this.widgetsSettings.filter((item) => {
        return item.show
      })
    },
  },
  created() {
    widgetsComponents.keys().forEach((fileName) => {
      const componentName = lowerFirst(
        camelCase(
          fileName
            .split('/')
            .pop()
            .replace(/\.\w+$/, ''),
        ),
      )
      this.comps.push(componentName)
      this.apps.push({ app: require(`@/widgets/${fileName.replace('./', '')}`).default })
    })
  },
  mounted() {
    this.getConfig()

  },

  methods: {
    /**
     * @description: Get Widgets Configs
     * @return {*} void
     */
    getConfig() {
      const initData = this.getInitData()
      this.$api.users.getCustomStorage(widgetsConfig).then((res) => {
        if (res.status === 200) {
          if (res.data === '') {
            this.saveData(initData)
            this.widgetsSettings = initData
            this.isLoading = false
          }
          else {
            this.diffAndCombineData(initData, res.data.data)
          }
        }
      })
    },
    diffAndCombineData(initData, remoteData) {
      const newData = initData.map((item) => {
        const remoteItem = find(remoteData, el => el.name === item.name)
        if (remoteItem && item.name === remoteItem.name) {
          return {
            name: item.name,
            show: (item.show === remoteItem.show) ? item.show : remoteItem.show,
          }
        }
        else {
          return {
            name: item.name,
            show: item.show,
          }
        }
      })
      this.widgetsSettings = newData
      if (!isEqual(newData, remoteData)) {
        this.saveData(newData)
      }
      this.isLoading = false
    },
    /**
     * @description: Get Local widgets datas
     * @return {Array} array of widgets
     */
    getInitData() {
      return this.apps.map((item) => {
        return {
          name: item.app.name,
          show: item.app.initShow,
        }
      })
    },

    /**
     * @description: Save Widgets Configs
     * @return {*} void
     */
    saveData(data) {
      this.$api.users.setCustomStorage(widgetsConfig, data).then((res) => {
        if (res.data.success === 200) {
          this.widgetsSettings = res.data.data
        }
      })
    },

    handleChange(data) {
      this.widgetsSettings = data
      this.saveData(this.widgetsSettings)
    },


  },
}
</script>

<template>
  <!-- display: contents, so each widget is a cell of the Home grid -->
  <div v-if="!isLoading" class="side-bar">
    <div v-for="item in activeApps" :key="`widgets_${item.app.name}`" :class="`ao-w-${item.app.name}`" class="ao-cell">
      <component :is="item.app" />
    </div>
    <Settings v-model="widgetsSettings" class="ao-span-12 ao-o-9" @change="handleChange" />
  </div>
</template>

<style lang="scss">
.side-bar {
  display: contents;
}
</style>
