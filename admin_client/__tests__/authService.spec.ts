import axios from "axios"
import MockAdapter from "axios-mock-adapter"
import { login } from "../src/api"
import { describe, afterEach, it, expect } from "vitest"

const mock = new MockAdapter(axios)

describe("login function", () => {
  afterEach(() => {
    mock.reset()
  })

  it("should return a message on successful login", async () => {
    mock.onPost("/login").reply(200)
  })

  it("should throw an error with a message when API returns an error response", async () => {
    mock.onPost("/login").reply(401)

    await expect(login("test@example.com", "wrongpassword")).rejects.toThrow(
      Error
    )
  })

  it("should throw a network error when there is no response from the server", async () => {
    mock.onPost("/login").networkError()

    await expect(login("test@example.com", "password123")).rejects.toThrow(
      Error
    )
  })

  it("should throw a generic error when an unknown error occurs", async () => {
    mock.onPost("/login").reply(500)

    await expect(login("test@example.com", "password123")).rejects.toThrow(
      Error
    )
  })
})
