<script>
import Panel from '../Panel/index.vue'
import ModalAssignContent from '../modals/ModalAssignContent/index'
import ModalApplyLicenses from '../modals/ModalApplyLicenses/index.vue'
import ModalAddStudents from '../modals/ModalAddStudents'
import ModalRemoveStudents from '../modals/ModalRemoveStudents'
import ModalOnboardingVideo from '../modals/ModalOnboardingVideo'
import ModalEditClass from '../modals/ModalEditClass'

import SecondaryTeacherNavigation from '../common/SecondaryTeacherNavigation'
import TitleBar from '../common/TitleBar'
import LoadingBar from 'ozaria/site/components/common/LoadingBar'
import { COMPONENT_NAMES } from '../common/constants.js'
import TopBanner from './TopBanner'

import utils from 'core/utils'

import storage from 'core/storage'

import { mapMutations, mapGetters, mapActions } from 'vuex'
import { FIRST_CLASS_STEPS, CREATE_CLASS_STEPS } from './teacherDashboardTours'
import ModalTeacherDetails from '../modals/ModalTeacherDetails'
import { hasSeenTeacherDetailModalRecently, markTeacherDetailsModalAsSeen } from '../../../common/utils'
import TryOzariaModal from 'app/components/teacher/TryOzariaModal.vue'
import clubCampMixin from '../mixins/clubCampMixin'

const VueShepherd = require('vue-shepherd')

const SEEN_CREATE_CLASS_TOUR_KEY = 'create-a-class-tour-seen'
const TRY_OZ_MODAL_VIEWED_KEY = 'try-oz-modal-viewed'
const SIDEBAR_COLLAPSED_KEY = 'teacher-dashboard-sidebar-collapsed'

export default {
  name: 'BaseTeacherDashboardIndex',
  components: {
    Panel,
    ModalEditClass,
    ModalAssignContent,
    ModalAddStudents,
    ModalApplyLicenses,
    ModalRemoveStudents,
    ModalOnboardingVideo,
    SecondaryTeacherNavigation,
    TitleBar,
    LoadingBar,
    ModalTeacherDetails,
    TryOzariaModal,
    TopBanner,
  },
  mixins: [clubCampMixin],

  data () {
    // TODO: move the logic to open/close modals to teacherDashboard store instead of driving by events,
    // as it might grow a lot and become hard to maintain.
    return {
      showRestrictedDiv: false,
      showNewClassModal: false,
      showAssignContentModal: false,
      showApplyLicensesModal: false,
      showAddStudentsModal: false,
      showRemoveStudentsModal: false,
      showOnboardingModal: false,
      showTeacherDetailsModal: false,
      // // We may want to pull this out. For locality with dashboard this reduces abstraction.
      runningTour: null,
      createdFirstClass: false,
      trialRequestLoading: true,
      newClassroom: {},
      sidebarCollapsed: storage.load(SIDEBAR_COLLAPSED_KEY) || false,
      editCurrent: false,
      editClassroomObject: {},
      showTryOzariaModal: false,
      newClassroomAsClub: false
    }
  },

  computed: {
    ...mapGetters({
      loading: 'teacherDashboard/getLoadingState',
      getPageTitle: 'teacherDashboard/getPageTitle',
      activeClassrooms: 'teacherDashboard/getActiveClassrooms',
      classroom: 'teacherDashboard/getCurrentClassroom',
      classroomCourses: 'teacherDashboard/getCoursesCurrentClassroom',
      selectedCourseId: 'teacherDashboard/getSelectedCourseIdCurrentClassroom',
      componentName: 'teacherDashboard/getComponentName',
      trialRequest: 'trialRequest/properties',
      sharedClassrooms: 'teacherDashboard/getSharedClassrooms',
      getPrepaids: 'prepaids/getPrepaidsByTeacher',
    }),

    me () {
      return me
    },

    isCodeCombat () {
      return utils.isCodeCombat
    },

    isCodeNinja () {
      return me.isCodeNinja()
    },

    pageTitle () {
      if (this.showClassInfo) {
        return this.classroom.name || ''
      } else {
        return this.getPageTitle
      }
    },

    showNonTeacherPreview () {
      return !me.isTeacher() && this.$route.path.startsWith(('/teachers/resources'))
    },

    getLanguage () {
      if (this.classroom && this.classroom.aceConfig) {
        return this.classroom.aceConfig?.language || 'python'
      }

      if (this.activeClassrooms.length > 0) {
        return this.getMostCommonLanguage()
      }
      return null
    },

    isAllClassesPage () {
      return this.componentName === COMPONENT_NAMES.MY_CLASSES_ALL
    },

    showClassInfo () {
      return this.componentName === COMPONENT_NAMES.MY_CLASSES_SINGLE || this.componentName === COMPONENT_NAMES.STUDENT_PROJECTS || this.componentName === COMPONENT_NAMES.STUDENT_ASSESSMENTS || this.componentName === COMPONENT_NAMES.AI_JUNIOR
    },
    allClassrooms () {
      return [...this.activeClassrooms, ...this.sharedClassrooms]
    },

    allLicensesTypes () {
      const prepaidTypes = this.getPrepaids(me.id)?.available?.map(prepaid => {
        let baseType = 'full_license'
        if (prepaid.type === 'starter_license') {
          baseType = 'starter_license'
        }
        const includedCourseIDs = prepaid.includedCourseIDs
        if (includedCourseIDs) {
          baseType = 'customized_license:' + (includedCourseIDs.join('+'))
        }
        return `${baseType}:${prepaid.endDate}` // Licenses of different endDate should be displayed separately
      })
      return Array.from(new Set(prepaidTypes))
    },
  },

  watch: {
    $route (to, from) {
      if (to.params.classroomId !== from.params.classroomId && to.params.classroomId) {
        this.updateStoreOnNavigation()
      }
    },
    showOnboardingModal (newVal) {
      // skip the ozaria modal for coco users
      if (this.isCodeCombat && newVal) {
        this.closeOnboardingModal()
      }
    }
  },
  beforeCreate () {
    Vue.use(VueShepherd)
  },
  created () {
    if (!me.isTeacher()) { // TODO Restrict this from Router itself similar to how `RestrictedToTeachersView` works
      this.showRestrictedDiv = true
      this.showOnboardingModal = !me.get('seenNewDashboardModal')
    } else {
      this.showRestrictedDiv = false
      this.updateStoreOnNavigation()
      this.handleTrialRequest()
    }
  },

  metaInfo () {
    return {
      title: $.i18n.t(`nav.${utils.getProduct()}_teacher_dashboard`)
    }
  },

  beforeRouteUpdate (to, from, next) {
    next()
  },

  methods: {
    ...mapMutations({
      setClassroomId: 'teacherDashboard/setClassroomId',
      setTeacherId: 'teacherDashboard/setTeacherId',
      setSelectedCourseId: 'teacherDashboard/setSelectedCourseIdCurrentClassroom',
      setTeacherPagesTrackCategory: 'teacherDashboard/setTrackCategory',
    }),

    ...mapActions({
      applyLicenses: 'baseSingleClass/applyLicenses',
      generateLevelNumberMap: 'gameContent/generateLevelNumberMap',
    }),

    dynamicShowingApplyLicenseModal () {
      if (this.allLicensesTypes.length > 1) {
        this.showApplyLicensesModal = true
      } else {
        this.applyLicenses()
      }
    },
    getMostCommonLanguage () {
      const languagesCount = this.activeClassrooms.reduce((map, classroom) => {
        const language = classroom.aceConfig?.language || 'python'
        map[language] = (map[language] || 0) + 1
        return map
      }, {})

      const languagesSortedByCount = Object.entries(languagesCount)
        .sort(function (a, b) {
          return b[1] - a[1]
        })

      return languagesSortedByCount[0][0]
    },

    updateStoreOnNavigation () {
      if (this.$route.params.classroomId) {
        this.setClassroomId(this.$route.params.classroomId)
      }
      this.setTeacherId(me.get('_id'))
      this.setTeacherPagesTrackCategory('Teachers') // For pages shared between DT and DSA
    },

    closeOnboardingModal () {
      me.set('seenNewDashboardModal', true)
      me.save()
      this.showOnboardingModal = false
      if (!me.isNapervilleUser()) {
        this.openNewClassModal()
      }
    },

    openNewClassModal () {
      if (this.showNewClassModal) {
        return
      }

      // Handle tour accidentally obscuring user opening new class modal
      this.runningTour?.complete?.()

      this.showNewClassModal = true
    },

    openNewClubModal () {
      if (this.showNewClassModal) {
        return
      }

      // Handle tour accidentally obscuring user opening new class modal
      this.runningTour?.complete?.()

      this.newClassroomAsClub = true
      this.showNewClassModal = true
    },

    /**
     * When a user closes the show new modal there are 2 possible states.
     * 1. They cancelled out and didn't create a class.
     * 2. They created a class.
     **/
    closeShowNewModal () {
      this.showNewClassModal = false
      if (this.editCurrent) {
        this.editCurrent = false
        return
      }

      if (this.newClassroomAsClub) {
        this.newClassroomAsClub = false
        return
      }

      if (this.createdFirstClass) {
        this.triggerFirstClassTour()
        return
      }

      this.triggerCreateClassTour()
    },

    openEditClassModal (claz) {
      this.editClassroomObject = claz
      this.editCurrent = true
      this.showNewClassModal = true
    },

    /**
     * Track when a teacher has actively created their first class.
     */
    handleCreatedClass () {
      if (this.activeClassrooms.length === 1) {
        // Flag the first class created so we can run a tour later.
        this.createdFirstClass = true
      }
    },

    triggerCreateClassTour () {
      if (this.loading || this.activeClassrooms.length !== 0) {
        return
      }

      if (storage.load(`${SEEN_CREATE_CLASS_TOUR_KEY}-${me.get('_id')}`)) {
        return
      }

      this.runningTour?.complete?.()

      storage.save(`${SEEN_CREATE_CLASS_TOUR_KEY}-${me.get('_id')}`, true)

      const tour = this.$shepherd({
        useModalOverlay: true,
        defaultStepOptions: {
          classes: 'shepherd-dashboard-theme'
        }
      })

      tour.addSteps(CREATE_CLASS_STEPS)
      tour.start()

      this.runningTour = tour
    },

    triggerFirstClassTour () {
      if (!this.isAllClassesPage) {
        return
      }

      if (this.loading || this.activeClassrooms.length !== 1) {
        return
      }

      this.runningTour?.complete?.()

      const tour = this.$shepherd({
        useModalOverlay: true,
        scrollTo: true,
        defaultStepOptions: {
          classes: 'shepherd-dashboard-theme'
        }
      })

      tour.addSteps(FIRST_CLASS_STEPS)
      tour.start()

      this.runningTour = tour
    },

    onChangeCourse (courseId) {
      this.setSelectedCourseId({ courseId })

      const course = this.classroomCourses.find(({ _id }) => _id === this.selectedCourseId)
      this.generateLevelNumberMap({
        campaignId: course.campaignID,
        language: this.classroom.aceConfig.language,
      }).catch(console.error)
    },

    closeTeacherDetailsModal () {
      markTeacherDetailsModalAsSeen(me.get('_id'))
      this.showTeacherDetailsModal = false
    },
    shouldShowTeacherDetailsModal () {
      return !this.trialRequestLoading && !this.trialRequest?.organization && !hasSeenTeacherDetailModalRecently(me.get('_id')) && !me.isNapervilleUser()
    },
    handleTrialRequest () {
      this.$store.dispatch('trialRequest/fetchCurrentTrialRequest')
        .then((result) => {
          this.trialRequestLoading = false
          this.showTeacherDetailsModal = this.shouldShowTeacherDetailsModal()
        })
        .catch((err) => {
          console.error('teacherDetailsModal fetch failed', err)
        })
        .finally(() => {
          this.showOnboardingModal = !me.get('seenNewDashboardModal')
          this.handleTryOzariaModal()
        })
    },
    toggleSidebar () {
      this.sidebarCollapsed = !this.sidebarCollapsed
      storage.save(SIDEBAR_COLLAPSED_KEY, this.sidebarCollapsed)
    },
    handleTryOzariaModal () {
      if (this.isCodeCombat &&
        !this.showOnboardingModal &&
        !this.showTeacherDetailsModal &&
        !me.get('activity')?.['visit-ozaria'] &&
        !storage.load(TRY_OZ_MODAL_VIEWED_KEY)
      ) {
        this.showTryOzariaModal = true
      }
    },
    closeTryOzariaModal () {
      const oneMonth = 30 * 24 * 7 * 60
      storage.save(TRY_OZ_MODAL_VIEWED_KEY, true, oneMonth)
      this.showTryOzariaModal = false
    },
    shouldShowCreateStudents (_classroom) {
      return false
    },
  },
}
</script>

<template>
  <div
    v-if="showRestrictedDiv && !showNonTeacherPreview"
    class="restricted-div"
  >
    <h5> {{ $t('teacher.access_restricted') }} </h5>
    <p> {{ $t('teacher.teacher_account_required') }} </p>
  </div>
  <div v-else>
    <panel />
    <top-banner />
    <div class="teacher-dashboard">
      <div
        v-if="!showNonTeacherPreview"
        :class="['teacher-dashboard__sidebar', { 'collapsed': sidebarCollapsed }]"
      >
        <div class="content">
          <secondary-teacher-navigation :classrooms="allClassrooms" />
        </div>
        <div
          class="collapse-button"
          @click="toggleSidebar"
        >
          <span class="left">&#x25C0;</span>
          <span class="right">&#x25B6;</span>
        </div>
      </div>
      <div :class="['teacher-dashboard__body', { 'sidebar-hidden': showNonTeacherPreview }]">
        <title-bar
          :title="pageTitle"
          :show-class-info="showClassInfo"
          :classroom="classroom"
          :courses="classroomCourses"
          :selected-course-id="selectedCourseId"
          :all-classes-page="isAllClassesPage"
          :show-preview-mode="showNonTeacherPreview"
          @change-course="onChangeCourse"
          @newClass="openNewClassModal"
          @newClub="openNewClubModal"
          @addStudentsClicked="showAddStudentsModal = true"
          @editClass="openEditClassModal"
        />
        <loading-bar
          :key="loading"
          :loading="loading"
        />
        <router-view
          @assignContent="showAssignContentModal = true"
          @addStudents="showAddStudentsModal = true"
          @removeStudents="showRemoveStudentsModal = true"
          @applyLicenses="dynamicShowingApplyLicenseModal"
        />
      </div>
    </div>
    <modal-teacher-details
      v-if="showTeacherDetailsModal"
      :initial-organization="trialRequest.organization"
      :initial-district="trialRequest.district"
      :initial-city="trialRequest.city"
      :initial-state="trialRequest.state"
      :initial-country="trialRequest.country"
      @close="closeTeacherDetailsModal"
    />
    <modal-onboarding-video
      v-else-if="showOnboardingModal"
      @close="closeOnboardingModal"
    />
    <modal-edit-class
      v-if="showNewClassModal && !editCurrent && !showNonTeacherPreview"
      :classroom="newClassroom"
      :as-club="newClassroomAsClub"
      @close="closeShowNewModal"
      @created="handleCreatedClass"
    />
    <modal-edit-class
      v-if="showNewClassModal && editCurrent"
      :classroom="editClassroomObject"
      :as-club="isCodeNinjaClubCamp(editClassroomObject)"
      @close="closeShowNewModal"
    />
    <modal-assign-content
      v-if="showAssignContentModal"
      @close="showAssignContentModal = false"
    />
    <modal-add-students
      v-if="showAddStudentsModal"
      :classroom="classroom"
      :create-students="shouldShowCreateStudents(classroom)"
      @close="showAddStudentsModal = false"
    />
    <modal-remove-students
      v-if="showRemoveStudentsModal"
      @close="showRemoveStudentsModal = false"
    />
    <modal-apply-licenses
      v-if="showApplyLicensesModal"
      :classroom="classroom"
      @close="showApplyLicensesModal=false"
    />
    <try-ozaria-modal
      v-if="showTryOzariaModal"
      @close="closeTryOzariaModal"
    />
  </div>
</template>

<style lang="scss" scoped>
.restricted-div {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 100px;
}
</style>

<style lang="scss">
/* Default tooltip styles so they work. */
.tooltip {
  display: block !important;
  z-index: 10000;

  .tooltip-inner {
    background: black;
    color: white;
    border-radius: 16px;
    padding: 5px 10px 4px;
  }

  .tooltip-arrow {
    width: 0;
    height: 0;
    border-style: solid;
    position: absolute;
    margin: 5px;
    border-color: black;
    z-index: 1;
  }

  &[x-placement^="top"] {
    margin-bottom: 5px;

    .tooltip-arrow {
      border-width: 10px 20px 0 20px;
      border-left-color: transparent !important;
      border-right-color: transparent !important;
      border-bottom-color: transparent !important;
      bottom: -5px;
      left: calc(50% - 5px);
      margin-top: 0;
      margin-bottom: 0;
    }
  }

  &[x-placement^="bottom"] {
    margin-top: 5px;

    .tooltip-arrow {
      border-width: 0 5px 5px 5px;
      border-left-color: transparent !important;
      border-right-color: transparent !important;
      border-top-color: transparent !important;
      top: -5px;
      left: calc(50% - 5px);
      margin-top: 0;
      margin-bottom: 0;
    }
  }

  &[x-placement^="right"] {
    margin-left: 5px;

    .tooltip-arrow {
      border-width: 5px 5px 5px 0;
      border-left-color: transparent !important;
      border-top-color: transparent !important;
      border-bottom-color: transparent !important;
      left: -5px;
      top: calc(50% - 5px);
      margin-left: 0;
      margin-right: 0;
    }
  }

  &[x-placement^="left"] {
    margin-right: 5px;

    .tooltip-arrow {
      border-width: 5px 0 5px 5px;
      border-top-color: transparent !important;
      border-right-color: transparent !important;
      border-bottom-color: transparent !important;
      right: -5px;
      top: calc(50% - 5px);
      margin-left: 0;
      margin-right: 0;
    }
  }

  /*
      We already have a popover component in the global styles. Thus we need to pair
      it with teacher-dashboard-tooltip to avoid breaking styles elsewhere on the site.
    */
  &.popover.teacher-dashboard-tooltip {
    border-image: unset;
    border-width: unset;
    border-style: unset;
    max-width: unset;

    box-shadow: -2px -4px 20px rgba(0, 0, 0, 0.25), 2px 4px 20px rgba(0, 0, 0, 0.25);
    -webkit-box-shadow: -2px -4px 20px rgba(0, 0, 0, 0.25), 2px 4px 20px rgba(0, 0, 0, 0.25);

    .popover-inner {
      box-shadow: unset;
      padding: 18px;
    }

    .popover-arrow {
      border-color: white;
    }

    &.lock-tooltip .popover-inner {
      padding: 0;
      z-index: 2;
      /* Prevents tooltip arrow appearing over button */
    }
  }

  &[aria-hidden='true'] {
    visibility: hidden;
    opacity: 0;
    transition: opacity .15s, visibility .15s;
  }

  &[aria-hidden='false'] {
    visibility: visible;
    opacity: 1;
    transition: opacity .15s;
  }
}

/* Tooltip style overrides */
.tooltip.teacher-dashboard-tooltip {

  &.getting-started-all-classes {
    z-index: 500;

    .tooltip-arrow {
      /* Center the arrow between the two buttons */
      transform: translateX(-15px);
    }
  }

  .tooltip-arrow {
    border-color: white;
  }

  .tooltip-inner {
    text-align: left;

    border-radius: 5px;
    background-color: white;
    color: #131b25;
    box-shadow: -2px -4px 20px rgba(0, 0, 0, 0.25), 2px 4px 20px rgba(0, 0, 0, 0.25);
    max-width: 378px;
    padding: 22px;

    font-family: "Work Sans";
    font-style: normal;
    font-size: 14px;
    letter-spacing: 0.26667px;

    p {
      margin: 0 0 5px 0;
      line-height: 18px;
    }

    p:last-child {
      margin: 0;
    }

    p.small {
      line-height: 14px;
      font-size: 12px;
    }

    h3 {
      margin: 0;
      color: #131b25;
      font-family: "Work Sans";
      font-style: normal;
      font-size: 17px;
      line-height: 22px;
      margin-bottom: 5px;

      font-variant: unset;
    }
  }
}

.tooltip.lighter-p {
  .tooltip-inner p {
    color: #656565;
  }
}

.tooltip.large-width {
  .tooltip-inner {
    width: 492px;
    max-width: unset;
  }
}

/* Tooltip style overrides */
.tooltip.dark-teacher-dashboard {
  .tooltip-inner {
    font-family: "Work Sans";
    font-style: normal;
    font-size: 14px;
    line-height: 16px;
    letter-spacing: 0.26667px;

    padding: 10px 14px;
    border-radius: 2px;

    background-color: #131b25;
    max-width: 216px;
  }

  .tooltip-arrow {
    border-color: #131b25;
  }
}

.shepherd-dashboard-theme.shepherd-has-title .shepherd-content {
  font-family: "Work Sans";
  font-style: normal;
  font-size: 14px;
  letter-spacing: 0.26667px;

  color: #131b25;
  box-shadow: -2px -4px 20px rgba(0, 0, 0, 0.25), 2px 4px 20px rgba(0, 0, 0, 0.25);
  padding: 22px 22px 10px 22px;

  header.shepherd-header {
    background: white;
    padding: 0;
  }

  div.shepherd-text {
    padding: 0;
    font-family: "Work Sans";
    font-style: normal;
    font-size: 14px;
    letter-spacing: 0.26667px;
    margin-bottom: 16px;

    ul {
      padding-inline-start: 18px;
    }
  }

  header h3 {
    margin: 0;
    color: #131b25;
    font-family: "Work Sans";
    font-style: bold;
    font-size: 17px;
    line-height: 22px;
    margin-bottom: 10px;

    font-variant: unset;
  }

  // Make the shepherd button look like a link
  button.shepherd-button {
    background: none !important;
    border: none;
    padding: 0 !important;
    /*optional*/
    font-family: arial, sans-serif;
    /*input has OS specific font-family*/
    color: #069;
    text-decoration: underline;
    cursor: pointer;

    font-family: "Work Sans";
    font-style: normal;
    font-size: 14px;
    letter-spacing: 0.26667px;
  }
}

.teacher-dashboard {
  display: flex;
  flex-direction: row;
  position: relative;

  &__sidebar {
    width: 250px;
    max-height: 100vh;
    position: sticky;
    top: 70px;
    z-index: 12;

    &.collapsed {
      overflow: hidden;
      height: max-content;
      padding-bottom: 70px;
      width: 50px;

      &:hover {
        overflow: visible;

        .content {
          opacity: 0.95;
          border-radius: 0 0 30px 0;
          box-shadow: 0 8px 6px -6px #D2D2D2;
          overflow: hidden;
        }
      }

      .collapse-button {
        left: 28px;
        right: unset;

        .left {
          display: none;
        }

        .right {
          display: block;
        }
      }
    }

    .content {
      background: white;
      position: relative;
      width: 250px;
      height: max-content;
    }
  }

  .sidebar-hidden {
  width: calc(100% - 0px);
  }

  &__body {
    width: calc(100% - 250px);
    border-left: 1px solid rgba(#979797, 0.2);

    .teacher-dashboard__sidebar.collapsed+& {
      width: calc(100% - 50px);
    }

    height: 100%;
    background-color: #f2f2f2;
    position: relative;
    overflow: hidden;
  }

  .collapse-button {
    cursor: pointer;
    position: absolute;
    color: #979797;
    right: 0;
    padding: 5px 0 5px 5px;
    border: 1px solid #979797;
    border-radius: 5px 0 0 5px;
    margin-top: 10px;
    border-right: none;

    &:hover {
      color: #000000;
      border-color: #000000;
    }

    .left {
      display: block;
    }

    .right {
      display: none;
    }
  }
}
</style>
