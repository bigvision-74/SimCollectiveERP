// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// // import useAuth from '../AuthRoutes';
// import { useAuth } from '../AuthRoutes';

// import './style.css';

// interface Settings {
//   site_logo?: string;
// }

// interface User {
//   role: string;
//   verification_code_verified: number;
// }

// interface HeaderProps {
//   settings: Settings | null;
//   user: User | null;
// }

// const Header: React.FC<HeaderProps> = ({ settings, user }) => {
//   const [isScrolled, setIsScrolled] = useState(false);
//   const [isMenuOpen, setIsMenuOpen] = useState(false);

//   const siteLogoUrl = settings?.site_logo || '';

//   const { authenticated, role } = useAuth();
//   const token = localStorage.getItem('token');

//   const determineDashboard = (role: string | null) => {
//     switch (role) {
//       case 'Superadmin':
//         return '/dashboard';
//       case 'admin':
//         return '/admin-dashboard';
//       case 'manager':
//         return '/dashboard-instructor';
//       case 'worker':
//         return '/user-dashboard';
//       default:
//         return '/login';
//     }
//   };

//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 1);
//     };

//     window.addEventListener('scroll', handleScroll);
//     return () => {
//       window.removeEventListener('scroll', handleScroll);
//     };
//   }, []);

//   const toggleMenu = () => {
//     setIsMenuOpen(!isMenuOpen);
//   };

//   return (
//     <header
//       className={`header fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
//         isScrolled ? 'scrollColor shadow-lg' : 'bg-transparent'
//       }`}
//     >
//       <div className='container mx-auto flex justify-between items-center py-4'>
//         {/* Logo */}
//         <div className='logo'>
//           <a href='/'>
//             {settings?.site_logo ? (
//               <img
//                 className='mt-1'
//                 src={`${settings.site_logo}`}
//                 alt='Logo'
//                 style={{ height: '65px' }}
//               />
//             ) : (
//               <img
//                 src='/src/assetsA/images/Final-logo-InsightXR.png'
//                 alt='Logo'
//                 style={{ height: '65px' }}
//               />
//             )}
//           </a>
//         </div>

//         {/* Mobile Menu Button */}
//         <button className='mobile-menu-btn' onClick={toggleMenu}>
//           ☰
//         </button>

//         {/* Navigation */}
//         <nav id='navmenu' className={`navmenu ${isMenuOpen ? 'active' : ''}`}>
//           <ul className='flex space-x-8'>
//             <li>
//               <a href='#' className='active text-white '>
//                 Product
//               </a>
//             </li>
//             <li className='relative group'>
//               <a href='#' className='text-white  flex items-center'>
//                 <span>Solutions</span>
//                 <i className='bi bi-chevron-down ml-1'></i>
//               </a>
//               {/* Dropdown */}
//               <ul className='absolute left-0 hidden mt-2 bg-white text-#d45435 p-4 rounded shadow-lg group-hover:block solutionDropdown'>
//                 <li>
//                   <a
//                     href='/enterprisePage'
//                     className='block px-4 py-2 hover:bg-gray-700'
//                   >
//                     Enterprise
//                   </a>
//                 </li>
//                 <li>
//                   <a
//                     href='/academic-instutions'
//                     className='block px-4 py-2 hover:bg-gray-700'
//                   >
//                     Academic Institutions
//                   </a>
//                 </li>
//                 <li>
//                   <a
//                     href='/healthcarePage'
//                     className='block px-4 py-2 hover:bg-gray-700'
//                   >
//                     Healthcare
//                   </a>
//                 </li>
//               </ul>
//             </li>
//             <li>
//               <a href='#' className='text-white '>
//                 InsightXR & Analytics Resources
//               </a>
//             </li>
//             <li>
//               <a href='/pricingPage' className='text-white hover:text-#d45425'>
//                 Pricing
//               </a>
//             </li>
//           </ul>
//         </nav>

//         {/* Authentication Button */}
//         <div className='flex items-center mt-4 lg:mt-0'>
//           {authenticated && token ? (
//             <Link
//               className='btn  text-lg  ml-4 px-3 py-2 text-white rounded-lg  '
//               to={determineDashboard(role)}
//               style={{
//                 backgroundColor: 'rgb(253 111 57)',
//               }}
//             >
//               Dashboard
//             </Link>
//           ) : (
//             <Link
//               className='btn btn-get-started text-lg  ml-4 px-3 py-2 text-white rounded-lg hover:text-white '
//               style={{
//                 backgroundColor: 'rgb(253 111 57)',
//               }}
//               to='/login'
//             >
//               Sign in
//             </Link>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;
