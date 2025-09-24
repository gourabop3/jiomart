export class AdminAuth {
  private static ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123",
  }

  private static SESSION_KEY = "admin_session"

  static login(username: string, password: string): boolean {
    if (username === this.ADMIN_CREDENTIALS.username && password === this.ADMIN_CREDENTIALS.password) {
      if (typeof window !== "undefined") {
        localStorage.setItem(this.SESSION_KEY, "authenticated")
      }
      return true
    }
    return false
  }

  static logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.SESSION_KEY)
    }
  }

  static isAuthenticated(): boolean {
    if (typeof window === "undefined") return false
    return localStorage.getItem(this.SESSION_KEY) === "authenticated"
  }
}
