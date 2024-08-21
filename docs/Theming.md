# Product Library Web App Theming Details 
This document outlines the process of updating and managing the color scheme for the Product Library Web App. The application leverages a centralized theme.scss file, where all the color variables are defined. These variables are then imported and applied across various widgets to ensure a consistent look and feel.

## Theming Update Steps
1. **Update Colors in `theme.scss`:**
    - Colors are defined as variables in the theme.scss file.
    - Each color is referenced throughout the app using var(--specific-color).
    - To update a color, modify the corresponding hex code or color name in theme.scss.

2. **Importing Colors into Widgets:**
   - The `theme.scss` file is imported into `index.tsx`, which ensures that the theming is applied across the entire application. Individual widget stylesheets do not need to be imported separately.
     ```tsx
     import "./theme.scss";
     ```

3. **Applying Themed Styles to Elements:**
   - Within the widget’s SCSS file, classes are defined to style specific elements.
   - These classes reference the color variables from `theme.scss`.
   - Example:
     ```scss
     .specific-class {
       background-color: var(--primary-color);
     }
     ```

### Color Updates 
Updating the colors in the `theme.scss` file will propagate changes throughout the entire application. Widgets that import these variables will automatically reflect the updated colors.

- **Accent Colors:**
  ```scss
  --primary-color: #XXXXXX;
  --secondary-color: #XXXXXX;
- **Background Colors:**
    ```scss
  --background-color-dark: #XXXXXX;
  --background-color-medium: #XXXXXX;
  --background-color-light: #XXXXXX;
- **Text Colors:**
    ```scss
    --text-color-primary: #XXXXXX;
    --text-color-secondary: #XXXXXX;    
### Dark vs Light Theme
The `theme.scss` file supports both dark and light themes. Each color variable has a corresponding dark and light version, allowing for a seamless theme switch.

- Example:
  ```scss
    :root, body.theme-light {
    --text-color-primary: #{$light-text-primary};
    --text-color-secondary: #{$light-text-secondary};
    }

    body.theme-dark {
    --text-color-primary: #{$dark-text-primary};
    --text-color-secondary: #{$dark-text-secondary};
    }`