<script>
/** Given a class id, generates and populates the stats for the class component */
import { mapGetters } from 'vuex'
import ClassComponent from '../ClassComponent'
import { allCourseIDs, courseAcronyms, i18n } from 'core/utils'

export default {
  components: {
    ClassComponent
  },

  props: {
    classroomState: {
      type: Object,
      required: true
    },
    displayOnly: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    ...mapGetters({
      levelSessionsMapForClassroom: 'levelSessions/getSessionsMapForClassroom',
      sortedCourses: 'courses/sorted',
      getCourseInstancesForClass: 'courseInstances/getCourseInstancesForClass'
    }),

    levelSessionsMapByUser () {
      return this.levelSessionsMapForClassroom(this.classroomState._id) || {}
    },

    classroomCreationDate () {
      return moment(parseInt(this.classroomState._id.substring(0, 8), 16) * 1000).format('MMMM Do, YYYY')
    },

    classroomStartDate () {
      if (!this.classroomState.classDateStart) { return '' }
      return this.classroomState.classDateStart
    },

    classroomEndDate () {
      if (!this.classroomState.classDateEnd) { return '' }
      return this.classroomState.classDateEnd
    },

    sharePermission () {
      return (this.classroomState.permissions || []).find(p => p.target === me.get('_id'))?.access
    },

    classroomStatsFromClassroom () {
      return {
        id: this.classroomState._id,
        name: this.classroomState.name,
        language: this.classroomState.aceConfig?.language || 'python',
        numberOfStudents: this.classroomState.members.length || 0,
        classroomCreated: this.classroomCreationDate,
        classDateStart: this.classroomStartDate,
        classDateEnd: this.classroomEndDate,
        archived: this.classroomState.archived,
        codeCamel: this.classroomState.codeCamel,
        sharePermission: this.sharePermission,
        type: this.classroomState.type
      }
    },

    // Maps the course Id to the levels associated.
    courseLevelsMap () {
      const map = new Map()
      const courseInstanceCourses = new Set()
      const courseInstances = this.getCourseInstancesForClass(this.classroomState.ownerID, this.classroomState._id)

      for (const { courseID, members } of courseInstances) {
        // We don't want to show course instances if there aren't any students assigned.
        if (!Array.isArray(members) || members.length === 0) {
          continue
        }
        courseInstanceCourses.add(courseID)
      }

      for (const course of this.classroomState.courses) {
        if (!courseInstanceCourses.has(course._id)) {
          continue
        }
        map.set(course._id, { levels: course.levels })
      }

      return map
    },
    /**
       * TODO: Migrate this to be a background stats calculation.
       * Returns an array of chapter stats objects with the following shape:
      {
        name: String
        assigned: Integer - number of members,
        progress: Float between 0 and 1.
      }
      */
    chapterStatsAdapter () {
      const selectedCodeNinjasCampCourses = {
        'camp-esports': [allCourseIDs.CHAPTER_ONE, allCourseIDs.CHAPTER_TWO],
        'camp-junior': [allCourseIDs.JUNIOR],
      }[this.classroomState.type]
      return this.sortedCourses
        .filter((course) => me.hasCampaignAccess(course))
        .filter((course) => !me.isCodeNinja() || !selectedCodeNinjasCampCourses || selectedCodeNinjasCampCourses.includes(course._id))
        .map((course) => {
          const splitName = course.name.split(':')
          let name = i18n(course, 'name')
          if (splitName.length > 1) {
            name = splitName[0]
          }

          const translateKey = `teacher.${courseAcronyms[course._id]}_short`
          if ($.i18n.exists(translateKey)) {
            name = $.i18n.t(translateKey)
          }

          const result = {
            name,
            origName: course.name,
            assigned: false,
            progress: 0
          }

          // If we have assigned this course then calculate the progress.
          if (this.courseLevelsMap.has(course._id)) {
            result.assigned = true
            const levels = this.courseLevelsMap.get(course._id).levels
            const levelSetInCourse = new Set(levels.map((l) => l.original))

            let progress = 0
            // Fallback to 1 to prevent division by 0 error in an empty class.
            const totalProgress = this.classroomState.members.length * levels.length || 1

            for (const memberId of this.classroomState.members) {
              for (const [levelOriginal, sessionData] of Object.entries(this.levelSessionsMapByUser[memberId] || [])) {
                if (!levelSetInCourse.has(levelOriginal)) {
                  continue
                }

                if (sessionData.state.complete) {
                  progress += 1
                }
              }
            }

            result.progress = progress / totalProgress
          }

          return result
        })
    }
  }
}
</script>

<template>
  <ClassComponent
    :classroom-stats="classroomStatsFromClassroom"
    :chapter-stats="chapterStatsAdapter"
    :display-only="displayOnly"
    @clickTeacherArchiveModalButton="$emit('clickTeacherArchiveModalButton')"
    @clickAddStudentsModalButton="$emit('clickAddStudentsModalButton')"
    @clickShareClassWithTeacherModalButton="$emit('clickShareClassWithTeacherModalButton')"
  />
</template>
