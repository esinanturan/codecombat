<script> // eslint-disable-line vue/multi-word-component-names
import { cocoBaseURL, getQueryVariable, isCodeCombat, isOzaria, ozBaseURL } from 'core/utils'
import { mapGetters } from 'vuex'
import FinalFooter from './FinalFooter'

import { items } from 'app/components/common/Navigation'

/**
 * Unified footer component between CodeCombat and Ozaria.
 */
export default Vue.extend({
  components: {
    FinalFooter
  },
  data () {
    return {}
  },
  computed: {
    ...mapGetters({
      preferredLocale: 'me/preferredLocale'
    }),

    isCodeCombat () {
      return isCodeCombat
    },

    isOzaria () {
      return isOzaria
    },

    isChinaHome () {
      return features.chinaHome
    },

    cocoBaseURL () {
      return cocoBaseURL()
    },

    ozBaseURL () {
      return ozBaseURL()
    },

    hideFooter () {
      return getQueryVariable('landing', false) || me.hideFooter()
    },

    footerUrls () {
      /* footer url example
         column: {
         title: i18n keys on column title
         condition: display column or not, i.e. me.isStudent()
         lists: lists of links in footer }
         each link: {
         url: a.href
         title: i18n keys on link title
         extra: if we do not use i18n title, set this as span.spr
         attrs: extra dom attributes setting in object, i.e. {target: '_blank'}
         }

         chinaFooter is standalone so don't worry on China resources.
       */
      const globalFooter = [
        {
          title: 'nav.company',
          condition: true, // always display
          lists: [
            { url: this.cocoPath('/about'), title: 'nav.about', attrs: { 'data-event-action': 'Click: Footer About' } },
            { url: 'https://codecombat.zendesk.com/hc/en-us', title: 'nav.help_center', attrs: { target: '_blank', 'data-event-action': 'Click: Footer Help Center' } },
            { title: 'general.contact_us', attrs: { class: 'contact-modal', tabindex: -1 } },
            { url: this.cocoPath('/about#careers'), title: 'nav.careers' },
            { url: 'https://blog.codecombat.com/', title: 'nav.blog' },
            { url: this.cocoPath('/podcast'), title: 'nav.podcast_simple' }
          ]
        },
        {
          title: 'nav.curriculum',
          condition: true,
          lists: [
            { ...items.COCO_HOME, url: null, attrs: { class: 'signup-button' } },
            items.COCO_CLASSROOM,
            items.COCO_JUNIOR,
            items.OZ_CLASSROOM,
            items.AP_CSP,
            items.AI_LEAGUE,
            items.ROBLOX,
            items.AI_HACKSTACK,
            items.AI_JUNIOR,
          ]
        },
        {
          title: 'nav.resources',
          condition: true,
          lists: [
            items.LIVE_ONLINE_CLASSES,
            items.LIBRARY_SOLUTIONS,
            items.PARTNER_SOLUTIONS,
            items.TEACHING_SOLUTIONS,
            items.STANDARDS,
            items.EFFICACY,
            items.SUCCESS,
            items.PD,
            items.HOC,
            items.GRANTS,
            { ...items.ACCESSIBILITY, filter: !me.get('country') || me.get('country') === 'united-states' },
            items.PRIVACY,
          ]
        }
      ]

      const chinaFooter = [
        {
          title: '',
          condition: me.isStudent() || this.isChinaHome,
          lists: []
        },
        {
          title: 'nav.general',
          condition: !this.isChinaHome,
          lists: [
            { url: this.cocoPath('/events'), title: 'nav.events' },
            { url: this.cocoPath('/contact-cn'), title: 'nav.contact', hide: me.isStudent() },
            { url: this.cocoPath('/CoCoStar'), title: 'nav.star' },
            { url: this.cocoPath('/contribute'), title: 'nav.contribute' }
          ]
        },
        {
          title: 'nav.educators',
          condition: !me.isStudent() && !this.isChinaHome,
          lists: [
            { url: '/teachers/resources/faq-zh-HANS', title: 'teacher.educator_faq' },
            { url: '/teachers/resources', title: 'nav.resource_hub' },
            { url: '/teachers/resources', extra: '课程体系' },
            { url: 'teachers/classes', title: 'nav.my_classrooms' }
          ]
        },
        {
          title: 'nav.related_urls',
          condition: true,
          lists: [
            { url: 'https://xuetang.koudashijie.com', extra: '扣哒学堂' },
            { url: 'https://aojiarui.com', extra: '奥佳睿' },
            { url: 'https://aishiqingsai.org.cn', extra: 'AI世青赛' },

            { url: 'https://koudashijie.com', extra: '扣哒世界', hide: !this.isChinaHome },
            { url: 'https://codecombat.cn', extra: 'CodeCombat 个人版', hide: this.isChinaHome }
          ]
        }
      ]

      if (window.me.showChinaResourceInfo()) {
        return chinaFooter
      } else {
        return globalFooter
      }
    },
    darkMode () {
      return /^\/(hackstack|roblox|league|play\/ladder)/.test(document.location.pathname)
    },
  },

  created () {
    // Bind the global values to the vue component.
    this.me = me
    this.document = window.document
  },
  methods: {
    footerEvent (e) {
      // Only track if user has clicked a link on the footer
      if (!e || !e.target || e.target.tagName !== 'A') {
        return
      }

      if (!window.tracker) {
        return
      }

      const clickedAnchorTag = e.target
      const action = `Link: ${clickedAnchorTag.getAttribute('href') || clickedAnchorTag.getAttribute('data-event-action')}`
      const properties = {
        category: 'Footer',
        // Inspired from the HomeView homePageEvent method
        user: me.get('role') || (me.isAnonymous() && 'anonymous') || 'homeuser'
      }

      window.tracker.trackEvent(action, properties)
    },

    /**
     * This is used to highlight footer routes we are currently on.
     */
    checkLocation (route) {
      const location = document.location.href
        .replace(document.location.hash, '')
        .replace(document.location.search, '')
      return route === new URL(location).pathname
    },

    /**
     * Returns a codecombat url for a relative path.
     * If the user is already on codecombat, will return a relative URL.
     * If the user is on ozaria, will return an absolute url to codecombat.com
     *
     * Handles subdomains such as staging.ozaria.com, will return absolute path
     * to staging.codecombat.com
     *
     * The domains used in China are also handled, i.e. koudashijie
     */
    cocoPath (relativePath) {
      return `${this.cocoBaseURL}${relativePath}`
    },

    ozPath (relativePath) {
      return `${this.ozBaseURL}${relativePath}`
    }
  }
})
</script>

<template lang="pug">
footer#site-footer.small(:class="{'dark-mode': darkMode}" @click="footerEvent")
  .container(v-if="!hideFooter")
    .row
      .col-lg-12.footer-links
        .row.footer-links__row
          .col.footer-links__col(v-for="col in footerUrls" v-if="col.condition && col.lists.length" :class="!col.lists.length ? 'shrunken-empty-column' : ''")
            h1.text-h3 {{ $t(col.title) }}
            ul.list-unstyled(:class="col.class")
              li(v-for="l in col.lists" v-if="!l.hide")
                span.hover-link(v-if="!l.url" v-bind="l.attrs") {{ $t(l.title) }}
                  span.spr(v-if="l.extra") {{ l.extra }}
                a(v-else-if="!checkLocation(l.url)" :href="l.url" v-bind="l.attrs") {{ $t(l.title) }}
                  span.spr(v-if="l.extra") {{ l.extra }}
                span.active(v-if="checkLocation(l.url)") {{ $t(l.title) }}
                  span.spr(v-if="l.extra") {{ l.extra }}
    final-footer
</template>

<style lang="sass" scoped>
@import "app/styles/bootstrap/variables"
@import "app/styles/mixins"
@import "app/styles/style-flat-variables"
@import "app/styles/component_variables"

footer#site-footer

  background: url(/images/components/footer-bg.webp) bottom center
  .teal-theme &
    background: url(/images/components/footer-bg__teal.webp) bottom center
    background-repeat: repeat-x

  &.dark-mode
    background-color: #0C1016
    background-image: url(/images/components/footer-bg-dark.webp)

  overflow: hidden
  background-size: contain
  background-repeat: repeat-x

  .container
    border-radius: 8px
    background: var(--color-bg-gradient)
    margin-bottom: 80px
    margin-top: 300px

  &.dark-mode .container
    background: linear-gradient(100deg, #193640 0%, #021E27 100%)

  @media print
    display: none

  .small
    font-family: $body-font
    font-weight: normal
    font-size: 14px
    line-height: 19px
    letter-spacing: 0.58px

  .text-h3

    &:empty
      min-height: 1em

    margin: 20px auto
    display: block
    font-variant: normal
    color: var(--color-primary)
    font-family: $main-font-family
    @extend %font-14
    font-style: normal
    font-weight: 800
    line-height: 150%
    text-transform: uppercase
  &.dark-mode .text-h3
    color: #4DECF0

  li
    color: $dark-grey
    font-family: $main-font-family
    @extend %font-16
    font-style: normal
    font-weight: 400
    line-height: 150%
    margin: 16px 0
  &.dark-mode li
    color: white

  .col-lg-3
    padding-bottom: 15px
    @media (max-width: $screen-md-min)
      padding-left: 27px

    &.shrunken-empty-column
      margin-right: -12.5%

  @media (max-width: $screen-sm-min)
    height: auto

  a
    color: $dark-grey
  &.dark-mode a
    color: white

  .social-buttons > a
    margin-right: 10px

  .small
    color: rgba(255,255,255,0.8)

  .mpqr
    width: 95px

  .follow_us
    display: flex
    flex-direction: column
    .socialicon
      display: flex
      justify-content: space-between
      .si
        width: 50px
        height: 45px
        background-size: 50px
        background-position: center
        background-repeat: no-repeat
        position: relative
        cursor: pointer
      .si-bilibili
        background-image: url('https://assets.koudashijie.com/images/home/icon/bilibili-dark.png')
        &:hover
          background-image: url('https://assets.koudashijie.com/images/home/icon/bilibili-light.png')
      .si-wechat
        background-image: url('https://assets.koudashijie.com/images/home/icon/wechat-dark.png')
        &:hover
          background-image: url('https://assets.koudashijie.com/images/home/icon/wechat-light.png')
        &:hover .mpqrcode
          display: flex
      .si-tiktok
        background-image: url('https://assets.koudashijie.com/images/home/icon/tiktok-dark.png')
        &:hover
          background-image: url('https://assets.koudashijie.com/images/home/icon/tiktok-light.png')
        &:hover .tkqrcode
          display: flex
      .si-weibo
        background-image: url('https://assets.koudashijie.com/images/home/icon/weibo-dark.png')
        &:hover
          background-image: url('https://assets.koudashijie.com/images/home/icon/weibo-light.png')

    .tkqrcode
      display: none
      position: absolute
      top: 50px
      left: 0
      .tkqr
        width: 120px
    .mpqrcode
      display: none
      position: absolute
      top: 50px
      left: 0
      .span
        margin-right: 20px
        display: flex
        flex-direction: column
        align-items: center

  .footer-links
    &__row
      display: flex
      flex-wrap: wrap
      margin-left: -15px
      margin-right: -15px
      justify-content: space-between
    &__col
      padding-left: 15px
      padding-right: 15px
      max-width: 25%
      @media (max-width: $screen-sm-min)
        flex: 0 0 50%
        max-width: 50%
      @media (max-width: $screen-xs-min)
        flex: 0 0 100%
        max-width: 100%

  #final-footer
    padding: 20px 70px 14px
    font-size: 14px

    .float-right
      padding-top: 15px
      float: right

    @media (max-width: $screen-md-min)
      position: inherit
      height: auto
      .float-right
        float: none

    a
      color: rgba(255,255,255,0.8)
      margin-left: 20px

    img
      height: 40px
      margin-right: 20px

    img#mps
      height: 1em
      margin-right: 0

    .small
      color: rgba(255,255,255,0.8)

    .contact
      margin-right: 20px

  .hover-link
    cursor: pointer

footer#site-footer.dark-mode
  /*background-color: #0C1016*/

</style>
