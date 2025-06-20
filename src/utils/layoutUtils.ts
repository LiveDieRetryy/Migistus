// Layout utilities for pages

// Use this at the bottom of any page component to disable footer
// Example: 
// PageComponent.showFooter = false;

// Use this for custom page layouts
// Example:
// PageComponent.getLayout = function getLayout(page: ReactElement) {
//   return (
//     <CustomLayout>
//       {page}
//     </CustomLayout>
//   )
// }

export const withoutFooter = (Component: any) => {
  Component.showFooter = false;
  return Component;
};

export const withCustomLayout = (Component: any, getLayout: (page: any) => any) => {
  Component.getLayout = getLayout;
  return Component;
};
