const ADMIN_KEY = 'tgaide_admin_auth'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

export function isAdminAuthenticated() {
  return localStorage.getItem(ADMIN_KEY) === 'true'
}

export function adminLogin(password) {
  if (password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_KEY, 'true')
    return true
  }
  return false
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_KEY)
}
