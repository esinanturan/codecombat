<script>
import { mapGetters, mapActions } from 'vuex'
import utils from 'core/utils'
import IconNew from 'app/core/components/IconNew'

export default {
  components: {
    IconNew,
  },

  computed: {
    ...mapGetters({
      chapterNavBar: 'baseCurriculumGuide/chapterNavBar',
      selectedChapterId: 'baseCurriculumGuide/selectedChapterId',
      getCurrentCourse: 'baseCurriculumGuide/getCurrentCourse',
      getTrackCategory: 'teacherDashboard/getTrackCategory',
      classroomCourseId: 'teacherDashboard/getSelectedCourseIdCurrentClassroom',
      courses: 'courses/sorted'
    }),

    chapterNav () {
      // This ensures released chapters are correctly placed, with internal chapters added after.
      return (this.chapterNavBar || [])
        .filter(({ releasePhase }) => releasePhase !== 'internalRelease')
        .concat(
          (this.chapterNavBar || [])
            .filter(({ releasePhase }) => releasePhase === 'internalRelease')
        ).map(({ campaignID, free, _id }, idx) => {
          return ({
            campaignID,
            heading: utils.isCodeCombat ? utils.courseAcronyms[_id] : this.$t('teacher_dashboard.chapter_num', { num: idx + 1 })
          })
        })
    },

    courseName () {
      return this.getCurrentCourse?.name || ''
    }
  },

  created () {
    this.setDefaultCampaign()
  },

  methods: {
    ...mapActions({
      setSelectedCampaign: 'baseCurriculumGuide/setSelectedCampaign'
    }),

    classForButton (campaignID) {
      return {
        selected: this.selectedChapterId === campaignID,
        'chapter-btn': true
      }
    },

    clickChapterNav (campaignID) {
      this.setSelectedCampaign(campaignID)
      window.tracker?.trackEvent('Curriculum Guide: Chapter Nav Clicked', { category: this.getTrackCategory, label: this.courseName })
    },

    setDefaultCampaign () {
      // open the related campaign if course was selected on teacher dashboard
      const classroomCourseId = this.classroomCourseId
      if (!classroomCourseId) return

      const courses = this.courses
      if (!courses) return

      const course = courses.find(course => course._id === classroomCourseId)

      if (course && course.campaignID) {
        this.setSelectedCampaign(course.campaignID)
      }
    },

    showNewIcon (campaignID) {
      return campaignID === utils.campaignIDs.HACKSTACK
    },
  },
}
</script>

<template>
  <div id="chapter-nav">
    <div
      v-for="{ campaignID, heading } in chapterNav"
      :key="campaignID"
      :class="classForButton(campaignID)"
      @click="() => clickChapterNav(campaignID)"
    >
      <div class="chapter-pill">
        {{ heading }}
        <IconNew
          v-if="showNewIcon(campaignID)"
          class="new-icon"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @import "app/styles/bootstrap/variables";
  @import "ozaria/site/styles/common/variables.scss";
  @import "app/styles/ozaria/_ozaria-style-params.scss";

  #chapter-nav {
    display: flex;
    margin: 8px 25px 0;

    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.06);

    h4 {
      @include font-h-4-nav-uppercase-black;
      font-size: 14px;
      line-height: 18px;
      color: #545b64;
    }
  }

  .chapter-pill {
    padding: 9px 20px;
    border-radius: 20px;
    position: relative;

    &:hover {
      background-color: #f2f2f2;
    }

    .new-icon {
      position: absolute;
      top: -10px;
      right: -10px;
    }
  }

  .chapter-btn {
    margin: 0 2.5px;
    padding: 0 5px;

    cursor: pointer;

    transition: border-color 0.2s;
    border-bottom: 4px solid rgba(71,111,177, 0);

    &.selected {
      border-bottom: 4px solid rgba(71,111,177, 1);
    }
  }
</style>
