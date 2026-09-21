export function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((character) => '%' + ('00' + character.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

export function getStoredToken() {
  return localStorage.getItem('token')
}

export function getCurrentUser() {
  const token = getStoredToken()
  if (!token) {
    return null
  }

  const decoded = decodeJWT(token)
  if (!decoded) {
    return null
  }

  return {
    id: decoded.id,
    name: decoded.name,
    email: decoded.email,
    role: decoded.role,
  }
}