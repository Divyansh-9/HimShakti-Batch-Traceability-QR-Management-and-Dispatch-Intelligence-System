# Week 3 Wireframes: Detailed Structural Specification

This document provides the detailed structural specification for building the 5 lo-fi Figma wireframes for the HimShakti Batch Traceability system. Follow these instructions to manually create the frames in Figma.

## General Figma Rules
- **Color Palette:** Greyscale only (White backgrounds, Black text, Grey #CCCCCC to #555555 for elements).
- **Typography:** Inter or Roboto, standard sizes (e.g., 14px body, 16px subheading, 24px/32px headers).
- **Placeholders:** Use crossed rectangles (a rectangle with an X drawn inside) for images.
- **Components:** Reuse basic shapes. Do not spend time on exact pixel perfection; focus on layout and hierarchy.

---

## Screen 1: Dashboard
**Frame Size:** Desktop (1440 x 1024)
**Layer Name:** `01_Dashboard`

### Layout Elements
1. **Top Navigation Bar (Height: 64px, 100% width)**
   - Left: HimShakti Logo placeholder (Rectangle, 120x40)
   - Right: Dark/Light toggle icon (Circle, 24x24), User Avatar (Circle, 32x32)
2. **Left Sidebar (Width: 240px, full height below nav)**
   - Navigation links (stacked vertically):
     - Dashboard (Active state - slightly darker background)
     - Batches
     - QR Management
     - Dispatch
     - AI Generator
     - Settings
3. **Main Content Area (Right of sidebar, remaining width)**
   - **Page Title:** "Batch Dashboard" (Text, size 24, bold)
   - **KPI Cards Row (3 cards, equal width, horizontal layout)**
     - Card 1: "Total Batches", Value placeholder (e.g., "1,245")
     - Card 2: "Dispatched", Value placeholder (e.g., "890")
     - Card 3: "Pending QR", Value placeholder (e.g., "355")
   - **Data Table (Full width of content area)**
     - **Headers:** Batch ID, Product Name, Status, QR Generated, Dispatch Date, Actions
     - **Rows (5 placeholders):**
       - Status chips (Rounded rectangles): Dispatched (dark grey bg, white text), Pending (medium grey bg, black text), QR Ready (light grey bg, black text)
       - Actions: "..." or eye icon for view.
     - **Footer:** Pagination controls (Text: "1 of 10", buttons: "<", ">")

---

## Screen 2: Home / Landing
**Frame Size:** Desktop (1440 x 1024)
**Layer Name:** `02_Landing`

### Layout Elements
1. **Top Navigation Bar (Height: 80px, 100% width)**
   - Left: Logo placeholder
   - Center: Nav links (Home, Products, Trace a Batch, Login)
   - Right: CTA Button ("Get Started" - solid grey rectangle)
2. **Hero Section (Height: 500px, 2-column layout)**
   - Left Column:
     - Large Heading: "Trace Your Product from Farm to Table" (Text, size 48, bold)
     - Subtitle: "Ensuring quality and transparency for every batch." (Text, size 18)
     - Two CTA buttons: Primary ("Trace Batch"), Secondary Outline ("Learn More")
   - Right Column: Large Image Placeholder (Rectangle with an X, 500x400)
3. **Features Section (Below Hero)**
   - Section Title: "Why HimShakti?" (Center aligned)
   - **3 Feature Cards (Horizontal row)**
     - Card format: Square icon placeholder (48x48), Heading ("Immutable Records"), 2 lines of lorem ipsum text.
4. **Footer (Height: 200px, 100% width, dark grey background)**
   - Left: Company logo, short description.
   - Middle/Right: 3 columns of links (e.g., "Company", "Resources", "Legal").
   - Bottom: Divider line, copyright text.

---

## Screen 3: Batch Detail / List View
**Frame Size:** Desktop (1440 x 1024)
**Layer Name:** `03_BatchDetail`

### Layout Elements
1. **Top Section**
   - Breadcrumb: "Dashboard > Batches > Batch Detail" (Text, 14px, grey)
   - Back Button: "< Back" (Text or icon)
2. **Content Split (Horizontal, 60/40 ratio)**
   - **Left Half (Batch Info Card)**
     - Title: Batch ID placeholder (e.g., "BAT-2026-001")
     - Fields (Label: Value format):
       - Product Name: Organic Apple Jam
       - Manufacturing Date: 12-Jun-2026
       - Expiry Date: 12-Jun-2027
       - Status badge: QR Ready
       - Weight: 500g
       - Ingredients: Apples, Sugar, Pectin
   - **Right Half (QR Code Action Card)**
     - Large square placeholder for QR Code (250x250, crossed rectangle)
     - Buttons below: "Download QR", "Share Link" (full width of the card)
3. **Traceability Timeline (Full width below the cards)**
   - Title: "Traceability Journey"
   - Horizontal Stepper (4 steps connected by a line):
     - Step 1: Raw Material (Icon, Date, Status: Done)
     - Step 2: Processing (Icon, Date, Status: Done)
     - Step 3: QR Generated (Icon, Date, Status: Current)
     - Step 4: Dispatched (Icon, Date, Status: Pending)

---

## Screen 4: Login / Signup
**Frame Size:** Desktop (1440 x 1024)
**Layer Name:** `04_Auth`

### Layout Elements
1. **Background:** Solid light grey color covering the full frame.
2. **Auth Card (Center of screen, width: 400px, white background with shadow)**
   - **Top:** HimShakti Logo placeholder (Center aligned)
   - **Heading:** "Sign In" (Size 24, bold, center aligned)
   - **Form Fields (stacked):**
     - Email Input: Label "Email", Input rectangle with placeholder "Enter email"
     - Password Input: Label "Password", Input rectangle, "Forgot password?" link on the right of label.
   - **Actions:**
     - Primary Button: "Sign In" (Solid rectangle, full width)
     - Divider: line, "OR", line
     - Secondary Button: "Continue with Google" (Outline rectangle, full width)
   - **Footer:** Text "Don't have an account?", Link "Sign Up"

*(Note: The prompt mentions a Signup form on a second frame, but you can build this adjacent or just focus on the 5 distinct screens. If you want a 6th frame for Signup, duplicate this card and add fields: Full Name, Confirm Password, and a Role Dropdown).*

---

## Screen 5: AI Feature Screen (Product Description Generator)
**Frame Size:** Desktop (1440 x 1024)
**Layer Name:** `05_AIGenerator`

### Layout Elements
1. **Top Section**
   - Page Title: "AI Product Description Generator"
2. **Main Layout (2-column, 50/50 split)**
   - **Left Panel (Input Form)**
     - Product Name (Input rectangle)
     - Key Ingredients (Textarea rectangle, taller)
     - Weight/Quantity (Input rectangle)
     - Key Features (Textarea rectangle)
     - Tone Selector (Label "Tone", followed by 3 segmented toggle buttons: [Premium] [Traditional] [Health-Focused])
     - Action: "Generate Description" Button (Primary style, full width)
   - **Right Panel (Output Area)**
     - Heading: "Generated Description"
     - Output Box: Large text area containing 3 paragraphs of placeholder text (Lorem ipsum).
     - Character count: "450 characters" (Bottom right of the text area, small grey text)
     - Action Buttons Row (Below text area):
       - "Regenerate" (Icon + text button)
       - "Copy to Clipboard" (Icon + text button)
       - "Edit" (Icon + text button)

---

## Export Instructions
1. Select all 5 frames (Click and drag or Shift+Click each frame name in the layers panel).
2. Go to **File -> Export frames to PDF**.
3. Name the file `W3_Wireframes_[YourInternID].pdf`.

---

## 🚀 Quick Setup: Wireframe Designer Plugin Prompts

If you are using the **Wireframe Designer** plugin in Figma as per the assignment instructions, copy and paste these exact prompts to generate the screens quickly:

### Screen 1 — Dashboard
```text
Lo-fi wireframe for a batch management dashboard. 
Top: navbar with logo left, dark/light toggle right, user avatar right.
Left sidebar: nav items — Dashboard, Batches, QR Management, Dispatch, AI Generator, Settings.
Main content: page title "Batch Dashboard", 3 KPI cards in a row (Total Batches, Dispatched, Pending QR).
Below: data table with columns — Batch ID, Product Name, Status chip, QR Generated, Dispatch Date, Actions.
Status chips: Dispatched (dark), Pending (medium grey), QR Ready (light grey).
Bottom of table: pagination controls.
Desktop frame 1440x1024. Greyscale only.
```

### Screen 2 — Home / Landing
```text
Lo-fi wireframe for a company landing page. Desktop 1440x1024. Greyscale only. Single viewport, no scrolling.

Top navbar (height 64px): grey rectangle logo placeholder left (120x40), 
nav links center (Home, Products, Trace a Batch, Login as text links), 
one solid grey CTA button right labelled "Get Started".

Hero section (below navbar, 2-column layout, height ~400px):
  Left column: large bold heading text block (3 lines placeholder), 
  subtitle text (2 lines placeholder), 
  two side-by-side buttons (primary solid "Trace a Batch", outline secondary "Learn More").
  Right column: large grey crossed-rectangle image placeholder (500x300).

Features section (below hero, full width):
  Section heading text "Why HimShakti?" centered.
  3 equal-width feature cards in a row, each with: 
    grey square icon placeholder (48x48), 
    bold heading text, 
    2 lines of placeholder body text.

Footer (height 80px, dark grey background, full width):
  Left: company name text. Center: 3 short text link columns. 
  Bottom divider line, copyright text.

No duplicate sections. No annotation boxes.
```

### Screen 3 — Batch Detail / List View
```text
Lo-fi wireframe for a batch detail page. Desktop 1440x1024. Greyscale only. Single viewport, no scrolling.

Top bar (below main navbar):
  Breadcrumb text: Dashboard > Batches > BAT-10421. 
  "← Back" text button left-aligned.

Main content (2-column layout, 60/40 split):
  Left column — Batch Info Card (grey border box):
    Bold title: "BAT-10421".
    Label/value rows (stacked):
      Product Name: Nimbus Bottle
      Manufacturing Date: 2026-06-01
      Expiry Date: 2027-06-01
      Status: rounded pill badge "QR Ready"
      Weight: 500g
      Ingredients: Water, Minerals
    
  Right column — QR Code Card (grey border box):
    Large grey crossed-rectangle placeholder (250x250) centred, labelled "QR Code".
    Two full-width buttons below: solid "Download QR", outline "Share Link".

Traceability Timeline (full width below both columns, height ~180px):
  Section heading: "Traceability Journey".
  Horizontal stepper with 4 steps connected by a line:
    Step 1: grey circle icon, label "Raw Material", date "01 Jun", status "✓ Done".
    Step 2: grey circle icon, label "Processing", date "05 Jun", status "✓ Done".
    Step 3: filled circle icon, label "QR Generated", date "10 Jun", status "Current".
    Step 4: empty circle icon, label "Dispatched", date "TBD", status "Pending".

No duplicate sections. No annotation boxes.
```

### Screen 4 — Login / Signup
```text
Lo-fi wireframe for an authentication page. Desktop 1440x1024. Greyscale only. Single viewport.

Background: full-frame light grey fill.

Center-aligned auth card (width 400px, white background, subtle grey border, centred both axes):
  Grey rectangle logo placeholder top center (120x40).
  Bold heading text "Sign In" centered.
  
  Form fields (stacked, full card width):
    Label "Email" + input rectangle below.
    Label "Password" + input rectangle below + 
      small "Forgot password?" text link right-aligned.
  
  Primary solid button full-width: "Sign In".
  Horizontal divider: line — "OR" — line.
  Outline button full-width: "Continue with Google".
  
  Small footer text below card: "Don't have an account?" + "Sign Up" text link.

No second frame. No duplicate sections. No annotation boxes. Single clean card.
```

### Screen 5 — AI Feature Screen (Product Description Generator)
```text
Lo-fi wireframe for an AI text generation tool page. Desktop 1440x1024. Greyscale only. Single viewport, no scrolling.

Top section (full width):
  Page title heading: "AI Product Description Generator".
  Subtitle text: "Generate marketing descriptions for your batches."

Main content (2-column layout, 50/50 split, below page title):
  Left panel — Input Form (grey border card):
    Panel heading: "Product Details".
    Form fields stacked:
      Label "Product Name" + input rectangle.
      Label "Key Ingredients" + tall textarea rectangle (3 lines).
      Label "Weight / Quantity" + input rectangle.
      Label "Key Features" + tall textarea rectangle (3 lines).
    Tone Selector row:
      Label "Tone:"
      3 adjacent toggle buttons: [Premium] [Traditional] [Health-Focused]. 
      "Traditional" shown as active/selected (darker border).
    Primary solid full-width button at bottom: "Generate Description".
  
  Right panel — Output Card (grey border card):
    Panel heading: "Generated Description".
    Large tall text area (read-only look) with 5 lines of lorem ipsum placeholder text.
    Character count small text bottom-right of textarea: "450 / 800 characters".
    Action buttons row below textarea (3 buttons, left-aligned):
      Outline button "↺ Regenerate".
      Outline button "⧉ Copy to Clipboard".
      Outline button "✎ Edit".

No duplicate sections. No annotation boxes. No styles guide.
```
