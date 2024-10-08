<script>
import PrimaryButton from '../../teacher-dashboard/common/buttons/PrimaryButton'
import ButtonCurriculumGuide from '../../teacher-dashboard/common/ButtonCurriculumGuide'
import NavSelectUnit from '../../teacher-dashboard/common/NavSelectUnit'
import BreadcrumbComponent from 'app/views/common/BreadcrumbComponent'
import SecondaryButton from '../../teacher-dashboard/common/buttons/SecondaryButton.vue'

import { mapActions } from 'vuex'

export default {
  components: {
    'primary-button': PrimaryButton,
    'button-curriculum-guide': ButtonCurriculumGuide,
    'nav-select-unit': NavSelectUnit,
    BreadcrumbComponent,
    'secondary-button': SecondaryButton
  },

  props: {
    title: {
      type: String,
      default: ''
    },
    breadcrumbList: {
      type: Array,
      default: () => []
    },
    showBreadCrumbs: {
      type: Boolean,
      default: false
    },
    showCourseDropdown: {
      type: Boolean,
      default: false
    },
    selectedCourseId: {
      type: String,
      default: ''
    },
    courses: {
      type: Array,
      default: () => []
    }
  },

  computed: {
    outcomesReportLink () {
      const kind = 'school-admin'
      const org = me.get('_id')
      return `/outcomes-report/${kind}/${org}`
    }
  },

  methods: {
    ...mapActions({
      toggleCurriculumGuide: 'baseCurriculumGuide/toggleCurriculumGuide'
    }),

    clickBreadCrumbsLink (text) {
      if (text.length > 0) {
        const textArr = text.split(' ')
        const eventName = textArr[textArr.length - 1] // Take last word of the breadcrumbs' text
        window.tracker?.trackEvent(`BreadCrumbs: ${eventName} Clicked`, { category: 'SchoolAdmin', label: this.$route.path })
      }
    },

    clickOutcomesReport () {
      window.tracker?.trackEvent('Outcomes Report Clicked', { category: 'SchoolAdmin', label: this.$route.path })
      this.$emit('outcomesReport')
    },

    clickCurriculumGuide () {
      window.tracker?.trackEvent('Curriculum Guide Clicked', { category: 'SchoolAdmin', label: this.$route.path })
      // this.toggleCurriculumGuide()
      window.open('teachers/curriculum', '_blank')
    },
    isNapervilleAdmin () {
      return me.isNapervilleAdmin()
    },
    clickRosterClassroom () {
      this.$emit('rosterClassroom')
    }

  }
}
</script>

<template>
  <div class="school-admin-title-bar">
    <div class="sub-nav">
      <h1 v-if="!showBreadCrumbs && title">
        {{ title }}
      </h1>
      <breadcrumb-component
        v-else-if="showBreadCrumbs && breadcrumbList.length > 0"
        :links="breadcrumbList"
        @click="(text) => clickBreadCrumbsLink(text)"
      />
    </div>
    <div class="sub-nav">
      <nav-select-unit
        v-if="showCourseDropdown"
        class="btn-margins-height"
        :courses="courses"
        :selected-course-id="selectedCourseId"
        @change-course=" (courseId) => $emit('change-course', courseId)"
      />
      <div style="display: flex;">
        <span
          v-if="isNapervilleAdmin()"
        >
          <secondary-button
            class="btn-title-padding btn-margins-height"
            @click="clickRosterClassroom"
          >
            {{ $t('school_administrator.roster') }}
          </secondary-button>
        </span>
        <a :href="outcomesReportLink">
          <primary-button
            id="outcomes-report-btn"
            class="btn-title-padding btn-margins-height"
            @click="clickOutcomesReport"
          >
            {{ $t('outcomes.outcomes_report') }}
          </primary-button>
        </a>

        <button-curriculum-guide
          class="btn-margins-height"
          @click="clickCurriculumGuide"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "app/styles/bootstrap/variables";
@import "ozaria/site/styles/common/variables.scss";
@import "app/styles/ozaria/_ozaria-style-params.scss";

.btn-title-padding {
  padding: 8px 22px;
}

.btn-margins-height {
  margin: 0 12.5px;
  white-space: nowrap;
}

.sub-nav {
  display: flex;
  flex-direction: row;
  align-items: center;

  &:last-child {
    margin-right: -12.5px;
  }

  &>h1:first-child {
    margin-right: 4.5px;
  }

  @media (max-width: 1280px) {
    .class-info-row {
      display: none;
    }

    h1 {
      max-width: 600px;
    }
  }
}

.school-admin-title-bar {
  height: 60px;
  background-color: #F2F2F2;
  border: 1px solid #d8d8d8;
  border-left: unset;
  border-right: unset;
  min-width: 1260px;

  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  padding-left: 30px;
  padding-right: 30px;

  /* Drop shadow bottom ref: https://css-tricks.com/snippets/css/css-box-shadow/ */
  -webkit-box-shadow: 0 8px 6px -6px #D2D2D2;
    -moz-box-shadow: 0 8px 6px -6px #D2D2D2;
        box-shadow: 0 8px 6px -6px #D2D2D2;

  @media (max-width: 1280px) {
    min-width: 1000px;
  }
}

h1 {
  @include font-h-2-subtitle-twilight;
  max-width: 290px;
  overflow-y: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

</style>
