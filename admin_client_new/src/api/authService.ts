import apiClient from "./axiosInstance"

export const login = async (email: string, password: string) => {
  try {
    const response = await apiClient.post<{ message: string }>("/login", {
      email,
      password,
    })
    return response.data.message
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.message || "Login failed")
    } else if (error.request) {
      throw new Error("No response from server. Please try again later.")
    } else {
      throw new Error("An error occurred. Please try again later.")
    }
  }
}

export async function isUserLoggedIn() {
  try {
    const response = await apiClient.get<{
      message: string
      user?: { username: string }
    }>("/is-logged-in")
    return response.data.user
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.message || "Login failed")
    } else if (error.request) {
      throw new Error("No response from server. Please try again later.")
    } else {
      throw new Error("An error occurred. Please try again later.")
    }
  }
}
