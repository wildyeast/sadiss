import { shallowMount } from '@vue/test-utils'
import PerformanceView from '@/views/PerformancesView.vue'
import { getPerformances, deletePerformance, createPerformance } from '@/services/api'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

vi.mock('@/services/api', () => ({
  getPerformances: vi.fn(),
  deletePerformance: vi.fn(),
  createPerformance: vi.fn()
}))

describe('PerformancesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component correctly', () => {
    const wrapper = shallowMount(PerformanceView)
    expect(wrapper.exists()).toBe(true)
  })

  //   it('fetches performances on component mount', async () => {
  //     const performancesMock = [
  //       { _id: '1', name: 'Performance 1', username: 'User 1' },
  //       { _id: '2', name: 'Performance 2', username: 'User 2' }
  //     ]
  //     ;(getPerformances as Mock).mockResolvedValue(performancesMock)

  //     const wrapper = shallowMount(PerformanceView)

  //     await wrapper.vm.$nextTick()

  //     expect(getPerformances).toHaveBeenCalled()
  //     console.log('wrapper.vm.performances', wrapper.vm)
  //     // This might help https://github.com/vuejs/test-utils/issues/972
  //     expect(wrapper.vm.performances).toEqual(performancesMock)
  //   })

  //   it('calls deletePerformance and updates performances on handleDeletePerformance', () => {
  //     const performancesMock = [
  //       { _id: '1', name: 'Performance 1', username: 'User 1', isPublic: true, tracks: [] },
  //       { _id: '2', name: 'Performance 2', username: 'User 2', isPublic: true, tracks: [] }
  //     ]
  //     const performanceId = '1'
  //     ;(deletePerformance as Mock).mockImplementation(() => {
  //       performancesMock.splice(0, 1)
  //     })

  //     const wrapper = shallowMount(PerformanceView)
  //     wrapper.vm.performances = performancesMock

  //     wrapper.vm.handleDeletePerformance(performanceId)

  //     expect(deletePerformance).toHaveBeenCalledWith(performanceId)
  //     expect(wrapper.vm.performances).toHaveLength(1)
  //   })

  //   it('calls createPerformance and updates performances on handleCreatePerformance', async () => {
  //     const performanceName = 'New Performance'
  //     const createdPerformance = { _id: '3', name: performanceName, username: 'User 3' }
  //     const performancesMock = [
  //       { _id: '1', name: 'Performance 1', username: 'User 1', isPublic: true, tracks: [] },
  //       { _id: '2', name: 'Performance 2', username: 'User 2', isPublic: true, tracks: [] }
  //     ]
  //     ;(createPerformance as Mock).mockResolvedValue(createdPerformance)
  //     ;(getPerformances as Mock).mockResolvedValue([...performancesMock, createdPerformance])

  //     const wrapper = shallowMount(PerformanceView)
  //     wrapper.vm.performanceName = performanceName
  //     wrapper.vm.performances = performancesMock

  //     await wrapper.vm.handleCreatePerformance()

  //     expect(createPerformance).toHaveBeenCalledWith(performanceName)
  //     expect(wrapper.vm.performances).toEqual([...performancesMock, createdPerformance])
  //   })
})
