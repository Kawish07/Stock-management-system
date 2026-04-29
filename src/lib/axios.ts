import axios from 'axios'
import { queryClient } from '@/lib/queryClient'

const axiosInstance = axios.create({
  baseURL: '/api/erpnext',
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const isLoginPage = window.location.pathname === '/login'

    if (status === 401 && !isLoginPage) {
      queryClient.clear()
      localStorage.removeItem('stockflow-auth')
      window.location.replace('/login')
    }

    return Promise.reject(error)
  }
)

export default axiosInstance