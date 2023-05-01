import LoginView from '@/views/LoginView.vue'
import { shallowMount } from '@vue/test-utils'

test('login form has username and password fields', () => {
  const wrapper = shallowMount(LoginView)
  const usernameInput = wrapper.find('#username')
  const passwordInput = wrapper.find('#password')
  expect(usernameInput.exists()).toBe(true)
  expect(passwordInput.exists()).toBe(true)
})
