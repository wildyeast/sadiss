import { mount, shallowMount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

import LoginView from '../LoginView.vue'
import * as api from '../../services/api'
import { createRouter, createWebHistory } from 'vue-router'

describe('LoginView', () => {
  it('should render the component', () => {
    const wrapper = mount(LoginView)
    expect(wrapper.exists()).toBe(true)
  })

  it('should log in with valid credentials', async () => {
    const loginSpy = vi.spyOn(api, 'login')
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div></div>' } }]
    })
    const wrapper = shallowMount(LoginView, {
      global: {
        plugins: [router],
        stubs: ['Button', 'router-link', 'router-view']
      }
    })
    const pushSpy = vi.spyOn(router, 'push')

    // Setting form data
    await wrapper.find('[type="text"]').setValue('mockUsername')
    await wrapper.find('[type="password"]').setValue('mockPassword')

    // Submitting the form
    await wrapper.find('[type="submit"]').trigger('submit.prevent')

    expect(loginSpy).toHaveBeenCalledWith('mockUsername', 'mockPassword')
    expect(pushSpy).toHaveBeenCalledWith({ path: '/' })
  })

  it('should show an error message when no credentials are provided', async () => {
    const mockLogin = vi.fn()
    const wrapper = mount(LoginView, {
      global: {
        stubs: ['Button'],
        mocks: {
          login: mockLogin
        }
      }
    })

    // Submitting the form without filling the inputs
    await wrapper.find('form').trigger('submit.prevent')

    expect(mockLogin).not.toHaveBeenCalled()
    expect(wrapper.find('.error-message').exists()).toBe(true)
  })

  it('should show an error message when the login fails', async () => {
    const mockLogin = vi.fn(() => Promise.reject(new Error('mockError')))
    const wrapper = mount(LoginView, {
      global: {
        stubs: ['Button'],
        mocks: {
          login: mockLogin
        }
      }
    })

    // Setting form data
    await wrapper.find('[type="text"]').setValue('mockUsername')
    await wrapper.find('[type="password"]').setValue('mockPassword')

    // Submitting the form
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.find('.error-message').exists()).toBe(true)
  })
})
