import apiClient from "./axiosInstance"
import i18n from "../i18n.config"

const t = i18n.global.t

export const login = async (email: string, password: string) => {
  try {
    const response = await apiClient.post<{ message: string }>("/login", {
      email,
      password,
    })
    return response.data.message
  } catch (error: any) {
    if (error.response) {
      switch (error.response.status) {
        case 400:
          throw new Error(t("error.invalidInput"))
        case 401:
          throw new Error(t("error.incorrectCredentials"))
        default:
          throw new Error(t("error.anErrorOccurred"))
      }
    } else if (error.request) {
      throw new Error(t("error.noResponseFromServer"))
    } else {
      throw new Error(t("error.anErrorOccurred"))
    }
  }
}

export async function isUserLoggedIn() {
  try {
    const response = await apiClient.get<{
      message: string
      userId: string
    }>("/is-logged-in")
    return response.data.userId
  } catch (error: any) {
    if (error.response) {
      const errorCode = error.response.data.code || "INVALID_LOGIN"
      throw new Error(t(`error.${errorCode}`))
    } else if (error.request) {
      throw new Error(t("error.noResponseFromServer"))
    } else {
      throw new Error(t("error.anErrorOccurred"))
    }
  }
}

export async function logout() {
  try {
    const response = await apiClient.get<{ message: string }>("/logout")

    return response.data.message
  } catch (error: any) {
    if (error.response) {
      throw new Error(t("error.logoutFailed"))
    } else if (error.request) {
      throw new Error(t("error.noResponseFromServer"))
    } else {
      throw new Error(t("error.anErrorOccurred"))
    }
  }
}
