import { Navigate, createBrowserRouter } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import CustomersPage from '../pages/CustomersPage'
import FilmsPage from '../pages/FilmsPage'
import LandingPage from '../pages/LandingPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/index" replace /> },
      { path: 'index', element: <LandingPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'films', element: <FilmsPage /> },
    ],
  },
])
