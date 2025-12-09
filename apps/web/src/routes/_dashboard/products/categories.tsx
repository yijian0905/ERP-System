import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/_dashboard/products/categories')({
  component: CategoriesRedirect,
});

function CategoriesRedirect() {
  // Redirect to products page - categories are now managed within the products page
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate({ to: '/products', replace: true });
  }, [navigate]);
  
  return null;
}

