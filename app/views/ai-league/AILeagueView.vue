<script>
import { mapActions, mapMutations } from 'vuex'
import PageLeagueTeachers from './PageLeagueTeachers.vue'
import { PAGE_TITLES } from '../../../ozaria/site/components/teacher-dashboard/common/constants.js'

export default {
  name: 'AILeague',
  components: {
    PageLeagueTeachers,
  },

  state: {
    pageTitle: 'AILeague'
  },

  beforeRouteUpdate (to, from, next) {
    this.idOrSlug = to.params.idOrSlug || null
    if (this.idOrSlug) {
      this.anonymousPlayerName = features.enableAnonymization
    }
    next()
  },

  data () {
    return {
      idOrSlug: null,
    }
  },

  watch: {
    idOrSlug (newVal, oldVal) {
      if (newVal) {
        this.fetchRequiredInitialData({ optionalIdOrSlug: newVal })
      }
    }
  },

  created () {
    this.fetchRequiredInitialData({ optionalIdOrSlug: this.$route.params.idOrSlug })
  },

  mounted () {
    this.startLoading()
    this.setComponentName(this.$options.name)
    this.setPageTitle(PAGE_TITLES[this.$options.name])
  },

  methods: {
    ...mapMutations({
      resetLoadingState: 'teacherDashboard/resetLoadingState',
      setTeacherId: 'teacherDashboard/setTeacherId',
      setPageTitle: 'teacherDashboard/setPageTitle',
      setComponentName: 'teacherDashboard/setComponentName',
      startLoading: 'teacherDashboard/startLoading'
    }),
    ...mapActions({
      fetchRequiredInitialData: 'clans/fetchRequiredInitialData',
    })
  }
}
</script>

<template>
  <div>
    <PageLeagueTeachers :id-or-slug="idOrSlug" />
  </div>
</template>

<style lang="scss" scoped>
</style>
