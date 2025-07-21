export const generateBreadcrumbs = (pathname: string) => {
  const path = pathname.split('?')[0];
  const paths = path.split('/').filter(Boolean); 
  
  const breadcrumbs = paths.map((segment, index) => {
    const href = `/${paths.slice(0, index + 1).join('/')}`;
    const title = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return {
      href,
      title,
      active: index === paths.length - 1
    };
  });

  if (breadcrumbs.length === 0 || breadcrumbs[0].href !== '/dashboard') {
    breadcrumbs.unshift({
      href: '/dashboard',
      title: 'Dashboard',
      active: breadcrumbs.length === 0
    });
  }

  return breadcrumbs;
};