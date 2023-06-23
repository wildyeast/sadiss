import { shallowMount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

import DashboardView from '../DashboardView.vue'

vi.mock('vue-router')

describe('DashboardView', () => {
  it('renders the component correctly', () => {
    const wrapper = shallowMount(DashboardView)

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('Dashboard')
    expect(wrapper.findAll('router-link')).toHaveLength(2)
  })

  it('navigates to performances route', () => {
    const wrapper = shallowMount(DashboardView)
    const performanceLink = wrapper.find('router-link[to="/performances"]')

    expect(performanceLink.exists()).toBe(true)
    expect(performanceLink.text()).toBe('Performances')
  })

  it('navigates to tracks route', () => {
    const wrapper = shallowMount(DashboardView)
    const tracksLink = wrapper.find('router-link[to="/tracks"]')

    expect(tracksLink.exists()).toBe(true)
    expect(tracksLink.text()).toBe('Tracks')
  })
})
